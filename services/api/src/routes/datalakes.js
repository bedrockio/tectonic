const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate, fetchUser } = require('../utils/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { Datalake } = require('../models');

const router = new Router();

router
  .use(authenticate({ type: 'user' }))
  .use(fetchUser)
  .param('datalakeId', async (id, ctx, next) => {
    const datalake = await Datalake.findById(id);
    ctx.state.datalake = datalake;
    if (!datalake) {
      throw new NotFoundError();
    }
    return next();
  })
  .post(
    '/',
    validate({
      body: Datalake.getValidator(),
    }),
    async (ctx) => {
      const datalake = await Datalake.create(ctx.request.body);
      ctx.body = {
        data: datalake,
      };
    }
  )
  .get('/:datalakeId', async (ctx) => {
    const datalake = ctx.state.datalake;
    ctx.body = {
      data: datalake,
    };
  })
  .post(
    '/search',
    validate({
      body: Joi.object({
        // --- Generator: search
        name: Joi.string(),
        country: Joi.string(),
        // --- Generator: end
        startAt: Joi.date(),
        endAt: Joi.date(),
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
      const { ids = [], sort, skip, limit, startAt, endAt } = ctx.request.body;
      // --- Generator: vars
      const { name, country } = ctx.request.body;
      // --- Generator: end
      const query = {
        ...(ids.length ? { _id: { $in: ids } } : {}),
        deletedAt: { $exists: false },
      };

      // --- Generator: queries
      if (name) {
        query.name = {
          $regex: name,
          $options: 'i',
        };
      }
      if (country) {
        query.country = country;
      }
      // --- Generator: end

      if (startAt || endAt) {
        query.createdAt = {};
        if (startAt) {
          query.createdAt.$gte = startAt;
        }
        if (endAt) {
          query.createdAt.$lte = endAt;
        }
      }
      const data = await Datalake.find(query)
        .sort({ [sort.field]: sort.order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      const total = await Datalake.countDocuments(query);
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
    '/:datalakeId',
    validate({
      body: Datalake.getPatchValidator(),
    }),
    async (ctx) => {
      const datalake = ctx.state.datalake;
      datalake.assign(ctx.request.body);
      await datalake.save();
      ctx.body = {
        data: datalake,
      };
    }
  )
  .delete('/:datalakeId', async (ctx) => {
    await ctx.state.datalake.delete();
    ctx.status = 204;
  });

module.exports = router;
