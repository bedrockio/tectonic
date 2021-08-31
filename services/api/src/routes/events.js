const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const config = require('@bedrockio/config');
const validate = require('../utils/middleware/validate');
const { publishMessage } = require('../lib/pubsub');
const { Batch, Collection } = require('../models');
const { memorySizeOf, chunkedAsyncMap } = require('../lib/events');
const { bulkErrorLog, bulkIndexBatchEvents } = require('../lib/analytics');
const { storeBatchEvents } = require('../lib/batch');
const { createHash } = require('crypto');
const { authenticate, fetchCredential } = require('../lib/middleware/authenticate');
const { logger } = require('@bedrockio/instrumentation');

const PUBSUB_RAW_EVENTS_TOPIC = config.get('PUBSUB_RAW_EVENTS_TOPIC');
const PUBSUB_EMULATOR = config.get('PUBSUB_EMULATOR', 'boolean');
const ENV_NAME = config.get('ENV_NAME');
const EVENTS_CHUNK_SIZE = 10;

const router = new Router();

const eventSchema = Joi.object({}).unknown(); // unknown: to allow any aother field

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
    ctx.throw(401, `AccessPolicy has no access to collection: ${dbCollection.name} (${collectionId})`);
  }
  if (accessPolicyCollection.permission != 'read-write') {
    ctx.throw(401, `AccessPolicy has no read-write permission to collection: ${dbCollection.name} (${collectionId})`);
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
        memorySize: memorySizeOf(events),
        hash,
        author,
      };

      const dbBatch = await Batch.create(batch);

      // 2: store ndEvents in bucket or local storage

      if (!collection.skipBatchStorage) {
        const filePath = await storeBatchEvents(dbBatch, events);
        // logger.info(`filePath: ${filePath}`);
        dbBatch.rawUrl = filePath;
        await dbBatch.save();
      }

      // Update collection.lastEntryAt if timeField is set
      const { timeField, lastEntryAt } = collection;
      if (timeField) {
        let maxTimeFieldValue = '';
        for (const event of events) {
          if (event[timeField] && event[timeField] > maxTimeFieldValue) maxTimeFieldValue = event[timeField];
        }
        if (!lastEntryAt && maxTimeFieldValue) {
          logger.info(`Setting lastEntryAt for collection ${collection.name} to: ${maxTimeFieldValue}`);
          await Collection.findOneAndUpdate({ _id: collection.id }, { lastEntryAt: maxTimeFieldValue });
        } else if (maxTimeFieldValue > lastEntryAt.toISOString()) {
          logger.info(`Updating lastEntryAt for collection ${collection.name} to: ${maxTimeFieldValue}`);
          await Collection.findOneAndUpdate(
            { _id: collection.id, lastEntryAt: { $lt: maxTimeFieldValue } },
            { lastEntryAt: maxTimeFieldValue }
          );
        }
      }

      if (ENV_NAME == 'development' && !PUBSUB_EMULATOR) {
        // Bulk Insert directly into ES
        const messages = events.map((event) => {
          return { event, batch: dbBatch };
        });
        logger.info(`BULK INDEX ${messages.length} messages`);
        try {
          const bulkResult = await bulkIndexBatchEvents(messages);
          // logger.info(bulkResult);
          await bulkErrorLog(bulkResult, messages);
        } catch (e) {
          logger.error(`BulkIndex ERROR: ${e}`);
        }
      } else {
        // push events to PUBSUB topic (in chunks)
        const publish = async (event) => {
          await publishRawEvent(dbBatch, event);
        };

        await chunkedAsyncMap(events, publish, EVENTS_CHUNK_SIZE);
      }

      ctx.body = {
        data: dbBatch,
      };
    }
  );

async function publishRawEvent(batch, event) {
  const message = { batch, event };
  await publishMessage(PUBSUB_RAW_EVENTS_TOPIC, JSON.stringify(message));
}

module.exports = router;
