const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate, fetchCredential, fetchAccessPolicyCollection } = require('../lib/middleware/authenticate');
const { terms, timeSeries, timeMap, search, stats, cardinality, getCollectionIndex } = require('../lib/analytics');

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
  ids: Joi.array().items(Joi.string()),
};

function interpretError(ctx, error, searchQuery) {
  const { meta } = error;
  const indexNotFound = error.message.match(/index_not_found_exception/i);

  if (meta && meta.body && meta.body.error.reason) {
    let message = indexNotFound ? `Elasticsearch index not found` : `Elasticsearch error: ${meta.body.error.reason}`;
    if (!indexNotFound && meta.body.error.caused_by?.type && meta.body.error.caused_by?.reason) {
      message += `, caused by ${meta.body.error.caused_by.type}: ${meta.body.error.caused_by.reason}`;
    }
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

router
  .use(authenticate({ types: ['access', 'user', 'application'] }))
  .use(fetchCredential)
  .use(fetchAccessPolicyCollection)
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
        termsSize: Joi.number().optional(),
        debug: Joi.boolean().default(false).optional(),
      }),
    }),
    async (ctx) => {
      const {
        filter = {},
        aggField,
        aggFieldOrder,
        field,
        operation,
        includeTopHit,
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
        operation: Joi.string().optional(),
        field: Joi.string().optional(),
        interval: Joi.string().optional(),
        dateField: Joi.string().optional(),
        timeZone: Joi.string().optional(),
        debug: Joi.boolean().default(false).optional(),
      }),
    }),
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
    '/time-map',
    validate({
      body: Joi.object({
        collection: Joi.string().required(),
        filter: Joi.object(filterOptions),
        interval: Joi.string().optional(),
        dateField: Joi.string().optional(),
        timeZone: Joi.string().optional(),
        debug: Joi.boolean().default(false).optional(),
      }),
    }),
    async (ctx) => {
      const { filter = {}, interval, dateField, timeZone, debug } = ctx.request.body;
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
          const searchQuery = await timeMap(index, options, true);
          body.meta = { searchQuery };
        }
        body.data = await timeMap(index, options, false);
        ctx.body = body;
      } catch (err) {
        const searchQuery = await timeMap(index, options, true);
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
    async (ctx) => {
      const { filter = {}, debug } = ctx.request.body;
      const { collectionId, scope, includeFields, excludeFields } = ctx.state.accessPolicyCollection;
      const index = getCollectionIndex(collectionId);
      const options = {
        scope,
        includeFields,
        excludeFields,
        ...filter,
      };
      try {
        const body = { meta: {} };
        if (debug) {
          const searchQuery = await search(index, options, true);
          body.meta.searchQuery = searchQuery;
        }
        const data = await search(index, options, false);
        const hits = data?.hits?.hits.map(({ _id, _source }) => {
          return { _id, _source };
        });
        body.data = hits || [];
        if (data?.hits?.total?.value) body.meta.total = data.hits.total.value;
        if (data?.took) body.meta.took = data.took;
        ctx.body = body;
      } catch (err) {
        const searchQuery = await search(index, options, true);
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
