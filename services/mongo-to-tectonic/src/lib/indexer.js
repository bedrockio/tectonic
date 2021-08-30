const config = require('@bedrockio/config');
const { logger } = require('@bedrockio/instrumentation');
const { unset } = require('lodash');
const { collectEvents, getLastEntryAt, getTectonicCollectionName } = require('./tectonic');

const MONGO_UPDATED_AT_FIELD = config.get('MONGO_UPDATED_AT_FIELD');
const MONGO_EXCLUDE_ATTRIBUTES = config.get('MONGO_EXCLUDE_ATTRIBUTES');
const MONGO_VERSION_FIELD = config.get('MONGO_VERSION_FIELD');

async function readCursor(cursor, limit) {
  const docs = [];
  const items = new Array(limit);
  for (const item of items) {
    const doc = await cursor.next();
    if (!doc) break;
    docs.push(doc);
  }
  return docs;
}

async function collectDocumentsHistorical(tectonicCollectionName, documents, ts = Date.now()) {
  const events = documents.map((document) => {
    const version = document[MONGO_VERSION_FIELD];
    if (!version) {
      logger.warn(`No version field present for documents in index ${index}`);
    }
    return { ...document, _id: `${document._id.toString()}-${version}` };
  });

  try {
    // TODO: add retry
    await collectEvents(tectonicCollectionName, events);
  } catch (e) {
    logger.error(e);
    logger.warn(`Could not collect historical events into Tectonic collection: ${tectonicCollectionName}`);
  }
}

async function collectDocuments(tectonicCollectionName, documents) {
  const events = documents.map((rawDoc) => {
    const doc = Object.assign({}, rawDoc);
    const id = doc._id.toString();
    delete doc._id;
    return { ...doc, id };
  });

  try {
    // TODO: add retry
    await collectEvents(tectonicCollectionName, events);
  } catch (e) {
    logger.error(e);
    logger.warn(`Could not collect events into Tectonic collection: ${tectonicCollectionName}`);
  }
}

function sanitizeDocuments(collectionName, docs, attributes = null) {
  if (!attributes) {
    attributes = MONGO_EXCLUDE_ATTRIBUTES.split(/\,\s*/);
  }
  const collectionAttributes = [];
  attributes.forEach((attribute) => {
    if (attribute.match(new RegExp(`^${collectionName}`))) {
      collectionAttributes.push(attribute.split('.').slice(1));
    }
  });
  if (!collectionAttributes.length) {
    return docs;
  }
  return docs.map((doc) => {
    collectionAttributes.forEach((path) => {
      unset(doc, path);
    });
    return doc;
  });
}

async function syncMongodbCollection(
  db,
  collectionName,
  query = {},
  options = { enableHistorical: false, bucketName: undefined }
) {
  const collection = db.collection(collectionName);
  const startTs = Date.now();
  const total = await collection.countDocuments(query);
  let numCollected = 0;
  if (total > 0) {
    logger.info(`Collecting ${collectionName} (total: ${total})`);
    const batchSize = 1000;
    const cursor = collection.find(query, { timeout: false }).sort([
      [MONGO_UPDATED_AT_FIELD, -1],
      ['_id', 1],
    ]);

    const numBatches = Math.ceil(total / batchSize);
    const batches = new Array(numBatches);
    if (process.env.NODE_ENV == 'development') process.stdout.write(`Collecting with batchSize: ${batchSize}: `);
    for (const batch of batches) {
      const result = await readCursor(cursor, batchSize);
      if (result.length) {
        if (process.env.NODE_ENV == 'development') process.stdout.write('*');
        const sanitizedResult = sanitizeDocuments(collectionName, result);
        const tectonicCollectionName = getTectonicCollectionName(collectionName);
        await collectDocuments(tectonicCollectionName, sanitizedResult);
        if (options.enableHistorical) {
          const tectonicHistoricalCollectionName = getTectonicHistoricalCollectionName(collectionName);
          await collectDocumentsHistorical(tectonicHistoricalCollectionName, sanitizedResult);
        }
      }
      numCollected += result.length;
    }
    if (process.env.NODE_ENV == 'development') process.stdout.write('*');
  }
  return { total, numCollected, duration: Date.now() - startTs };
}

async function indexMongodbCollection(db, collectionName, options = { enableHistorical: false }) {
  const tectonicCollectionName = getTectonicCollectionName(collectionName);
  const lastEntryAt = await getLastEntryAt(tectonicCollectionName);

  let query = {};
  if (lastEntryAt) {
    query[MONGO_UPDATED_AT_FIELD] = {
      $gt: new Date(lastEntryAt),
    };
  }
  const stats = await syncMongodbCollection(db, collectionName, query, options);
  return { ...stats, collectionName };
}

async function autoIndexMongodbCollections(db, collectionNames, collectionNamesHistorical, intervalSeconds = 30) {
  logger.info(`Starting auto indexing for MongoDB collections: ${collectionNames.join(',')}`);
  return new Promise((resolve, reject) => {
    async function run() {
      for (const collectionName of collectionNames) {
        try {
          const result = await indexMongodbCollection(db, collectionName, {
            enableHistorical: collectionNamesHistorical.includes(collectionName),
          });
          if (result.total > 0) {
            logger.info(
              `Detected ${result.total} new documents in collection ${result.collectionName}: numCollected=${result.numCollected}, duration=${result.duration}ms`
            );
          }
        } catch (error) {
          console.error(`Error while running auto index jobs: ${error.message}`);
          console.error(error.stack);
          console.error(JSON.stringify(error));
        }
      }
      setTimeout(run, intervalSeconds * 1000);
    }
    run();
  });
}

function autoIndexMongodbCollectionsParallel(db, collectionNames, collectionNamesHistorical, intervalSeconds = 30) {
  logger.info(`Starting auto indexing for MongoDB collections: ${collectionNames.join(',')}`);
  return new Promise((resolve, reject) => {
    function run() {
      const jobs = collectionNames.map((collectionName) => {
        return indexMongodbCollection(db, collectionName, {
          enableHistorical: collectionNamesHistorical.includes(collectionName),
        });
      });
      Promise.all(jobs)
        .then((results) => {
          results.forEach((result) => {
            if (result.total > 0) {
              logger.info(
                `Detected ${result.total} new documents in collection ${result.collectionName}: numCollected=${result.numCollected}, duration=${result.duration}ms`
              );
            }
          });
          setTimeout(run, intervalSeconds * 1000);
        })
        .catch((error) => {
          console.error(`Error while running auto index jobs: ${error.message}`);
          console.error(error.stack);
          console.error(JSON.stringify(error));
          reject(error);
        });
    }
    run();
  });
}

module.exports = {
  indexMongodbCollection,
  autoIndexMongodbCollections,
  sanitizeDocuments,
};
