const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const config = require('@bedrockio/config');
const { NotFoundError } = require('../utils/errors');
const validate = require('../utils/middleware/validate');
const { publishMessage } = require('../lib/pubsub');
const { Batch, Collection } = require('../models');
const { memorySizeOf, chunkedAsyncMap } = require('../lib/events');
const { storeBatchEvents } = require('../lib/batch');
const { createHash } = require('crypto');
const { authenticate } = require('../lib/middleware/authenticate');

const PUBSUB_RAW_EVENTS_TOPIC = config.get('PUBSUB_RAW_EVENTS_TOPIC');
const EVENTS_CHUNK_SIZE = 10;

const router = new Router();

const eventSchema = Joi.object({
  occurredAt: Joi.string().required(),
}).unknown(); // unknown: to allow any aother field

router.use(authenticate({ types: ['user', 'application'] })).post(
  '/',
  validate({
    body: Joi.object({
      collection: Joi.string().required(),
      events: Joi.array().items(eventSchema).min(1).required(),
    }),
  }),
  async (ctx) => {
    const { collection, events } = ctx.request.body;
    const ingestedAt = new Date().toISOString();

    let dbCollection;
    try {
      dbCollection = await Collection.findByIdOrName(collection);
    } catch (e) {
      console.error(e);
      throw new NotFoundError(`Collection ${collection} not valid`);
    }
    if (!dbCollection) {
      throw new NotFoundError(`Collection ${collection} not found`);
    }
    const collectionId = dbCollection.id;

    const hash = createHash('sha256')
      .update(`${collectionId}-${JSON.stringify(events)}`)
      .digest('base64');

    // 1: Create and store mongo batch

    const batch = {
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
