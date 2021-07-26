const process = require('process');
const config = require('@bedrockio/config');
const yargs = require('yargs');
const { logger } = require('@bedrockio/instrumentation');
const { connect } = require('./../src/lib/mongodb');
const { indexMongodbCollection } = require('./../src/lib/indexer');
const { ensureCollection, getTectonicCollectionName } = require('./../src/lib/tectonic');

const MONGO_UPDATED_AT_FIELD = config.get('MONGO_UPDATED_AT_FIELD');

const argv = yargs
  .option('collection-name', {
    description: 'MongoDB collection name',
  })
  .demandOption(['collection-name']).argv;

async function run() {
  const db = await connect();
  const collectionName = argv['collection-name'];
  const description = 'MongoDB indexed collection';
  const tectonicCollectionName = getTectonicCollectionName(collectionName);
  await ensureCollection(tectonicCollectionName, description, MONGO_UPDATED_AT_FIELD);
  const result = await indexMongodbCollection(db, collectionName);
  logger.info(
    `Detected ${result.total} new documents in collection ${result.collectionName}: numIndexed=${result.numIndexed}, index=${result.index}, duration=${result.duration}ms`
  );
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Fatal error: ${error.message}, exiting.`);
    process.exit(1);
  });
