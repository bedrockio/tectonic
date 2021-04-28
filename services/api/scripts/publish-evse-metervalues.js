const process = require('process');
const { logger } = require('@bedrockio/instrumentation');
const config = require('@bedrockio/config');
const fetch = require('node-fetch');
const { chunk } = require('lodash');

const { initialize: initDB } = require('../src/utils/database');
const { Collection } = require('../src/models');
const { loadJsonStreamFile } = require('../src/lib/analytics');

async function run() {
  await initDB();
  const events = loadJsonStreamFile(__dirname + '/../src/lib/__tests__/fixtures/analytics/evse-metervalues-1k.ndjson');
  logger.info(`Loaded ${events.length} events`);
  const collection = await Collection.findOne({ name: 'EVSE meter values' });
  if (!collection) throw new Error('Could not find collection');
  const collectionId = collection._id.toString();
  await publishEventsBatched(collectionId, events);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function publishEvents(collectionId, events, retryCount = 0) {
  const body = {
    events: events.map((event) => {
      return {
        ...event,
        type: 'mongodb',
        occurredAt: new Date().toISOString(),
      };
    }),
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
      // console.log(await response.text());
      // throw new Error(`Bad response from API: ${response.status} (${uri})`);
      if (response.status == 413) {
        console.warn(`Warning, jsonLimit is only 2mb. Events are skipped.`);
        return;
      }
      console.warn(`Warning, bad response from API: ${response.status}`);
      if (retryCount < 3) {
        console.warn(`Retrying in 3 seconds (retry count: ${retryCount + 1})`);
        await sleep(3000);
        await publishEvents(collectionId, events, retryCount + 1);
      }
    }
  } catch (e) {
    console.error(e);
    if (retryCount < 3) {
      console.warn(`Tetrying in 3 seconds (retry count: ${retryCount + 1})`);
      await sleep(3000);
      await publishEvents(collectionId, events, retryCount + 1);
    }
  }
  console.info(`Published ${events.length} events to ${uri}`);
}

async function publishEventsBatched(collectionId, events, batchSize = 100) {
  const batches = chunk(events, batchSize);
  for (const batch of batches) {
    await publishEvents(collectionId, batch);
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Fatal error: ${error.message}, exiting.`);
    logger.error(error.stack);
    process.exit(1);
  });
