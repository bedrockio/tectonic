const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const config = require('@bedrockio/config');
const { NotFoundError } = require('../utils/errors');
const validate = require('../utils/middleware/validate');
const { publishMessage } = require('../lib/pubsub');
const { Batch, Collection } = require('../models');
// const { logger } = require('@bedrockio/instrumentation');
const { memorySizeOf, chunkedAsyncMap } = require('../lib/events');
const { storeBatchEvents } = require('../lib/batch');
const { createHash } = require('crypto');

const PUBSUB_RAW_EVENTS_TOPIC = config.get('PUBSUB_RAW_EVENTS_TOPIC');
const EVENTS_CHUNK_SIZE = 10;

const router = new Router();

const eventSchema = Joi.object({
  type: Joi.string().required(),
  occurredAt: Joi.string().required(),
}).unknown(); // unknown: to allow any aother field

router.post(
  '/',
  validate({
    body: Joi.object({
      collectionId: Joi.string().required(),
      events: Joi.array().items(eventSchema).min(1).required(),
    }),
  }),
  async (ctx) => {
    const { collectionId, events } = ctx.request.body;
    const ingestedAt = new Date().toISOString();

    let collection;
    try {
      collection = await Collection.findById(collectionId);
      // logger.info(collection.datalake._id.toString());
    } catch (e) {
      throw new NotFoundError(`CollectionId ${collectionId} not valid`);
    }
    if (!collection) {
      throw new NotFoundError(`CollectionId ${collectionId} not found`);
    }

    const hash = createHash('sha256')
      .update(`${collectionId}-${JSON.stringify(events)}`)
      .digest('base64');

    // 1: Create and store mongo batch

    const batch = {
      datalakeId: collection.datalake._id.toString(),
      collectionId,
      ingestedAt,
      numEvents: events.length,
      minOccurredAt: events[0].occurredAt,
      maxOccurredAt: events[0].occurredAt,
      memorySize: memorySizeOf(events),
      hash,
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
