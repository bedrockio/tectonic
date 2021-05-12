const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate, fetchPolicy } = require('../lib/middleware/authenticate');
const { terms, timeSeries, search, stats, cardinality, getCollectionIndex } = require('../lib/analytics');

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
  if (meta.body && meta.body.error.reason) {
    throw new Error(`Elasticsearch error: ${meta.body.error.reason}`);
  }
  if (error.message.match(/index_not_found_exception/i)) {
    throw new Error(`Elasticsearch index not found`);
  }
  throw error;
}

async function checkCollectionAccess(ctx, next) {
  const { authPolicy } = ctx.state;
  const { collectionId } = ctx.request.body;
  const collection = authPolicy.collections.find(({ collectionId: cid }) => collectionId == cid.toString());
  const containsCollection = !!collection;
  if (!containsCollection) {
    ctx.throw(401, `policy has no access to collectionId: ${collectionId}`);
  }
  ctx.state.policyCollection = collection;
  return next();
}

router
  .use(authenticate())
  .use(fetchPolicy)
  .post(
    '/terms',
    validate({
      body: Joi.object({
        collectionId: Joi.string().required(),
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
        collectionId,
        filter = {},
        aggField,
        aggFieldOrder,
        field,
        operation,
        includeTopHit,
        referenceFetch,
        termsSize,
      } = ctx.request.body;
      const index = getCollectionIndex(collectionId);
      filter.scope = ctx.state.policyCollection.scope; // Each scope key-value pair is added as ES bool.must.term
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
        collectionId: Joi.string().required(),
        filter: Joi.object(filterOptions),
        operation: Joi.string().required(),
        field: Joi.string().optional(),
        interval: Joi.string(),
        dateField: Joi.string(),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { collectionId, filter = {}, operation, field, interval, dateField } = ctx.request.body;
      const index = getCollectionIndex(collectionId);
      filter.scope = ctx.state.policyCollection.scope;
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
        collectionId: Joi.string().required(),
        filter: Joi.object(filterOptions),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { collectionId, filter = {} } = ctx.request.body;
      // console.info('filter', filter);
      const index = getCollectionIndex(collectionId);
      filter.scope = ctx.state.policyCollection.scope;
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
        collectionId: Joi.string().required(),
        filter: Joi.object(filterOptions),
        fields: Joi.array().items(Joi.string()),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { collectionId, filter = {}, fields } = ctx.request.body;
      const index = getCollectionIndex(collectionId);
      filter.scope = ctx.state.policyCollection.scope;
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
        collectionId: Joi.string().required(),
        filter: Joi.object(filterOptions),
        fields: Joi.array().items(Joi.string()),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { collectionId, filter = {}, fields } = ctx.request.body;
      const index = getCollectionIndex(collectionId);
      filter.scope = ctx.state.policyCollection.scope;
      try {
        ctx.body = await cardinality(index, fields, filter);
      } catch (err) {
        interpretError(err);
      }
    }
  );

module.exports = router;
