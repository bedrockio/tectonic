const process = require('process');
const { logger } = require('@bedrockio/instrumentation');

const { initialize: initDB } = require('../src/utils/database');
const { Collection } = require('../src/models');
const { loadJsonStreamFile } = require('../src/lib/analytics');
const { publishEventsBatched } = require('../src/lib/events');

async function publishEvseMeterValues() {
  const jsonEvents = loadJsonStreamFile(
    __dirname + '/../src/lib/__tests__/fixtures/analytics/evse-metervalues-1k.ndjson'
  );
  logger.info(`Loaded ${jsonEvents.length} EVSE controllers`);
  const collection = await Collection.findOne({ name: 'evse-metervalues' });
  if (!collection) throw new Error('Could not find collection');
  const collectionId = collection._id.toString();
  const events = jsonEvents.map((event) => {
    return {
      ...event,
      type: 'mongodb',
      occurredAt: new Date().toISOString(),
    };
  });
  await publishEventsBatched(collectionId, events);
}

async function publishEvseControllers() {
  const jsonEvents = loadJsonStreamFile(__dirname + '/../src/lib/__tests__/fixtures/analytics/evse-controllers.ndjson');
  logger.info(`Loaded ${jsonEvents.length} EVSE meter values`);
  const collection = await Collection.findOne({ name: 'evse-controllers' });
  if (!collection) throw new Error('Could not find collection');
  const collectionId = collection._id.toString();
  const events = jsonEvents.map((event) => {
    return {
      ...event,
      _id: event.id,
      type: 'mongodb',
      occurredAt: new Date().toISOString(),
    };
  });
  await publishEventsBatched(collectionId, events);
}

async function publishBarPurchases() {
  const jsonEvents = loadJsonStreamFile(__dirname + '/../src/lib/__tests__/fixtures/analytics/bar-purchases.ndjson');
  logger.info(`Loaded ${jsonEvents.length} Bar Purchases`);
  const collection = await Collection.findOne({ name: 'bar-purchases' });
  if (!collection) throw new Error('Could not find collection');
  const collectionId = collection._id.toString();
  const events = jsonEvents.map((event) => {
    return {
      ...event,
      _id: event.id,
      type: 'mongodb',
      occurredAt: new Date().toISOString(),
    };
  });
  await publishEventsBatched(collectionId, events);
}

async function run() {
  await initDB();
  await publishEvseMeterValues();
  await publishEvseControllers();
  await publishBarPurchases();
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
