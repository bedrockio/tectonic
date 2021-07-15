const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate, fetchCredential } = require('../lib/middleware/authenticate');
const { terms, timeSeries, search, stats, cardinality, getCollectionIndex } = require('../lib/analytics');
const { Collection } = require('../models');

const router = new Router();

const filterOptions = {
  from: Joi.number().default(0),
  size: Joi.number().positive().default(100),
  terms: Joi.array().items(Joi.object()),
  range: Joi.object(),
  notExists: Joi.string(),
  exists: Joi.string(),
  minTimestamp: Joi.number(),
  q: Joi.string(),
};

function interpretError(ctx, error, searchQuery) {
  const { meta } = error;
  const indexNotFound = error.message.match(/index_not_found_exception/i);

  if (meta && meta.body && meta.body.error.reason) {
    const message = indexNotFound ? `Elasticsearch index not found` : `Elasticsearch error: ${meta.body.error.reason}`;
    const status = indexNotFound ? 404 : 400;
    ctx.type = 'json';
    ctx.status = status;
    ctx.body = {
      error: { message, status, searchQuery },
    };
  } else {
    throw error;
  }
}

async function checkCollectionAccess(ctx, next) {
  const { collection } = ctx.request.body;
  const dbCollection = await Collection.findByIdOrName(collection);
  if (!dbCollection) {
    ctx.throw(401, `Collection '${collection}' could not be found`);
  }
  const collectionId = dbCollection.id;

  // Give admin user and application credential full access
  if (ctx.state.authUser || ctx.state.authApplicationCredential) {
    ctx.state.accessPolicyCollection = {
      collectionId,
    };
    return next();
  }

  // Check Access credential
  const { accessPolicy, scopeValues } = ctx.state.authAccessCredential;
  if (!accessPolicy || !accessPolicy.collections || !Array.isArray(accessPolicy.collections)) {
    ctx.throw(401, `AccessCredential is missing valid accessPolicy`);
  }
  const accessPolicyCollection = accessPolicy.collections.find(
    ({ collectionId: cid }) => collectionId == cid.toString()
  );
  if (!accessPolicyCollection) {
    ctx.throw(401, `AccessPolicy has no access to collectionId: ${collectionId}`);
  }
  if (accessPolicyCollection.scopeString) {
    accessPolicyCollection.scope = JSON.parse(accessPolicyCollection.scopeString);
  }

  // check scopeFields
  if (accessPolicyCollection.scopeFields && accessPolicyCollection.scopeFields.length != 0) {
    if (!scopeValues || !scopeValues.length) {
      ctx.throw(401, `Missing scopeValues on access credential`);
    }
    for (const scopeField of accessPolicyCollection.scopeFields) {
      const scopeValue = scopeValues.find(({ field }) => scopeField == field);
      if (!scopeValue || !scopeValue.value) {
        ctx.throw(401, `Missing scopeValues for field '${scopeField}'`);
      }

      // Add to scope
      if (!accessPolicyCollection.scope) accessPolicyCollection.scope = {};
      accessPolicyCollection.scope[scopeField] = scopeValue.value;
    }
  }

  ctx.state.accessPolicyCollection = accessPolicyCollection;
  return next();
}

