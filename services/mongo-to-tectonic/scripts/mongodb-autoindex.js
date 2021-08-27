const process = require('process');
const config = require('@bedrockio/config');
const { logger } = require('@bedrockio/instrumentation');
const { connect } = require('./../src/lib/mongodb');
const { autoIndexMongodbCollections } = require('./../src/lib/indexer');
const {
  ensureCollection,
  ensureCollectionAccessCredential,
  getTectonicCollectionName,
  getTectonicHistoricalCollectionName,
} = require('./../src/lib/tectonic');

const MONGO_UPDATED_AT_FIELD = config.get('MONGO_UPDATED_AT_FIELD');
const MONGO_COLLECTIONS_TO_INDEX = config.get('MONGO_COLLECTIONS_TO_INDEX');
const MONGO_COLLECTIONS_TO_INDEX_HISTORICAL = config.get('MONGO_COLLECTIONS_TO_INDEX_HISTORICAL');
const MONGO_INDEXER_INTERVAL_SECONDS = config.get('MONGO_INDEXER_INTERVAL_SECONDS');

async function run() {
  const db = await connect();
  const collectionNames = MONGO_COLLECTIONS_TO_INDEX.split(/\,\s*/).filter(Boolean);
  let collectionNamesHistorical = [];
  if (MONGO_COLLECTIONS_TO_INDEX_HISTORICAL && MONGO_COLLECTIONS_TO_INDEX_HISTORICAL != 'null') {
    collectionNamesHistorical = MONGO_COLLECTIONS_TO_INDEX_HISTORICAL.split(/\,\s*/).filter(Boolean);
  }

  const tectonicCollectionNames = collectionNames.map((name) => getTectonicCollectionName(name));
  const tectonicHistoricalCollectionNames = collectionNamesHistorical.map((name) =>
    getTectonicHistoricalCollectionName(name)
  );

  logger.info('Ensure MongoDB UPDATED_AT_FIELD indexes');
  for (const collectionName of collectionNames) {
    try {
      const collection = db.collection(collectionName);
      const index = {};
      index[MONGO_UPDATED_AT_FIELD] = -1;
      index['_id'] = 1;
      await collection.createIndex(index);
    } catch (e) {
      logger.error(e);
    }
  }

  logger.info('Ensure Tectonic collections');
  for (const tectonicCollectionName of tectonicCollectionNames.concat(tectonicHistoricalCollectionNames)) {
    let description = 'MongoDB indexed collection';
    await ensureCollection(tectonicCollectionName, description, MONGO_UPDATED_AT_FIELD);
  }

  logger.info('Ensure Access Credential');
  await ensureCollectionAccessCredential(tectonicCollectionNames.concat(tectonicHistoricalCollectionNames));

  const intervalSeconds = parseInt(MONGO_INDEXER_INTERVAL_SECONDS, 10);
  logger.info(`Start auto index mongodb collections with ${intervalSeconds} sec interval`);
  await autoIndexMongodbCollections(db, collectionNames, collectionNamesHistorical, intervalSeconds);
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Fatal error: ${error.message}, exiting.`);
    process.exit(1);
  });
