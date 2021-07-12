const { setupDb, teardownDb, request, createUser } = require('../../utils/testing');
const { Batch, Collection } = require('../../models');

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

describe('/1/batches', () => {
  describe('GET /:batchId', () => {
    it('should be able to access batch', async () => {
      const user = await createUser();
      const collection = await Collection.create({
        name: 'test 1',
        description: 'Some description',
      });
      const now = Date.now();
      const numEvents = 10;
      const author = {
        type: 'user',
        id: user.id,
      };
      const batch = await Batch.create({
        collectionId: collection,
        ingestedAt: new Date(now),
        numEvents,
        minOccurredAt: new Date(now - 60 * 1000),
        maxOccurredAt: new Date(now + 60 * 1000),
        author,
      });
      const response = await request('GET', `/1/batches/${batch.id}`, {}, { user });
      expect(response.status).toBe(200);
      expect(response.body.data.numEvents).toBe(numEvents);
    });
  });

  describe('POST /search', () => {
    it('should list out batches', async () => {
      const user = await createUser();
      await Collection.deleteMany({});
      await Batch.deleteMany({});

      const collection1 = await Collection.create({
        name: 'test 1',
        description: 'Some description',
      });

      const collection2 = await Collection.create({
        name: 'test 2',
        description: 'Some description',
      });

      const now = Date.now();
      const numEvents = 10;
      const author = {
        type: 'user',
        id: user.id,
      };
      await Batch.create({
        collectionId: collection1,
        ingestedAt: new Date(now),
        numEvents,
        minOccurredAt: new Date(now - 60 * 1000),
        maxOccurredAt: new Date(now + 60 * 1000),
        author,
      });

      await Batch.create({
        collectionId: collection2,
        ingestedAt: new Date(now),
        numEvents: numEvents + 1,
        minOccurredAt: new Date(now - 60 * 1000),
        maxOccurredAt: new Date(now + 60 * 1000),
        author,
      });
      const response = await request('POST', '/1/batches/search', {}, { user });

      expect(response.status).toBe(200);
      const body = response.body;
      expect(body.data[1].numEvents).toBe(numEvents);
      expect(body.data[0].numEvents).toBe(numEvents + 1);
      expect(body.meta.total).toBe(2);

      // search given collection id
      const response2 = await request('POST', '/1/batches/search', { collection: collection1.id }, { user });
      expect(response2.status).toBe(200);
      expect(response2.body.meta.total).toBe(1);

      // search given collection name
      const response3 = await request('POST', '/1/batches/search', { collection: collection2.name }, { user });
      expect(response3.status).toBe(200);
      expect(response3.body.meta.total).toBe(1);
    });
  });

  describe('DELETE /:batchId', () => {
    it('should be able to delete batch', async () => {
      const user = await createUser();
      await Collection.deleteMany({});
      await Batch.deleteMany({});

      const collection = await Collection.create({
        name: 'test 1',
        description: 'Some description',
      });

      const now = Date.now();
      const numEvents = 10;
      const author = {
        type: 'user',
        id: user.id,
      };
      const batch = await Batch.create({
        collectionId: collection,
        ingestedAt: new Date(now),
        numEvents,
        minOccurredAt: new Date(now - 60 * 1000),
        maxOccurredAt: new Date(now + 60 * 1000),
        author,
      });

      const response = await request('DELETE', `/1/batches/${batch.id}`, {}, { user });
      expect(response.status).toBe(204);
      const dbBatch = await Batch.findById(batch.id);
      expect(dbBatch?.deletedAt).not.toBeNull();
    });
  });
});
