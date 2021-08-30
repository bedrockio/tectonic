const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const mongoose = require('mongoose');
const { authenticate } = require('../lib/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { AccessCredential, AccessPolicy, Collection } = require('../models');
const { createCredentialToken } = require('../lib/tokens');

const router = new Router();

const accessCredentialSchema = Joi.object({
  name: Joi.string().required(),
  accessPolicy: Joi.string().required(), // name or id
  scopeValues: Joi.array()
    .items(
      Joi.object({
        field: Joi.string().required(),
        value: Joi.string().required(),
      })
    )
    .optional(),
});

function checkScopeValues(ctx, accessPolicy, scopeValues) {
  const missingFields = getMissingFields(accessPolicy, scopeValues);
  if (missingFields && missingFields.length) {
    ctx.throw(401, `scopeValues missing fields: '${missingFields.join(', ')}'`);
  }
}

function getMissingFields(accessPolicy, scopeValues) {
  const scopeFields = new Set();
  for (let collection of accessPolicy.collections) {
    for (let field of collection.scopeFields) {
      scopeFields.add(field);
    }
  }

  if (scopeFields.size == 0) return false;
  if (!scopeValues || scopeValues.length == 0) return Array.from(scopeFields);

  const scopeValuesFields = scopeValues.map(({ field }) => field);
  const missingFields = [];
  for (let field of scopeFields) {
    if (!scopeValuesFields.includes(field)) missingFields.push(field);
  }
  if (missingFields.length) return missingFields;
  return false;
}

router
  .use(authenticate({ types: ['user', 'application'] }))
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
      body: accessCredentialSchema,
    }),
    async (ctx) => {
      const { name, accessPolicy, scopeValues } = ctx.request.body;
      const existingAccessCredential = await AccessCredential.findOne({ name });
      if (existingAccessCredential) {
        ctx.throw(401, `Access Credential with name '${name}' already exists. You could use PUT endpoint instead.`);
      }
      const dbAccessPolicy = await AccessPolicy.findByIdOrName(accessPolicy);
      if (!dbAccessPolicy) {
        ctx.throw(401, `AccessPolicy '${accessPolicy}' could not be found`);
      }
      checkScopeValues(ctx, dbAccessPolicy, scopeValues);
      const accessCredentialObject = {
        name,
        accessPolicy: dbAccessPolicy,
      };
      if (scopeValues) accessCredentialObject.scopeValues = scopeValues;
      const accessCredential = await AccessCredential.create(accessCredentialObject);
      const token = createCredentialToken(accessCredential);
      const data = { ...accessCredential.toObject(), token };
      data.accessPolicy = data.accessPolicy.name;
      ctx.body = { data };
    }
  )
  .put(
    '/',
    validate({
      body: accessCredentialSchema,
    }),
    async (ctx) => {
      const { name, accessPolicy, scopeValues } = ctx.request.body;
      const dbAccessPolicy = await AccessPolicy.findByIdOrName(accessPolicy);
      if (!dbAccessPolicy) {
        ctx.throw(401, `AccessPolicy '${accessPolicy}' could not be found`);
      }
      checkScopeValues(ctx, dbAccessPolicy, scopeValues);
      const existingAccessCredential = await AccessCredential.findOne({ name });
      let accessCredential;
      if (existingAccessCredential) {
        existingAccessCredential.accessPolicy = dbAccessPolicy;
        existingAccessCredential.scopeValues = scopeValues || [];
        await existingAccessCredential.save();
        accessCredential = existingAccessCredential;
      } else {
        const accessCredentialObject = {
          name,
          accessPolicy: dbAccessPolicy,
        };
        if (scopeValues) accessCredentialObject.scopeValues = scopeValues;
        accessCredential = await AccessCredential.create(accessCredentialObject);
      }
      const token = createCredentialToken(accessCredential);
      const data = { ...accessCredential.toObject(), token };
      data.accessPolicy = data.accessPolicy.name;
      ctx.body = { data };
    }
  )
  .get('/:credential', async (ctx) => {
    const { accessCredential } = await ctx.state;
    const accessCredentialObject = accessCredential.toObject();
    for (const collection of accessCredentialObject.accessPolicy.collections) {
      const dbCollection = await Collection.findOne({ name: collection.collectionName });
      if (dbCollection) {
        collection.collectionName = dbCollection.name;
      }
    }

    ctx.body = {
      data: { ...accessCredentialObject },
    };
  })
  .get('/:credential/token', async (ctx) => {
    const { accessCredential } = await ctx.state;
    const token = createCredentialToken(accessCredential);
    ctx.body = {
      data: { token },
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
      body: accessCredentialSchema,
    }),
    async (ctx) => {
      const { name, accessPolicy, scopeValues } = ctx.request.body;
      const dbAccessPolicy = await AccessPolicy.findByIdOrName(accessPolicy);
      if (!dbAccessPolicy) {
        ctx.throw(401, `AccessPolicy '${accessPolicy}' could not be found`);
      }
      checkScopeValues(ctx, dbAccessPolicy, scopeValues);
      const existingAccessCredential = await AccessCredential.findOne({ name });
      if (existingAccessCredential) {
        ctx.throw(401, `Access Credential with name '${name}' already exists.`);
      }
      const accessCredential = ctx.state.accessCredential;
      accessCredential.name = name;
      accessCredential.accessPolicy = dbAccessPolicy;
      if (scopeValues) accessCredential.scopeValues = scopeValues;
      await accessCredential.save();
      const accessCredentialObject = accessCredential.toObject();
      accessCredentialObject.accessPolicy = accessCredentialObject.accessPolicy.name;
      ctx.body = {
        data: accessCredentialObject,
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
