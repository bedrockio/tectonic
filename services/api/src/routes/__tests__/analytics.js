const {
  refreshIndex,
  deleteIndex,
  ensureCollectionIndex,
  loadJsonStreamFile,
  bulkIndexBatchEvents,
  bulkErrorLog,
  getCollectionIndex,
  getMapping,
} = require('../../lib/analytics');
const { setupDb, teardownDb, request, createUser, getParsedErrorMessage } = require('../../utils/testing');
const { AccessPolicy, AccessCredential, Collection } = require('../../models');
const { createCredentialToken } = require('../../lib/tokens');
const mongoose = require('mongoose');

jest.setTimeout(40 * 1000);
let index;

const indexEvents = async (collection) => {
  const collectionId = collection.id;
  const events = loadJsonStreamFile(__dirname + '/fixtures/evse-metervalues-10.ndjson');
  index = getCollectionIndex(collectionId);
  // console.info(collectionId, index);
  await deleteIndex(index);
  await ensureCollectionIndex(collection);
  // const mapping = await getMapping(index);
  // console.info(JSON.stringify(mapping, null, 2));
  const batch = {
    collectionId,
    id: 'batchId1',
    ingestedAt: new Date().toISOString(),
  };
  const batchEvents = events.map((event) => {
    return {
      batch,
      event,
    };
  });
  const bulkResult = await bulkIndexBatchEvents(batchEvents);
  bulkErrorLog(bulkResult, batchEvents);
  await refreshIndex(index);
};

let testCollection;
let testCollectionId = new mongoose.Types.ObjectId('60892e538668ed5b67e91278');

beforeAll(async () => {
  await setupDb();
  testCollection = await Collection.create({
    _id: testCollectionId,
    name: 'test-collection',
    description: 'none',
    timeField: 'updatedAt',
  });
  await indexEvents(testCollection);
});

afterAll(async () => {
  await teardownDb();
});

beforeEach(async () => {
  await AccessCredential.deleteMany({});
  await AccessPolicy.deleteMany({});
});

