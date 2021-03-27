const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const config = require('@bedrockio/config');
// const { chunk } = require('lodash');
const { NotFoundError } = require('../utils/errors');
const validate = require('../utils/middleware/validate');
// const { publishMessage } = require('../lib/pubsub');
const { Batch, Collection } = require('../models');
const { logger } = require('../utils/logging');
const { storeBatchEvents } = require('../utils/batch');
const { createHash } = require('crypto');

const router = new Router();
//const rawEventsTopic = config.get('PUBSUB_RAW_EVENTS_TOPIC');

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

    // 3: push events to PUBSUB topic

    ctx.body = {
      batch: dbBatch,
    };

    // try {
    //   await publishMessage(ingestTopic, JSON.stringify(message));
    //   // console.log(JSON.stringify(message));
    //   ctx.status = 204;
    // } catch (e) {
    //   console.error(e);
    //   return (ctx.status = 500);
    // }
  }
);

function memorySizeOf(obj) {
  var bytes = 0;

  function sizeOf(obj) {
    if (obj !== null && obj !== undefined) {
      switch (typeof obj) {
        case 'number':
          bytes += 8;
          break;
        case 'string':
          bytes += obj.length * 2;
          break;
        case 'boolean':
          bytes += 4;
          break;
        case 'object':
          var objClass = Object.prototype.toString.call(obj).slice(8, -1);
          if (objClass === 'Object' || objClass === 'Array') {
            for (var key in obj) {
              if (!(key in obj)) continue;
              sizeOf(obj[key]);
            }
          } else bytes += obj.toString().length * 2;
          break;
      }
    }
    return bytes;
  }

  function formatByteSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + ' MB';
    else return (bytes / 1073741824).toFixed(3) + ' GB';
  }

  return formatByteSize(sizeOf(obj));
}

module.exports = router;
