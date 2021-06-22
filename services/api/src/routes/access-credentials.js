const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const mongoose = require('mongoose');
const { authenticate } = require('../lib/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { AccessCredential } = require('../models');
const { createCredentialToken } = require('../lib/tokens');
//const { logger } = require('@bedrockio/instrumentation');

const router = new Router();

router
  .use(authenticate())
  .param('credential', async (idOrName, ctx, next) => {
    const accessCredential = await AccessCredential.findByIdOrName(idOrName);
    ctx.state.accessCredential = accessCredential;
    if (!accessCredential) {
      throw new NotFoundError();
    }
    return next();
  })
  .post(
    '/',
    validate({
      body: Joi.object({
        name: Joi.string().required(),
        accessPolicy: Joi.string().required(), // name or id
        scopeArgs: Joi.object().optional(), // TODO: add validator for this field
      }),
    }),
    async (ctx) => {
      const { name } = ctx.request.body;
      const existingAccessCredential = await AccessCredential.findOne({ name });
      if (existingAccessCredential) {
        ctx.throw(401, `Access Credential with name "${name}" already exists. You could use PUT endpoint instead.`);
      }
      // TODO add logic to check accessCredential validity
      // Check if accessPolicy is a name or id
      const accessCredential = await AccessCredential.create(ctx.request.body);
      const token = createCredentialToken(accessCredential);
      ctx.body = {
        data: { ...accessCredential.toObject(), token },
      };
    }
  )
  .put(
    '/',
    validate({
      body: Joi.object({
        name: Joi.string().required(),
        accessPolicy: Joi.string().required(), // name or id
        scopeArgs: Joi.object().optional(), // TODO: add validator for this field
      }),
    }),
    async (ctx) => {
      // TODO add logic to check accessCredential validity
      // Check if accessPolicy is a name or id
      const { name, accessPolicy, scopeArgs = {} } = ctx.request.body;
      const existingAccessCredential = await AccessCredential.findOne({ name });
      let accessCredential;
      if (existingAccessCredential) {
        existingAccessCredential.accessPolicy = accessPolicy;
        existingAccessCredential.scopeArgs = scopeArgs;
        await existingAccessCredential.save();
        accessCredential = existingAccessCredential;
      } else {
        accessCredential = await AccessCredential.create(ctx.request.body);
      }
      const token = createCredentialToken(accessCredential);
      ctx.body = {
        data: { ...accessCredential.toObject(), token },
      };
    }
  )
  .get('/:credential', async (ctx) => {
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
        accessPolicy: Joi.string(), // Is either accessPolicy.id objectId or accessPolicy.name
        limit: Joi.number().positive().default(50),
      }),
    }),
    async (ctx) => {
      const { ids = [], sort, name, skip, limit, accessPolicy } = ctx.request.body;
      const query = {
        ...(ids.length ? { _id: { $in: ids } } : {}),
        deletedAt: { $exists: false },
      };
      if (accessPolicy) {
        if (mongoose.isValidObjectId(accessPolicy)) {
          query.accessPolicy = accessPolicy;
        } else {
          // assume accessPolicy name was passed
          const accessPolicyObject = await accessPolicy.findOne({ name: accessPolicy });
          query.accessPolicy = accessPolicyObject._id;
        }
      }
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
    '/:credential',
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
  .delete('/:credential', async (ctx) => {
    const accessCredential = ctx.state.accessCredential;
    // hard delete
    await AccessCredential.deleteOne({ _id: accessCredential.id });
    // soft delete
    // await accessCredential.delete();
    ctx.status = 204;
  });

module.exports = router;
