const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate, fetchAccessCredential } = require('../lib/middleware/authenticate');
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

function interpretError(error) {
  const { meta } = error;
  if (meta && meta.body && meta.body.error.reason) {
    throw new Error(`Elasticsearch error: ${meta.body.error.reason}`);
  }
  if (error.message.match(/index_not_found_exception/i)) {
    throw new Error(`Elasticsearch index not found`);
  }
  throw error;
}

async function checkCollectionAccess(ctx, next) {
  const { collection } = ctx.request.body;
  const dbCollection = await Collection.findByIdOrName(collection);
  if (!dbCollection) {
    ctx.throw(401, `Collection '${collection}' could not be found`);
  }
  const collectionId = dbCollection.id;

  const { accessPolicy, scopeArgs } = ctx.state.authAccessCredential;
  if (!accessPolicy || !accessPolicy.collections || !Array.isArray(accessPolicy.collections)) {
    ctx.throw(401, `AccessCredential is missing valid accessPolicy`);
  }
  const accessPolicyCollection = accessPolicy.collections.find(
    ({ collectionId: cid }) => collectionId == cid.toString()
  );
  if (!accessPolicyCollection) {
    ctx.throw(401, `AccessPolicy has no access to collectionId: ${collectionId}`);
  }
  accessPolicyCollection.scope = accessPolicyCollection.scope || {};
  // check scopeParams
  if (accessPolicyCollection.scopeParams && accessPolicyCollection.scopeParams.length != 0) {
    for (const param of accessPolicyCollection.scopeParams) {
      if (!Object.keys(scopeArgs).includes(param)) {
        ctx.throw(401, `Missing scopeArgs for policy scopeParams`);
      }
      // Add to scope
      accessPolicyCollection.scope[param] = scopeArgs[param];
    }
  }

  ctx.state.accessPolicyCollection = accessPolicyCollection;
  return next();
}

router
  .use(authenticate())
  .use(fetchAccessCredential)
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
      } = ctx.request.body;
      const { collectionId, scope } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      try {
        ctx.body = await terms(index, aggField, {
          ...filter,
          field,
          aggFieldOrder,
          operation,
          includeTopHit,
          referenceFetch,
          termsSize,
        });
      } catch (err) {
        interpretError(err);
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
        interval: Joi.string(),
        dateField: Joi.string(),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { filter = {}, operation, field, interval, dateField } = ctx.request.body;
      const { collectionId, scope } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      try {
        ctx.body = await timeSeries(index, operation, field, {
          interval,
          dateField,
          ...filter,
        });
      } catch (err) {
        interpretError(err);
      }
    }
  )
  .post(
    '/search',
    validate({
      body: Joi.object({
        collection: Joi.string().required(),
        filter: Joi.object(filterOptions),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { filter = {} } = ctx.request.body;
      // console.info('filter', filter);
      const { collectionId, scope } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      try {
        // console.info(JSON.stringify(filter, null, 2));
        ctx.body = await search(index, filter);
      } catch (err) {
        interpretError(err);
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
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { filter = {}, fields = [] } = ctx.request.body;
      const { collectionId, scope } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      try {
        ctx.body = await stats(index, fields, filter);
      } catch (err) {
        interpretError(err);
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
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { filter = {}, fields } = ctx.request.body;
      const { collectionId, scope } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      filter.scope = scope; // Each scope key-value pair is added as ES bool.must.term
      try {
        ctx.body = await cardinality(index, fields, filter);
      } catch (err) {
        interpretError(err);
      }
    }
  );

module.exports = router;
