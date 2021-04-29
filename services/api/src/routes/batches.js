const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate, fetchUser } = require('../utils/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { Batch } = require('../models');

const router = new Router();

router
  .use(authenticate({ type: 'user' }))
  .use(fetchUser)
  .param('batchId', async (id, ctx, next) => {
    const batch = await Batch.findById(id);
    ctx.state.batch = batch;
    if (!batch) {
      throw new NotFoundError();
    }
    return next();
  })
  .post(
    '/',
    validate({
      body: Batch.getValidator(),
    }),
    async (ctx) => {
      const batch = await Batch.create(ctx.request.body);
      ctx.body = {
        data: batch,
      };
    }
  )
  .get('/:batchId', async (ctx) => {
    const { batch } = await ctx.state;
    ctx.body = {
      data: batch,
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
        collectionId: Joi.string(),
        limit: Joi.number().positive().default(50),
      }),
    }),
    async (ctx) => {
      const { ids = [], sort, name, skip, limit, collectionId } = ctx.request.body;
      const query = {
        ...(ids.length ? { _id: { $in: ids } } : {}),
        deletedAt: { $exists: false },
      };
      if (collectionId) {
        query.collectionId = collectionId;
      }
      if (name) {
        query.name = {
          $regex: name,
          $options: 'i',
        };
      }
      const data = await Batch.find(query)
        .sort({ [sort.field]: sort.order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      const total = await Batch.countDocuments(query);
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
    '/:batchId',
    validate({
      body: Batch.getPatchValidator(),
    }),
    async (ctx) => {
      const batch = ctx.state.batch;
      batch.assign(ctx.request.body);
      await batch.save();
      ctx.body = {
        data: batch,
      };
    }
  )
  .delete('/:batchId', async (ctx) => {
    const batch = ctx.state.batch;
    await batch.delete();
    ctx.status = 204;
  });

module.exports = router;