describe('/1/analytics', () => {
  describe('Mapping', () => {
    it('should create correct mapping', async () => {
      const mapping = await getMapping(index);
      //console.info(JSON.stringify(mapping, null, 2));
      expect(mapping[index].mappings.properties.ingestedAt.type).toBe('date');
      expect(mapping[index].mappings.properties.event.properties.updatedAt.type).toBe('date');
      expect(mapping[index].mappings.properties.event.properties.messageId.type).toBe('keyword');
    });
  });

  describe('POST /search', () => {
    it('should allow analytics search for correct policy', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy',
        collections: [{ collectionName }],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
    });

    it('should allow analytics search for correct policy with collection name', async () => {
      await AccessPolicy.deleteMany({});
      await AccessCredential.deleteMany({});
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy',
        collections: [{ collectionName }],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('POST', '/1/analytics/search', { collection: collectionName }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
      // console.info(JSON.stringify(response.body.data[0], null, 2));
    });

    it('should allow analytics search for admin user', async () => {
      const user = await createUser();
      const collectionId = testCollection.id;
      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { user });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
    });

    it('should deny analytics for incorrect policy', async () => {
      await Collection.create({ name: 'wrong' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy1',
        collections: [{ collectionName: 'wrong' }],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred2',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };
      const collectionId = testCollection.id;

      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { headers });
      expect(response.status).toBe(401);
    });

    it('should work with fields.excludes', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy-excludes',
        collections: [
          {
            collectionName,
            excludeFields: ['event.messageId', 'event.params', 'batchId', 'doesNotExist', 'event.doesNotExist'],
          },
        ],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request(
        'POST',
        '/1/analytics/search',
        { collection: collectionId, filter: { size: 1 } },
        { headers }
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      const hit = response.body.data[0]._source;
      // defined
      expect(response.body.data[0]._id).toBeDefined();
      expect(hit.event).toBeDefined();
      expect(hit.event.destination).toBeDefined();
      // undefined
      expect(hit.batchId).toBeUndefined();
      expect(hit.event.messageId).toBeUndefined();
      expect(hit.event.params).toBeUndefined();
      expect(hit.doesNotExist).toBeUndefined();
      expect(hit.event.doesNotExist).toBeUndefined();
    });

    it('should work with fields.includes', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy-includes',
        collections: [
          {
            collectionName,
            includeFields: ['event.messageId', 'event.params', 'batchId', 'doesNotExist', 'event.doesNotExist'],
          },
        ],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request(
        'POST',
        '/1/analytics/search',
        { collection: collectionId, filter: { size: 1 } },
        { headers }
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      const hit = response.body.data[0]._source;
      // undefined
      expect(hit.event.destination).toBeUndefined();
      expect(hit.doesNotExist).toBeUndefined();
      expect(hit.event.doesNotExist).toBeUndefined();
      // defined
      expect(response.body.data[0]._id).toBeDefined();
      expect(hit.event).toBeDefined();
      expect(hit.batchId).toBeDefined();
      expect(hit.event.messageId).toBeDefined();
      expect(hit.event.params).toBeDefined();

      const responseDebug = await request(
        'POST',
        '/1/analytics/search',
        { collection: collectionId, filter: { size: 1 }, debug: true },
        { headers }
      );
      expect(responseDebug.body.meta).toBeDefined();
      expect(responseDebug.body.meta.searchQuery.body).toStrictEqual({
        sort: [{ ingestedAt: { order: 'desc' } }],
        from: 0,
        size: 1,
        _source: {
          includes: ['event.messageId', 'event.params', 'batchId', 'doesNotExist', 'event.doesNotExist'],
        },
      });
    });

    it('should allow analytics search in debug mode', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy',
        collections: [{ collectionName }],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request(
        'POST',
        '/1/analytics/search',
        { collection: collectionId, debug: true },
        { headers }
      );
      expect(response.status).toBe(200);
      const meta = response.body.meta;
      expect(meta.searchQuery.index).toBe(index);
      expect(meta.searchQuery.body).toStrictEqual({
        sort: [{ ingestedAt: { order: 'desc' } }],
        from: 0,
        size: 100,
      });
      //console.info(JSON.stringify(data, null, 2));
    });

    it('should fail analytics search with missing index', async () => {
      const collection = await Collection.create({
        name: 'test-collection-2',
        description: 'none',
      });
      const collectionId = collection.id;
      const collectionName = collection.name;
      // Has no ES index
      await AccessPolicy.create({
        name: 'access-test-policy',
        collections: [{ collectionName }],
      });
      const user = await createUser();

      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { user });
      const error = response.body.error;
      expect(response.status).toBe(404);
      expect(error.searchQuery.index).not.toBe(index);
      expect(error.searchQuery.body).toStrictEqual({
        sort: [{ ingestedAt: { order: 'desc' } }],
        from: 0,
        size: 100,
      });
    });
  });

  describe('POST /search with scopes', () => {
    it('should allow scoped analytics search', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy2',
        collections: [
          {
            collectionName,
            scopeString: JSON.stringify({
              evseControllerId: '5fd6036fccd06f4d6b1d8bd2',
            }),
          },
        ],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred3',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(6); // ignores 4 out of 10
      expect(response.body.meta.total).toBe(6);
    });

    it('should allow multiple scoped fields analytics search', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy3',
        collections: [
          {
            collectionName,
            scopeString: JSON.stringify({
              evseControllerId: '5fd6036fccd06f4d6b1d8bd2',
              method: 'MeterValues',
            }),
          },
        ],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred4',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(5); // ignores 'method': 'BogusValues'
    });

    it('should allow analytics search with multiple collections policy', async () => {
      await Collection.create({ name: 'whatever' });
      await AccessCredential.deleteMany({});
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy4',
        collections: [
          {
            collectionName: 'whatever',
          },
          {
            collectionName,
            scopeString: JSON.stringify({
              evseControllerId: '5fd6036fccd06f4d6b1d8bd2',
              method: 'MeterValues',
            }),
          },
        ],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(5); // ignores 'method': 'BogusValues'
    });

    it('should allow scopeFields analytics search', async () => {
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy',
        collections: [
          {
            collectionName,
            scopeFields: ['evseControllerId'],
          },
        ],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
        scopeValues: [{ field: 'evseControllerId', value: '5fd6036fccd06f4d6b1d8bd2' }],
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('POST', '/1/analytics/search', { collection: collectionName }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(6); // ignores 4 out of 10
    });

    it('should not allow missing scopeFields', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy',
        collections: [
          {
            collectionName,
            scopeFields: ['evseControllerId'],
          },
        ],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { headers });
      expect(response.status).toBe(401);
      expect(getParsedErrorMessage(response)).toBe('Missing scopeValues on access credential');
    });

    it('should not allow missing scopeFields field', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy',
        collections: [
          {
            collectionName,
            scopeFields: ['evseControllerId'],
          },
        ],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
        scopeValues: [{ field: 'wrongOne', value: '5fd6036fccd06f4d6b1d8bd2' }],
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { headers });
      expect(response.status).toBe(401);
      expect(getParsedErrorMessage(response)).toBe("Missing scopeValues for field 'evseControllerId'");
    });
  });
});
