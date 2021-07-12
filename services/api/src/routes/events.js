const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const config = require('@bedrockio/config');
const validate = require('../utils/middleware/validate');
const { publishMessage } = require('../lib/pubsub');
const { Batch, Collection } = require('../models');
const { memorySizeOf, chunkedAsyncMap } = require('../lib/events');
const { storeBatchEvents } = require('../lib/batch');
const { createHash } = require('crypto');
const { authenticate, fetchCredential } = require('../lib/middleware/authenticate');

const PUBSUB_RAW_EVENTS_TOPIC = config.get('PUBSUB_RAW_EVENTS_TOPIC');
const EVENTS_CHUNK_SIZE = 10;

const router = new Router();

const eventSchema = Joi.object({
  occurredAt: Joi.string().required(),
}).unknown(); // unknown: to allow any aother field

async function checkCollectionAccess(ctx, next) {
  const { collection } = ctx.request.body;
  let dbCollection;
  try {
    dbCollection = await Collection.findByIdOrName(collection);
  } catch (e) {
    console.error(e);
    ctx.throw(401, `Collection ${collection} not valid`);
  }
  if (!dbCollection) {
    ctx.throw(401, `Collection '${collection}' could not be found`);
  }
  const collectionId = dbCollection.id;
  ctx.state.collection = dbCollection;

  // Give admin user and application credential full access
  if (ctx.state.authUser || ctx.state.authApplicationCredential) {
    return next();
  }

  // Check Access credential
  const { accessPolicy } = ctx.state.authAccessCredential;
  if (!accessPolicy || !accessPolicy.collections || !Array.isArray(accessPolicy.collections)) {
    ctx.throw(401, `AccessCredential is missing valid accessPolicy`);
  }
  const accessPolicyCollection = accessPolicy.collections.find(
    ({ collectionId: cid }) => collectionId == cid.toString()
  );
  if (!accessPolicyCollection) {
    ctx.throw(401, `AccessPolicy has no access to collectionId: ${collectionId}`);
  }
  if (accessPolicyCollection.permission != 'read-write') {
    ctx.throw(401, `AccessPolicy has no read-write permission to collectionId: ${collectionId}`);
  }
  return next();
}

router
  .use(authenticate({ types: ['access', 'user', 'application'] }))
  .use(fetchCredential)
  .post(
    '/',
    validate({
      body: Joi.object({
        collection: Joi.string().required(),
        events: Joi.array().items(eventSchema).min(1).required(),
      }),
    }),
    checkCollectionAccess,
    async (ctx) => {
      const { events } = ctx.request.body;
      const collection = ctx.state.collection;
      const collectionId = collection.id;
      const ingestedAt = new Date().toISOString();

      const hash = createHash('sha256')
        .update(`${collectionId}-${JSON.stringify(events)}`)
        .digest('base64');

      const author = {};
      if (ctx.state.authUser) {
        author.type = 'user';
        author.id = ctx.state.authUser.id;
      } else if (ctx.state.authApplicationCredential) {
        author.type = 'application';
        author.id = ctx.state.authApplicationCredential.id;
      } else if (ctx.state.authAccessCredential) {
        author.type = 'access';
        author.id = ctx.state.authAccessCredential.id;
      }

      // 1: Create and store mongo batch

      const batch = {
        collectionId,
        ingestedAt,
        numEvents: events.length,
        minOccurredAt: events[0].occurredAt,
        maxOccurredAt: events[0].occurredAt,
        memorySize: memorySizeOf(events),
        hash,
        author,
      };

      for (const { occurredAt } of events.slice(1)) {
        if (occurredAt < batch.minOccurredAt) batch.minOccurredAt = occurredAt;
        if (occurredAt > batch.maxOccurredAt) batch.maxOccurredAt = occurredAt;
      }

      const dbBatch = await Batch.create(batch);

      // 2: store ndEvents in bucket or local storage

      const filePath = await storeBatchEvents(dbBatch, events);
      // logger.info(`filePath: ${filePath}`);
      dbBatch.rawUrl = filePath;
      await dbBatch.save();

      // 3: push events to PUBSUB topic (in chunks)
      const publish = async (event) => {
        await publishRawEvent(dbBatch, event);
      };

      await chunkedAsyncMap(events, publish, EVENTS_CHUNK_SIZE);

      ctx.body = {
        batch: dbBatch,
      };
    }
  );

async function publishRawEvent(batch, event) {
  const message = { batch, event };
  await publishMessage(PUBSUB_RAW_EVENTS_TOPIC, JSON.stringify(message));
}

module.exports = router;
