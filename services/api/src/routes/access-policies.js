const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate } = require('../lib/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { AccessPolicy, Collection } = require('../models');

const router = new Router();

const collectionSchema = Joi.object({
  collection: Joi.string().required(),
  scope: Joi.object().optional(),
  scopeParams: Joi.array().items(Joi.string()).optional(),
  includeFields: Joi.array().items(Joi.string()).optional(),
  excludeFields: Joi.array().items(Joi.string()).optional(),
});

router
  .use(authenticate({ types: ['user', 'application'] }))
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
      body: Joi.object({
        name: Joi.string().required(),
        collections: Joi.array().items(collectionSchema).min(1).required(),
      }),
    }),
    async (ctx) => {
      const { name, collections } = ctx.request.body;
      const existingPolicy = await AccessPolicy.findOne({ name });
      if (existingPolicy) {
        ctx.throw(401, `Collection with name '${name}' already exists. You could use PUT endpoint instead.`);
      }

      const policyObject = {
        name,
        collections: [],
      };

      for (const col of collections) {
        const collection = await Collection.findByIdOrName(col.collection);
        if (!collection) ctx.throw(401, `collection '${col.collection}' doesn't exist`);
        col.collectionId = collection.id;
        delete col.collection;
        policyObject.collections.push(col);
      }
      const policy = await AccessPolicy.create(policyObject);
      ctx.body = {
        data: policy.toCollectionJSON(),
      };
    }
  )
  .put(
    '/',
    validate({
      body: Joi.object({
        name: Joi.string().required(),
        collections: Joi.array().items(collectionSchema).min(1).required(),
      }),
    }),
    async (ctx) => {
      const { name, collections } = ctx.request.body;
      const newCollections = [];

      for (const col of collections) {
        const collection = await Collection.findByIdOrName(col.collection);
        if (!collection) ctx.throw(401, `collection '${col.collection}' doesn't exist`);
        col.collectionId = collection.id;
        delete col.collection;
        newCollections.push(col);
      }

      const existingPolicy = await AccessPolicy.findOne({ name });
      let policy;
      if (existingPolicy) {
        existingPolicy.collections = newCollections;
        await existingPolicy.save();
        policy = existingPolicy.toCollectionJSON();
      } else {
        policy = await AccessPolicy.create({ name, collections: newCollections });
        policy = policy.toCollectionJSON();
      }

      ctx.body = {
        data: policy,
      };
    }
  )
  .patch(
    '/:policyId',
    validate({
      body: Joi.object({
        name: Joi.string(),
        collections: Joi.array().items(collectionSchema).min(1),
      }),
    }),
    async (ctx) => {
      const policy = ctx.state.policy;
      const { name, collections } = ctx.request.body;
      if (name) {
        const existingAccessPolicy = await AccessPolicy.findOne({ name });
        if (existingAccessPolicy) {
          ctx.throw(401, `Access Policy with name '${name}' already exists.`);
        }
        policy.name = name;
      }
      if (collections) {
        policy.collections = [];
        for (const col of collections) {
          const collection = await Collection.findByIdOrName(col.collection);
          if (!collection) ctx.throw(401, `collection '${col.collection}' doesn't exist`);
          col.collectionId = collection.id;
          delete col.collection;
          policy.collections.push(col);
        }
      }
      await policy.save();
      ctx.body = {
        data: policy.toCollectionJSON(),
      };
    }
  )
  .get('/:policyId', async (ctx) => {
    const { policy } = await ctx.state;
    ctx.body = {
      data: policy.toCollectionJSON(),
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

      const mappedData = data.map((accessPolicy) => {
        return accessPolicy.toCollectionJSON();
      });

      const total = await AccessPolicy.countDocuments(query);
      ctx.body = {
        data: mappedData,
        meta: {
          total,
          skip,
          limit,
        },
      };
    }
  )
  .delete('/:policyId', async (ctx) => {
    const policy = ctx.state.policy;
    await policy.destroy();
    ctx.status = 204;
  });

module.exports = router;
