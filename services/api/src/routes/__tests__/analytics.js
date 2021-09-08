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
      expect(mapping[index].mappings.properties._tectonic.properties.ingestedAt.type).toBe('date');
      expect(mapping[index].mappings.properties.updatedAt.type).toBe('date');
      expect(mapping[index].mappings.properties.messageId.type).toBe('keyword');
    });
  });

  describe('POST /terms', () => {
    it('should allow analytics terms for correct policy', async () => {
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
        '/1/analytics/terms',
        {
          collection: collectionId,
          aggField: 'params.connectorId',
          filter: { terms: [{ destination: 'centralsystem' }] },
        },
        { headers }
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(4);
      expect(response.body.data.find(({ key }) => key == 1).count).toBe(5);
    });

    it('should fail with incorrect filter terms', async () => {
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
        '/1/analytics/terms',
        {
          collection: collectionId,
          aggField: 'params.connectorId',
          filter: { terms: [{ destination: { centralsystem: 'deep' } }] },
        },
        { headers }
      );
      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe(
        'terms should be array with objects of max 1 level deep and with string keys'
      );
    });

    it('should fail with non included aggField', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy',
        collections: [{ collectionName, includeFields: ['destination'] }],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request(
        'POST',
        '/1/analytics/terms',
        {
          collection: collectionId,
          aggField: 'params.connectorId',
          filter: { terms: [{ destination: 'centralsystem' }] },
        },
        { headers }
      );
      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe("aggField 'params.connectorId' is not included");
    });

    it('should fail with non included terms', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy',
        collections: [{ collectionName, includeFields: ['params.connectorId'] }],
      });
      const accessCredential = await AccessCredential.create({
        name: 'access-cred',
        accessPolicy,
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request(
        'POST',
        '/1/analytics/terms',
        {
          collection: collectionId,
          aggField: 'params.connectorId',
          filter: { terms: [{ destination: 'centralsystem' }] },
        },
        { headers }
      );
      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe("Filter term 'destination' is not included");
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
            excludeFields: ['messageId', 'params', '_tectonic.batchId', 'doesNotExist'],
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
      expect(hit.destination).toBeDefined();
      // undefined
      expect(hit._tectonic.batchId).toBeUndefined();
      expect(hit.messageId).toBeUndefined();
      expect(hit.params).toBeUndefined();
      expect(hit.doesNotExist).toBeUndefined();
    });

    it('should work with fields.includes', async () => {
      const collectionId = testCollection.id;
      const collectionName = testCollection.name;
      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-policy-includes',
        collections: [
          {
            collectionName,
            includeFields: ['messageId', 'params', '_tectonic.batchId', 'doesNotExist'],
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
      expect(hit.destination).toBeUndefined();
      expect(hit.doesNotExist).toBeUndefined();
      // defined
      expect(response.body.data[0]._id).toBeDefined();
      expect(hit._tectonic.batchId).toBeDefined();
      expect(hit.messageId).toBeDefined();
      expect(hit.params).toBeDefined();

      const responseDebug = await request(
        'POST',
        '/1/analytics/search',
        { collection: collectionId, filter: { size: 1 }, debug: true },
        { headers }
      );
      expect(responseDebug.body.meta).toBeDefined();
      expect(responseDebug.body.meta.searchQuery.body).toStrictEqual({
        sort: [{ '_tectonic.ingestedAt': { order: 'desc' } }],
        from: 0,
        size: 1,
        _source: {
          includes: ['messageId', 'params', '_tectonic.batchId', 'doesNotExist'],
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
        sort: [{ '_tectonic.ingestedAt': { order: 'desc' } }],
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
        sort: [{ '_tectonic.ingestedAt': { order: 'desc' } }],
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
        scopeValues: [{ field: 'evseControllerId', values: ['5fd6036fccd06f4d6b1d8bd2'] }],
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request(
        'POST',
        '/1/analytics/search',
        { collection: collectionName, debug: true },
        { headers }
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(6); // ignores 4 out of 10
      expect(response.body.meta.searchQuery.body.query).toStrictEqual({
        bool: {
          must: [
            {
              term: {
                evseControllerId: '5fd6036fccd06f4d6b1d8bd2',
              },
            },
          ],
        },
      });
    });

    it('should allow scopeFields analytics search with multiple scopeValues values', async () => {
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
        scopeValues: [{ field: 'evseControllerId', values: ['5fd6036fccd06f4d6b1d8bd2', '5fa1a16c41470583c056e6d4'] }],
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request(
        'POST',
        '/1/analytics/search',
        { collection: collectionName, debug: true },
        { headers }
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(7); // ignores 3 out of 10
      expect(response.body.meta.searchQuery.body.query).toStrictEqual({
        bool: {
          must: [
            {
              bool: {
                should: [
                  {
                    term: {
                      evseControllerId: '5fd6036fccd06f4d6b1d8bd2',
                    },
                  },
                  {
                    term: {
                      evseControllerId: '5fa1a16c41470583c056e6d4',
                    },
                  },
                ],
              },
            },
          ],
        },
      });
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
        scopeValues: [{ field: 'wrongOne', values: ['5fd6036fccd06f4d6b1d8bd2'] }],
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('POST', '/1/analytics/search', { collection: collectionId }, { headers });
      expect(response.status).toBe(401);
      expect(getParsedErrorMessage(response)).toBe("Missing scopeValues for field 'evseControllerId'");
    });
  });
});
