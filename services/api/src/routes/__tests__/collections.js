const { setupDb, teardownDb, request, createUser } = require('../../utils/testing');
const { Collection } = require('../../models');
const { ensureCollectionIndex, getCollectionIndex, deleteIndex } = require('../../lib/analytics');

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

describe('/1/collections', () => {
  describe('POST /', () => {
    it('should be able to create collection', async () => {
      const user = await createUser();
      const response = await request(
        'POST',
        '/1/collections',
        {
          name: 'some other collection',
        },
        { user }
      );
      const data = response.body.data;
      expect(response.status).toBe(200);
      expect(data.name).toBe('some other collection');
    });

    it('should not be able to create collection with existing name', async () => {
      await Collection.deleteMany({});
      const user = await createUser();
      const name = 'some other collection';
      await Collection.create({ name });
      const response = await request('POST', '/1/collections', { name }, { user });
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /', () => {
    it('should be able to create collection', async () => {
      await Collection.deleteMany({});
      const user = await createUser();
      const name = 'some other collection';
      await Collection.create({ name });
      // pre-existing name:
      const response = await request('PUT', '/1/collections', { name }, { user });
      const data = response.body.data;
      expect(response.status).toBe(200);
      expect(data.name).toBe(name);
      // Not pre-existing name:
      const name2 = name + '2';
      const response2 = await request('PUT', '/1/collections', { name: name2 }, { user });
      const data2 = response2.body.data;
      expect(response2.status).toBe(200);
      expect(data2.name).toBe(name2);
    });
  });

  describe('GET /:collection', () => {
    it('should be able to access collection', async () => {
      const user = await createUser();
      await Collection.deleteMany({});
      const collection = await Collection.create({
        name: 'test 1',
        description: 'Some description',
      });
      await ensureCollectionIndex(collection.id);
      const response = await request('GET', `/1/collections/${collection.id}`, {}, { user });
      await deleteIndex(getCollectionIndex(collection.id));
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(collection.name);
    });
  });

  describe('POST /search', () => {
    it('should list out collections', async () => {
      const user = await createUser();
      await Collection.deleteMany({});

      const collection1 = await Collection.create({
        name: 'test 1',
        description: 'Some description',
      });

      const collection2 = await Collection.create({
        name: 'test 2',
        description: 'Some description',
      });

      const response = await request('POST', '/1/collections/search', {}, { user });

      expect(response.status).toBe(200);
      const body = response.body;
      expect(body.data[1].name).toBe(collection1.name);
      expect(body.data[0].name).toBe(collection2.name);

      expect(body.meta.total).toBe(2);
    });
  });

  describe('PATCH /:collection', () => {
    it('admins should be able to update collection', async () => {
      const user = await createUser();
      await Collection.deleteMany({});

      const collection = await Collection.create({
        name: 'test 1',
        description: 'Some description',
      });
      const response = await request('PATCH', `/1/collections/${collection.id}`, { name: 'new name' }, { user });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('new name');
      const dbCollection = await Collection.findById(collection.id);
      expect(dbCollection.name).toEqual('new name');
    });
  });

  describe('DELETE /:collection', () => {
    it('should be able to delete collection', async () => {
      const user = await createUser();
      await Collection.deleteMany({});

      const collection = await Collection.create({
        name: 'test 1',
        description: 'Some description',
      });
      const response = await request('DELETE', `/1/collections/${collection.id}`, {}, { user });
      expect(response.status).toBe(204);
      const dbCollection = await Collection.findById(collection.id);
      expect(dbCollection).toBeNull();
    });
  });
});
