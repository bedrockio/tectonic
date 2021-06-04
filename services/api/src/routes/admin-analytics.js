const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate, fetchUser } = require('../lib/middleware/authenticate');
const { requirePermissions } = require('../utils/middleware/permissions');
const { terms, timeSeries, search, fetch, stats, cardinality } = require('../lib/analytics');

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

router
  .use(authenticate())
  .use(fetchUser)
  .use(requirePermissions({ endpoint: 'analytics', permission: 'read', scope: 'global' }))
  .post(
    '/terms',
    validate({
      body: Joi.object({
        index: Joi.string().required(),
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
    async (ctx) => {
      const {
        index,
        filter = {},
        aggField,
        aggFieldOrder,
        field,
        operation,
        includeTopHit,
        referenceFetch,
        termsSize,
      } = ctx.request.body;
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
        index: Joi.string().required(),
        filter: Joi.object(filterOptions),
        operation: Joi.string().required(),
        field: Joi.string().optional(),
        interval: Joi.string(),
        dateField: Joi.string(),
      }),
    }),
    async (ctx) => {
      const { index, filter = {}, operation, field, interval, dateField } = ctx.request.body;
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
        index: Joi.string().required(),
        filter: Joi.object(filterOptions),
      }),
    }),
    async (ctx) => {
      const { index, filter = {} } = ctx.request.body;
      try {
        ctx.body = await search(index, filter);
      } catch (err) {
        interpretError(err);
      }
    }
  )
  .post(
    '/fetch',
    validate({
      body: Joi.object({
        index: Joi.string().required(),
        value: Joi.string().required(),
        field: Joi.string().optional(),
      }),
    }),
    async (ctx) => {
      const { index, value, field } = ctx.request.body;
      let object;
      try {
        object = await fetch(index, field || 'id', value);
      } catch (err) {
        interpretError(err);
      }
      ctx.body = object;
    }
  )
  .post(
    '/stats',
    validate({
      body: Joi.object({
        index: Joi.string().required(),
        filter: Joi.object(filterOptions),
        fields: Joi.array().items(Joi.string()),
      }),
    }),
    async (ctx) => {
      const { index, filter = {}, fields } = ctx.request.body;
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
        index: Joi.string().required(),
        filter: Joi.object(filterOptions),
        fields: Joi.array().items(Joi.string()),
      }),
    }),
    async (ctx) => {
      const { index, filter = {}, fields } = ctx.request.body;
      try {
        ctx.body = await cardinality(index, fields, filter);
      } catch (err) {
        interpretError(err);
      }
    }
  );

module.exports = router;