router
  .use(authenticate({ types: ['access', 'user', 'application'] }))
  .use(fetchCredential)
  .post(
    '/terms',
    validate({
      body: Joi.object({
        collection: Joi.string().required(),
        filter: Joi.object(filterOptions),
        aggField: Joi.string().required(),
        aggFieldOrder: Joi.string().valid('desc', 'asc'),
        field: Joi.string().optional(),
        operation: Joi.string().optional(),
        includeTopHit: Joi.boolean().default(false).optional(),
        referenceFetch: Joi.object().optional(),
        termsSize: Joi.number().optional(),
        debug: Joi.boolean().default(false).optional(),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const {
        filter = {},
        aggField,
        aggFieldOrder,
        field,
        operation,
        includeTopHit,
        referenceFetch,
        termsSize,
        debug,
      } = ctx.request.body;
      const { collectionId, scope } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      const options = {
        ...filter,
        field,
        aggFieldOrder,
        operation,
        includeTopHit,
        referenceFetch,
        termsSize,
      };
      try {
        const body = {};
        if (debug) {
          const searchQuery = await terms(index, aggField, options, true);
          body.meta = { searchQuery };
        }
        body.data = await terms(index, aggField, options, false);
        ctx.body = body;
      } catch (err) {
        const searchQuery = await terms(index, aggField, options, true);
        interpretError(ctx, err, searchQuery);
      }
    }
  )
  .post(
    '/time-series',
    validate({
      body: Joi.object({
        collection: Joi.string().required(),
        filter: Joi.object(filterOptions),
        operation: Joi.string().required(),
        field: Joi.string().optional(),
        interval: Joi.string().optional(),
        dateField: Joi.string().optional(),
        timeZone: Joi.string().optional(),
        debug: Joi.boolean().default(false).optional(),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { filter = {}, operation, field, interval, dateField, timeZone, debug } = ctx.request.body;
      const { collectionId, scope } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      const options = {
        interval,
        dateField,
        timeZone,
        ...filter,
      };
      try {
        const body = {};
        if (debug) {
          const searchQuery = await timeSeries(index, operation, field, options, true);
          body.meta = { searchQuery };
        }
        body.data = await timeSeries(index, operation, field, options, false);
        ctx.body = body;
      } catch (err) {
        const searchQuery = await timeSeries(index, operation, field, options, true);
        interpretError(ctx, err, searchQuery);
      }
    }
  )
  .post(
    '/search',
    validate({
      body: Joi.object({
        collection: Joi.string().required(),
        filter: Joi.object(filterOptions),
        debug: Joi.boolean().default(false).optional(),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { filter = {}, debug } = ctx.request.body;
      // console.info('filter', filter);
      const { collectionId, scope, includeFields, excludeFields } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      try {
        const body = { meta: {} };
        if (debug) {
          const searchQuery = await search(index, filter, includeFields, excludeFields, true);
          body.meta.searchQuery = searchQuery;
        }
        const data = await search(index, filter, includeFields, excludeFields, false);
        const hits = data?.hits?.hits.map(({ _id, _source }) => {
          _source._id = _id;
          return _source;
        });
        body.data = hits || [];
        if (data?.hits?.total?.value) body.meta.total = data.hits.total.value;
        if (data?.took) body.meta.took = data.took;
        ctx.body = body;
      } catch (err) {
        const searchQuery = await search(index, filter, includeFields, excludeFields, true);
        interpretError(ctx, err, searchQuery);
      }
    }
  )
  .post(
    '/stats',
    validate({
      body: Joi.object({
        collection: Joi.string().required(),
        filter: Joi.object(filterOptions),
        fields: Joi.array().items(Joi.string()),
        debug: Joi.boolean().default(false).optional(),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { filter = {}, fields = [], debug } = ctx.request.body;
      const { collectionId, scope } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      try {
        const body = {};
        if (debug) {
          const searchQuery = await stats(index, fields, filter, true);
          body.meta = { searchQuery };
        }
        body.data = await stats(index, fields, filter, false);
        ctx.body = body;
      } catch (err) {
        const searchQuery = await stats(index, fields, filter, true);
        interpretError(ctx, err, searchQuery);
      }
    }
  )
  .post(
    '/cardinality',
    validate({
      body: Joi.object({
        collection: Joi.string().required(),
        filter: Joi.object(filterOptions),
        fields: Joi.array().items(Joi.string()),
        debug: Joi.boolean().default(false).optional(),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { filter = {}, fields, debug } = ctx.request.body;
      const { collectionId, scope } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      try {
        const body = {};
        if (debug) {
          const searchQuery = await cardinality(index, fields, filter, true);
          body.meta = { searchQuery };
        }
        body.data = await cardinality(index, fields, filter, false);
        ctx.body = body;
      } catch (err) {
        const searchQuery = await cardinality(index, fields, filter, true);
        interpretError(ctx, err, searchQuery);
      }
    }
  );

module.exports = router;
