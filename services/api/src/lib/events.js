const { logger } = require('@bedrockio/instrumentation');
const config = require('@bedrockio/config');
const fetch = require('node-fetch');
const { chunk } = require('lodash');

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

async function chunkedAsyncMap(events, fn, chunkSize = 10) {
  const chunkedArray = chunk(events, chunkSize);
  chunkedArray.reduce(async (previousChunk, currentChunk /*, index*/) => {
    await previousChunk;
    // logger.info(`Processing chunk ${index}...`);
    const currentChunkPromises = currentChunk.map(async (event) => await fn(event));
    await Promise.all(currentChunkPromises);
  }, Promise.resolve());
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function publishEvents(collectionId, events, retryCount = 0) {
  const body = {
    events,
    collectionId,
  };
  const headers = {
    'Content-Type': 'application/json',
  };
  const uri = `${config.get('API_URL')}/1/events`;
  try {
    const response = await fetch(uri, {
      method: 'post',
      body: JSON.stringify(body),
      headers,
    });
    if (!response.ok) {
      // logger.info(await response.text());
      // throw new Error(`Bad response from API: ${response.status} (${uri})`);
      if (response.status == 413) {
        logger.warn(`Warning, jsonLimit is only 2mb. Events are skipped.`);
        return;
      }
      logger.warn(`Warning, bad response from API: ${response.status}`);
      if (retryCount < 3) {
        logger.warn(`Retrying in 3 seconds (retry count: ${retryCount + 1})`);
        await sleep(3000);
        await publishEvents(collectionId, events, retryCount + 1);
      }
    }
  } catch (e) {
    logger.error(e);
    if (retryCount < 3) {
      logger.warn(`Tetrying in 3 seconds (retry count: ${retryCount + 1})`);
      await sleep(3000);
      await publishEvents(collectionId, events, retryCount + 1);
    }
  }
  logger.info(`Published ${events.length} events to ${uri}`);
}

async function publishEventsBatched(collectionId, events, batchSize = 100) {
  const batches = chunk(events, batchSize);
  for (const batch of batches) {
    await publishEvents(collectionId, batch);
  }
}

module.exports = {
  memorySizeOf,
  chunkedAsyncMap,
  publishEventsBatched,
};
