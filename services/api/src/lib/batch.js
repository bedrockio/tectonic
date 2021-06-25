const config = require('@bedrockio/config');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { logger } = require('@bedrockio/instrumentation');
const { Storage } = require('@google-cloud/storage');

function storeLocalFile(fileName, contentString) {
  // const logger = createLogger();
  const destinationPath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(destinationPath, contentString);
  // logger.info('Saving locally %s', destinationPath);
  return destinationPath;
}

async function storeGcsFile(fileName, contentString) {
  const storage = new Storage();
  const bucketName = config.get('BATCHES_GCS_BUCKET');
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  const destination = `gs://${bucketName}/${fileName}`;
  logger.info(`Storing gcs file -> ${destination}`);
  await file.save(contentString);
  return destination;
}

function dateToString(d) {
  return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}-${(
    '0' + d.getHours()
  ).slice(-2)}-${('0' + d.getMinutes()).slice(-2)}-${('0' + d.getSeconds()).slice(-2)}`;
}

async function storeBatchEvents(batch, events) {
  const { collectionId, id: batchId, ingestedAt } = batch;

  const ndEvents = events.map((event) => JSON.stringify(event)).join('\n');
  const dateString = dateToString(ingestedAt);

  const fileName = `${collectionId}-${dateString}-${batchId}.ndjson`;

  if (config.get('BATCHES_STORE') === 'gcs') {
    return await storeGcsFile(fileName, ndEvents);
  } else {
    return storeLocalFile(fileName, ndEvents);
  }
}

module.exports = { storeBatchEvents };
