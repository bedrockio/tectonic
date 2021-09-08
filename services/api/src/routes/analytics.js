const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const {
  authenticate,
  fetchCredential,
  fetchCollection,
  fetchAccessPolicyCollection,
} = require('../lib/middleware/authenticate');
const { terms, timeSeries, timeMap, search, stats, cardinality, getCollectionIndex } = require('../lib/analytics');
const {
  interpretAnalyticsError,
  checkFieldInclusion,
  checkFilterInclusion,
  checkTermsDepth,
} = require('../lib/middleware/utils');

const router = new Router();

const filterOptions = {
  from: Joi.number().default(0),
  size: Joi.number().positive().default(100),
  terms: Joi.array().items(Joi.object()),
  range: Joi.object(),
  ranges: Joi.array().items(Joi.object()),
  notExists: Joi.string(),
  exists: Joi.string(),
  minTimestamp: Joi.number(),
  q: Joi.string(),
  ids: Joi.array().items(Joi.string()),
};

router
  .use(authenticate({ types: ['access', 'user', 'application'] }))
  .use(fetchCredential)
  .use(fetchCollection)
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
      const { collectionId, scope, scopeValues, includeFields, excludeFields } = ctx.state.accessPolicyCollection;

      checkFieldInclusion(ctx, 'aggField', aggField, includeFields, excludeFields);
      checkFilterInclusion(ctx, filter, includeFields, excludeFields);
      checkTermsDepth(ctx, filter.terms);

      const index = getCollectionIndex(collectionId);
      const options = {
        ...filter,
        scope,
        scopeValues,
        field,
        aggFieldOrder,
        operation,
        includeTopHit,
        termsSize,
        includeFields,
        excludeFields,
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
        interpretAnalyticsError(ctx, err, searchQuery);
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
      const { collectionId, scope, scopeValues, includeFields, excludeFields } = ctx.state.accessPolicyCollection;

      if (field) checkFieldInclusion(ctx, 'Field', field, includeFields, excludeFields);
      checkFilterInclusion(ctx, filter, includeFields, excludeFields);
      checkTermsDepth(ctx, filter.terms);

      const index = getCollectionIndex(collectionId);
      const options = {
        interval,
        dateField,
        timeZone,
        scope,
        scopeValues,
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
        interpretAnalyticsError(ctx, err, searchQuery);
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
      const { collectionId, scope, scopeValues, includeFields, excludeFields } = ctx.state.accessPolicyCollection;

      checkFilterInclusion(ctx, filter, includeFields, excludeFields);
      checkTermsDepth(ctx, filter.terms);

      const index = getCollectionIndex(collectionId);
      const options = {
        interval,
        dateField,
        timeZone,
        scope,
        scopeValues,
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
        interpretAnalyticsError(ctx, err, searchQuery);
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
      const { collectionId, scope, scopeValues, includeFields, excludeFields } = ctx.state.accessPolicyCollection;

      checkFilterInclusion(ctx, filter, includeFields, excludeFields);
      checkTermsDepth(ctx, filter.terms);

      const index = getCollectionIndex(collectionId);
      const options = {
        scope,
        scopeValues,
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
        interpretAnalyticsError(ctx, err, searchQuery);
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
      const { collectionId, scope, scopeValues, includeFields, excludeFields } = ctx.state.accessPolicyCollection;

      for (const field of fields) {
        checkFieldInclusion(ctx, 'Field', field, includeFields, excludeFields);
      }
      checkFilterInclusion(ctx, filter, includeFields, excludeFields);
      checkTermsDepth(ctx, filter.terms);

      const index = getCollectionIndex(collectionId);
      const options = {
        scope,
        scopeValues,
        ...filter,
      };
      try {
        const body = {};
        if (debug) {
          const searchQuery = await stats(index, fields, options, true);
          body.meta = { searchQuery };
        }
        body.data = await stats(index, fields, options, false);
        ctx.body = body;
      } catch (err) {
        const searchQuery = await stats(index, fields, options, true);
        interpretAnalyticsError(ctx, err, searchQuery);
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
      const { collectionId, scope, scopeValues, includeFields, excludeFields } = ctx.state.accessPolicyCollection;

      for (const field of fields) {
        checkFieldInclusion(ctx, 'Field', field, includeFields, excludeFields);
      }
      checkFilterInclusion(ctx, filter, includeFields, excludeFields);
      checkTermsDepth(ctx, filter.terms);

      const index = getCollectionIndex(collectionId);
      const options = {
        scope,
        scopeValues,
        ...filter,
      };
      try {
        const body = {};
        if (debug) {
          const searchQuery = await cardinality(index, fields, options, true);
          body.meta = { searchQuery };
        }
        body.data = await cardinality(index, fields, options, false);
        ctx.body = body;
      } catch (err) {
        const searchQuery = await cardinality(index, fields, options, true);
        interpretAnalyticsError(ctx, err, searchQuery);
      }
    }
  );

module.exports = router;
