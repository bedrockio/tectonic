const process = require('process');
const config = require('@bedrockio/config');
const { logger } = require('./../src/lib/logging');
const { connect } = require('./../src/lib/mongodb');
const { autoIndexMongodbCollections } = require('./../src/lib/indexer');
const {
  ensureCollection,
  ensureCollectionAccessCredential,
  getTectonicCollectionName,
  getTectonicHistoricalCollectionName
} = require('./../src/lib/tectonic');

const MONGO_UPDATED_AT_FIELD = config.get('MONGO_UPDATED_AT_FIELD');
const MONGO_COLLECTIONS_TO_INDEX = config.get('MONGO_COLLECTIONS_TO_INDEX')
const MONGO_COLLECTIONS_TO_INDEX_HISTORICAL = config.has('MONGO_COLLECTIONS_TO_INDEX_HISTORICAL');
const MONGO_INDEXER_INTERVAL_SECONDS = config.get('MONGO_INDEXER_INTERVAL_SECONDS')

async function run() {
  const db = await connect();
  const collectionNames = MONGO_COLLECTIONS_TO_INDEX.split(/\,\s*/);
  let collectionNamesHistorical = [];
  if (MONGO_COLLECTIONS_TO_INDEX_HISTORICAL) {
    collectionNamesHistorical = MONGO_COLLECTIONS_TO_INDEX_HISTORICAL.split(/\,\s*/);
  }

  const tectonicCollectionNames = collectionNames.map((name) => getTectonicCollectionName(name));
  const tectonicHistoricalCollectionNames = collectionNamesHistorical.map((name) => getTectonicHistoricalCollectionName(name));

  await ensureCollectionAccessCredential(tectonicCollectionNames.concat(tectonicHistoricalCollectionNames));
  for (const tectonicCollectionName of tectonicCollectionNames.concat(tectonicHistoricalCollectionNames)) {
    let description = 'MongoDB indexed collection';
    await ensureCollection(tectonicCollectionName, description, MONGO_UPDATED_AT_FIELD);
  }

  const intervalSeconds = parseInt(MONGO_INDEXER_INTERVAL_SECONDS, 10);
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
