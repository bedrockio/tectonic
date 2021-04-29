const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate, fetchUser } = require('../utils/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { Policy } = require('../models');
const { createPolicyToken } = require('../lib/tokens');

const router = new Router();

router
  .use(authenticate({ type: 'user' }))
  .use(fetchUser)
  .param('policyId', async (id, ctx, next) => {
    const policy = await Policy.findById(id);
    ctx.state.policy = policy;
    if (!policy) {
      throw new NotFoundError();
    }
    return next();
  })
  .post(
    '/',
    validate({
      body: Policy.getValidator(),
    }),
    async (ctx) => {
      const policy = await Policy.create(ctx.request.body);
      const token = createPolicyToken(policy);
      ctx.body = {
        data: {
          policy,
          token,
        },
      };
    }
  )
  .get('/:policyId', async (ctx) => {
    const { policy } = await ctx.state;
    const token = createPolicyToken(policy);

    ctx.body = {
      data: { ...policy.toObject(), token },
    };
  })
  .get('/:policyId/token', async (ctx) => {
    const { policy } = await ctx.state;
    const token = createPolicyToken(policy);
    ctx.body = {
      data: token,
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
      const data = await Policy.find(query)
        .sort({ [sort.field]: sort.order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      const total = await Policy.countDocuments(query);
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
      body: Policy.getPatchValidator(),
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
