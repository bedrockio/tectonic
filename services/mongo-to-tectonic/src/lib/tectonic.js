const config = require('@bedrockio/config');
const fetch = require('node-fetch');
const { logger } = require('@bedrockio/instrumentation');

const TECTONIC_URL = config.get('TECTONIC_URL');
const TECTONIC_APPLICATION_TOKEN = config.get('TECTONIC_APPLICATION_TOKEN');
const TECTONIC_COLLECTION_PREFIX = config.get('TECTONIC_COLLECTION_PREFIX');

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TECTONIC_APPLICATION_TOKEN}`,
};

async function ensureCollection(tectonicCollectionName, description, timeField) {
  logger.info(`Ensuring Tectonic collection ${tectonicCollectionName}`);
  const response = await fetch(TECTONIC_URL + '/1/collections', {
    method: 'PUT',
    body: JSON.stringify({
      name: tectonicCollectionName,
      description,
      timeField,
    }),
    headers,
  });
  return await response.json();
}

async function collectEvents(tectonicCollectionName, events) {
  const response = await fetch(TECTONIC_URL + '/1/events', {
    method: 'POST',
    body: JSON.stringify({
      collection: tectonicCollectionName,
      events,
    }),
    headers,
  });
  const { error } = await response.json();
  if (error) {
    throw new Error('[collectEvents] ' + error.message);
  }
}

async function ensureCollectionsAccessPolicy(tectonicCollectionNames) {
  const response = await fetch(TECTONIC_URL + '/1/access-policies', {
    method: 'PUT',
    body: JSON.stringify({
      name: 'mongodb-indexed-collections',
      collections: tectonicCollectionNames.map((name) => {
        return {
          collection: name,
        };
      }),
    }),
    headers,
  });
  const { data, error } = await response.json();
  if (error) {
    throw new Error('[ensureCollectionsAccessPolicy] ' + error.message);
  }
  return data;
}

async function ensureCollectionAccessCredential(tectonicCollectionNames) {
  const accessPolicy = await ensureCollectionsAccessPolicy(tectonicCollectionNames);
  const response = await fetch(TECTONIC_URL + '/1/access-credentials', {
    method: 'PUT',
    body: JSON.stringify({
      name: 'mongodb-indexed-collections',
      accessPolicy: accessPolicy.id,
    }),
    headers,
  });
  const { data, error } = await response.json();
  if (error) {
    throw new Error('[ensureCollectionAccessCredential] ' + error.message);
  }
  return data;
}

async function getLastEntryAt(tectonicCollectionName) {
  const response = await fetch(TECTONIC_URL + '/1/collections/' + tectonicCollectionName + '/last-entry-at', {
    method: 'GET',
    headers,
  });
  const { data, error } = await response.json();
  if (error) {
    throw new Error('[getLastEntryAt] ' + error.message);
  }
  return data;
}

function getTectonicCollectionName(mongoCollectionName) {
  return TECTONIC_COLLECTION_PREFIX + '-' + mongoCollectionName;
}

function getTectonicHistoricalCollectionName(mongoCollectionName) {
  return TECTONIC_COLLECTION_PREFIX + '-history-' + mongoCollectionName;
}

module.exports = {
  ensureCollection,
  collectEvents,
  ensureCollectionsAccessPolicy,
  ensureCollectionAccessCredential,
  getLastEntryAt,
  getTectonicCollectionName,
  getTectonicHistoricalCollectionName,
};
