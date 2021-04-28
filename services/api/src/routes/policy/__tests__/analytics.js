const {
  refreshIndex,
  deleteIndex,
  ensureCollectionIndex,
  loadJsonStreamFile,
  bulkIndexBatchEvents,
  bulkErrorLog,
  getCollectionIndex,
} = require('../../../lib/analytics');
const { setupDb, teardownDb, request } = require('../../../utils/testing');
const { Policy, Collection } = require('../../../models');
const { createPolicyToken } = require('../../../lib/tokens');
const mongoose = require('mongoose');

jest.setTimeout(40 * 1000);

const indexEvents = async (collectionId) => {
  const events = loadJsonStreamFile(__dirname + '/fixtures/evse-metervalues-10.ndjson');
  const index = getCollectionIndex(collectionId);
  // console.info(collectionId, index);
  await deleteIndex(index);
  await ensureCollectionIndex(collectionId);
  const batch = {
    datalakeId: 'datalake1',
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
    datalake: new mongoose.Types.ObjectId(),
  });
  await indexEvents(testCollection.id.toString());
});

afterAll(async () => {
  await teardownDb();
});

describe('/1/analytics', () => {
  describe('POST /search', () => {
    it('should allow analytics search for correct policy', async () => {
      expect(true).toBe(true);
      const collectionId = testCollection.id;
      const policy = await Policy.create({
        collections: [{ collectionId }],
      });
      const headers = { Authorization: `Bearer ${createPolicyToken(policy)}` };

      const response = await request('POST', '/1/policy/analytics/search', { collectionId }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.hits.hits.length).toBe(10);
    });
    it('should deny analytics for incorrect policy', async () => {
      const policy = await Policy.create({
        collections: [{ collectionId: new mongoose.Types.ObjectId() }],
      });
      const headers = { Authorization: `Bearer ${createPolicyToken(policy)}` };
      const collectionId = testCollection.id;
      const response = await request('POST', '/1/policy/analytics/search', { collectionId }, { headers });
      expect(response.status).toBe(401);
    });
    it('should allow scoped analytics search', async () => {
      expect(true).toBe(true);
      const collectionId = testCollection.id;
      const policy = await Policy.create({
        collections: [
          {
            collectionId,
            scope: {
              evseControllerId: '5fd6036fccd06f4d6b1d8bd2',
            },
          },
        ],
      });
      const headers = { Authorization: `Bearer ${createPolicyToken(policy)}` };

      const response = await request('POST', '/1/policy/analytics/search', { collectionId }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.hits.hits.length).toBe(6); // ignores 4 out of 10
    });
    it('should allow multiple scoped fields analytics search', async () => {
      expect(true).toBe(true);
      const collectionId = testCollection.id;
      const policy = await Policy.create({
        collections: [
          {
            collectionId,
            scope: {
              evseControllerId: '5fd6036fccd06f4d6b1d8bd2',
              method: 'MeterValues',
            },
          },
        ],
      });
      const headers = { Authorization: `Bearer ${createPolicyToken(policy)}` };

      const response = await request('POST', '/1/policy/analytics/search', { collectionId }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.hits.hits.length).toBe(5); // ignores 'method': 'BogusValues'
    });
    it('should allow analytics search with multiple collections policy', async () => {
      expect(true).toBe(true);
      const collectionId = testCollection.id;
      const policy = await Policy.create({
        collections: [
          {
            collectionId: new mongoose.Types.ObjectId(),
          },
          {
            collectionId,
            scope: {
              evseControllerId: '5fd6036fccd06f4d6b1d8bd2',
              method: 'MeterValues',
            },
          },
        ],
      });
      const headers = { Authorization: `Bearer ${createPolicyToken(policy)}` };

      const response = await request('POST', '/1/policy/analytics/search', { collectionId }, { headers });
      expect(response.status).toBe(200);
      expect(response.body.hits.hits.length).toBe(5); // ignores 'method': 'BogusValues'
    });
  });
});
