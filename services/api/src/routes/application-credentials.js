const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate } = require('../lib/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { ApplicationCredential } = require('../models');
const { createCredentialToken } = require('../lib/tokens');
//const { logger } = require('@bedrockio/instrumentation');

const router = new Router();

router
  .use(authenticate())
  .param('credential', async (idOrName, ctx, next) => {
    const applicationCredential = await ApplicationCredential.findByIdOrName(idOrName);
    ctx.state.applicationCredential = applicationCredential;
    if (!applicationCredential) {
      throw new NotFoundError();
    }
    return next();
  })
  .post(
    '/',
    validate({
      body: ApplicationCredential.getValidator(),
    }),
    async (ctx) => {
      const { name } = ctx.request.body;
      const existingApplicationCredential = await ApplicationCredential.findOne({ name });
      if (existingApplicationCredential) {
        ctx.throw(
          401,
          `Application Credential with name '${name}' already exists. You could use PUT endpoint instead.`
        );
      }
      // TODO add logic to check applicationCredential validity
      const applicationCredential = await ApplicationCredential.create(ctx.request.body);
      ctx.body = {
        data: applicationCredential,
      };
    }
  )
  .put(
    '/',
    validate({
      body: ApplicationCredential.getValidator(),
    }),
    async (ctx) => {
      // TODO add logic to check applicationCredential validity
      const { name } = ctx.request.body;
      const existingApplicationCredential = await ApplicationCredential.findOne({ name });
      let applicationCredential;
      if (existingApplicationCredential) {
        existingApplicationCredential.assign(ctx.request.body);
        await existingApplicationCredential.save();
        applicationCredential = existingApplicationCredential;
      } else {
        applicationCredential = await ApplicationCredential.create(ctx.request.body);
      }

      ctx.body = {
        data: applicationCredential,
      };
    }
  )
  .get('/:credential', async (ctx) => {
    const { applicationCredential } = await ctx.state;
    ctx.body = {
      data: { ...applicationCredential.toObject() },
    };
  })
  .get('/:credential/token', async (ctx) => {
    const { applicationCredential } = await ctx.state;
    const token = createCredentialToken(applicationCredential, 'application');
    ctx.body = {
      data: { token },
    };
  })
  .get('/', async (ctx) => {
    const { limit = 100 } = ctx.request.query;
    const query = {
      deletedAt: { $exists: false },
    };
    const data = await ApplicationCredential.find(query)
      .sort({ ['createdAt']: -1 })
      .limit(parseInt(limit));
    const total = await ApplicationCredential.countDocuments(query);
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
      const data = await ApplicationCredential.find(query)
        .sort({ [sort.field]: sort.order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      const total = await ApplicationCredential.countDocuments(query);
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
    '/:credential',
    validate({
      body: ApplicationCredential.getPatchValidator(),
    }),
    async (ctx) => {
      const applicationCredential = ctx.state.applicationCredential;
      applicationCredential.assign(ctx.request.body);
      await applicationCredential.save();
      ctx.body = {
        data: applicationCredential,
      };
    }
  )
  .delete('/:credential', async (ctx) => {
    const applicationCredential = ctx.state.applicationCredential;
    // hard delete
    await ApplicationCredential.deleteOne({ _id: applicationCredential.id });
    // soft delete
    // await applicationCredential.delete();
    ctx.status = 204;
  });

module.exports = router;
