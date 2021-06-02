const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate } = require('../lib/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { AccessPolicy } = require('../models');

const router = new Router();

router
  .use(authenticate())
  .param('policyId', async (id, ctx, next) => {
    const policy = await AccessPolicy.findById(id);
    ctx.state.policy = policy;
    if (!policy) {
      throw new NotFoundError();
    }
    return next();
  })
  .post(
    '/',
    validate({
      body: AccessPolicy.getValidator(),
    }),
    async (ctx) => {
      const policy = await AccessPolicy.create(ctx.request.body);
      ctx.body = {
        data: policy,
      };
    }
  )
  .get('/:policyId', async (ctx) => {
    const { policy } = await ctx.state;
    ctx.body = {
      data: policy,
    };
  })
  .post(
    '/search',
    validate({
      body: Joi.object({
        name: Joi.string(),
        skip: Joi.number().default(0),
        sort: Joi.object({
          field: Joi.string().required(),
          order: Joi.string().valid('asc', 'desc').required(),
        }).default({
          field: 'createdAt',
          order: 'desc',
        }),
        ids: Joi.array().items(Joi.string()),
        limit: Joi.number().positive().default(50),
      }),
    }),
    async (ctx) => {
      const { ids = [], sort, name, skip, limit } = ctx.request.body;
      const query = {
        ...(ids.length ? { _id: { $in: ids } } : {}),
        deletedAt: { $exists: false },
      };
      if (name) {
        query.name = {
          $regex: name,
          $options: 'i',
        };
      }
      const data = await AccessPolicy.find(query)
        .sort({ [sort.field]: sort.order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      const total = await AccessPolicy.countDocuments(query);
      ctx.body = {
        data,
        meta: {
          total,
          skip,
          limit,
        },
      };
    }
  )
  .patch(
    '/:policyId',
    validate({
      body: AccessPolicy.getPatchValidator(),
    }),
    async (ctx) => {
      const policy = ctx.state.policy;
      policy.assign(ctx.request.body);
      await policy.save();
      ctx.body = {
        data: policy,
      };
    }
  )
  .delete('/:policyId', async (ctx) => {
    const policy = ctx.state.policy;
    await policy.delete();
    ctx.status = 204;
  });

module.exports = router;
