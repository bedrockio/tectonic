const process = require('process');
const { logger } = require('@bedrockio/instrumentation');

const { initialize } = require('../src/utils/database');
const { createFixtures } = require('../src/fixtures');
const { Collection, ApplicationCredential } = require('../src/models');
const { createCredentialToken } = require('../src/lib/tokens');
const { loadJsonStreamFile } = require('../src/lib/analytics');
const { publishEventsBatched } = require('../src/lib/events');

// async function publishEvseMeterValues(token) {
//   const jsonEvents = loadJsonStreamFile(
//     __dirname + '/../src/lib/__tests__/fixtures/analytics/evse-metervalues-1k.ndjson'
//   );
//   logger.info(`Loaded ${jsonEvents.length} EVSE controllers`);
//   const collection = await Collection.findOne({ name: 'evse-metervalues' });
//   if (!collection) throw new Error('Could not find collection');
//   const collectionId = collection._id.toString();
//   const events = jsonEvents.map((event) => {
//     return {
//       ...event,
//       type: 'mongodb',
//       occurredAt: new Date().toISOString(),
//     };
//   });
//   await publishEventsBatched(collectionId, events, token);
// }

// async function publishEvseControllers(token) {
//   const jsonEvents = loadJsonStreamFile(__dirname + '/../src/lib/__tests__/fixtures/analytics/evse-controllers.ndjson');
//   logger.info(`Loaded ${jsonEvents.length} EVSE meter values`);
//   const collection = await Collection.findOne({ name: 'evse-controllers' });
//   if (!collection) throw new Error('Could not find collection');
//   const collectionId = collection._id.toString();
//   const events = jsonEvents.map((event) => {
//     return {
//       ...event,
//       _id: event.id,
//       type: 'mongodb',
//       occurredAt: new Date().toISOString(),
//     };
//   });
//   await publishEventsBatched(collectionId, events, token);
// }

async function publishBarPurchases(token) {
  const jsonEvents = loadJsonStreamFile(__dirname + '/../src/lib/__tests__/fixtures/analytics/bar-purchases.ndjson');
  logger.info(`Loaded ${jsonEvents.length} Bar Purchases`);
  const collection = await Collection.findOne({ name: 'bar-purchases' });
  if (!collection) throw new Error('Could not find collection');
  const collectionId = collection._id.toString();
  const events = jsonEvents.map((event) => {
    return {
      ...event,
      _id: event.id,
      occurredAt: event.orderedAt,
    };
  });
  await publishEventsBatched(collectionId, events, token);
}

async function run() {
  await initialize();
  let applicationCredential = await ApplicationCredential.findOne();
  if (!applicationCredential) {
    const result = await createFixtures();
    if (!result) {
      logger.info('No DB fixtures to load, database is populated');
    }
    applicationCredential = await ApplicationCredential.findOne();
  }
  if (!applicationCredential) {
    throw new Error('Could not find applicationCredential');
  }
  const token = createCredentialToken(applicationCredential);
  // await publishEvseMeterValues();
  // await publishEvseControllers();
  await publishBarPurchases(token);
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
