const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate } = require('../lib/middleware/authenticate');
const { NotFoundError } = require('../utils/errors');
const { Collection } = require('../models');
const { ensureCollectionIndex, getMapping, getCollectionIndex, deleteIndex } = require('../lib/analytics');
const { logger } = require('@bedrockio/instrumentation');

const router = new Router();

router
  .use(authenticate())
  .param('collectionId', async (id, ctx, next) => {
    const collection = await Collection.findById(id);
    ctx.state.collection = collection;
    if (!collection) {
      throw new NotFoundError();
    }
    return next();
  })
  .post(
    '/',
    validate({
      body: Collection.getValidator(),
    }),
    async (ctx) => {
      const { name } = ctx.request.body;
      const existingCollection = await Collection.findOne({ name });
      if (existingCollection) {
        ctx.throw(401, `Collection with name "${name}" already exists. You could use PUT endpoint instead.`);
      }
      const collection = await Collection.create(ctx.request.body);
      await ensureCollectionIndex(collection.id);
      ctx.body = {
        data: collection,
      };
    }
  )
  .put(
    '/',
    validate({
      body: Collection.getValidator(),
    }),
    async (ctx) => {
      const { name } = ctx.request.body;
      const existingCollection = await Collection.findOne({ name });
      let collection;
      if (existingCollection) {
        existingCollection.assign(ctx.request.body);
        await existingCollection.save();
        collection = existingCollection;
      } else {
        collection = await Collection.create(ctx.request.body);
        await ensureCollectionIndex(collection.id);
      }

      ctx.body = {
        data: collection,
      };
    }
  )
  .get('/:collectionId', async (ctx) => {
    const { collection } = await ctx.state;
    let mapping = {};
    try {
      mapping = await getMapping(getCollectionIndex(collection.id));
    } catch (e) {
      logger.warn('Could not retrieve mapping');
    }

    ctx.body = {
      data: { ...collection.toObject(), mapping },
    };
  })
  .get('/', async (ctx) => {
    const { limit = 100 } = ctx.request.query;
    const query = {
      deletedAt: { $exists: false },
    };
    const data = await Collection.find(query)
      .sort({ ['createdAt']: -1 })
      .limit(parseInt(limit));
    const total = await Collection.countDocuments(query);
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
      const data = await Collection.find(query)
        .sort({ [sort.field]: sort.order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      const total = await Collection.countDocuments(query);
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
    '/:collectionId',
    validate({
      body: Collection.getPatchValidator(),
    }),
    async (ctx) => {
      const { name } = ctx.request.body;
      const existingCollection = await Collection.findOne({ name });
      if (existingCollection) {
        ctx.throw(401, `Collection with name '${name}' already exists.`);
      }
      const collection = ctx.state.collection;
      collection.assign(ctx.request.body);
      await collection.save();
      ctx.body = {
        data: collection,
      };
    }
  )
  .delete('/:collectionId', async (ctx) => {
    const collection = ctx.state.collection;
    // hard delete
    await Collection.deleteOne({ _id: collection.id });
    const index = getCollectionIndex(collection.id);
    await deleteIndex(index);
    // soft delete
    // await collection.delete();
    ctx.status = 204;
  });

module.exports = router;
