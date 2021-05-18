const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate } = require('../lib/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { AccessCredential } = require('../models');
const { createCredentialToken } = require('../lib/tokens');
//const { logger } = require('@bedrockio/instrumentation');

const router = new Router();

router
  .use(authenticate())
  .param('credentialId', async (id, ctx, next) => {
    const accessCredential = await AccessCredential.findById(id);
    ctx.state.accessCredential = accessCredential;
    if (!accessCredential) {
      throw new NotFoundError();
    }
    return next();
  })
  .post(
    '/',
    validate({
      body: AccessCredential.getValidator(),
    }),
    async (ctx) => {
      // TODO add logic to check accessCredential validity
      const accessCredential = await AccessCredential.create(ctx.request.body);
      ctx.body = {
        data: accessCredential,
      };
    }
  )
  .get('/:credentialId', async (ctx) => {
    const { accessCredential } = await ctx.state;
    const token = createCredentialToken(accessCredential);
    ctx.body = {
      data: { ...accessCredential.toObject(), token },
    };
  })
  .get('/', async (ctx) => {
    const { limit = 100 } = ctx.request.query;
    const query = {
      deletedAt: { $exists: false },
    };
    const data = await AccessCredential.find(query)
      .sort({ ['createdAt']: -1 })
      .limit(parseInt(limit));
    const total = await AccessCredential.countDocuments(query);
    ctx.body = {
      data,
      meta: {
        total,
        limit,
      },
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
      const data = await AccessCredential.find(query)
        .sort({ [sort.field]: sort.order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      const total = await AccessCredential.countDocuments(query);
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
    '/:credentialId',
    validate({
      body: AccessCredential.getPatchValidator(),
    }),
    async (ctx) => {
      const accessCredential = ctx.state.accessCredential;
      accessCredential.assign(ctx.request.body);
      await accessCredential.save();
      ctx.body = {
        data: accessCredential,
      };
    }
  )
  .delete('/:credentialId', async (ctx) => {
    const accessCredential = ctx.state.accessCredential;
    await accessCredential.delete();
    ctx.status = 204;
  });

module.exports = router;
