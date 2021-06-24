const { setupDb, teardownDb, request } = require('../../utils/testing');
const { ApplicationCredential, Collection, AccessPolicy } = require('../../models');
// const { ensureCollectionIndex, getCollectionIndex, deleteIndex } = require('../../lib/analytics');
const { createCredentialToken } = require('../../lib/tokens');
const { uniqueId } = require('lodash');

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

beforeEach(async () => {
  await Collection.deleteMany({});
  await AccessPolicy.deleteMany({});
  await ApplicationCredential.deleteMany({});
});

async function getHeaders() {
  const applicationCredential = await ApplicationCredential.create({ name: `${uniqueId('application-credential')}` });
  return { Authorization: `Bearer ${createCredentialToken(applicationCredential)}` };
}

describe('/1/access-policies', () => {
  describe('POST /', () => {
    it('should be able to create access-policy', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });
      const systemId = '5fd6036fccd06f4d6b1d8bd2';

      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-policies',
        {
          name: 'access-policy-test',
          collections: [
            {
              collection: collection.name, // fetch by name
              scope: { systemId },
            },
          ],
        },
        { headers }
      );
      const data = response.body.data;
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(data.name).toBe('access-policy-test');
      expect(data.collections[0].collection).toStrictEqual(collection.id);
    });

    it('should not be able to create access-policy with existing name', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });
      const systemId = '5fd6036fccd06f4d6b1d8bd2';

      const name = 'access-policy-test';
      await AccessPolicy.create({ name });

      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-policies',
        {
          name,
          collections: [
            {
              collection: collection.name, // fetch by name
              scope: { systemId },
            },
          ],
        },
        { headers }
      );
      expect(response.error).not.toBeNull();
      expect(response.status).toBe(401);
    });

    it('should be able to create access-policy with existing name on put', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });
      const systemId = '5fd6036fccd06f4d6b1d8bd2';

      const name = 'access-policy-test';
      await AccessPolicy.create({ name });

      const headers = await getHeaders();
      // pre-existing name:
      const response = await request(
        'PUT',
        '/1/access-policies',
        {
          name,
          collections: [
            {
              collection: collection.name, // fetch by name
              scope: { systemId },
            },
          ],
        },
        { headers }
      );
      expect(response.error).toBe(false);
      expect(response.status).toBe(200);

      // No pre-existing name:
      const name2 = name + '2';
      const response2 = await request(
        'PUT',
        '/1/access-policies',
        {
          name: name2,
          collections: [
            {
              collection: collection.name, // fetch by name
              scope: { systemId },
            },
          ],
        },
        { headers }
      );
      expect(response2.error).toBe(false);
      expect(response2.status).toBe(200);
      expect(response2.body.data.name).toBe(name2);
    });
  });

  describe('GET /:policyId', () => {
    it('should be able to access policy', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });

      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-1',
        collections: [{ collectionId: collection.id }],
      });

      const headers = await getHeaders();
      const response = await request('GET', `/1/access-policies/${accessPolicy.id}`, {}, { headers });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(accessPolicy.name);
      expect(response.body.data.collections[0].collection).toBe(collection.id);
    });
  });

  describe('POST /search', () => {
    it('should list out access policies', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });

      const accessPolicy1 = await AccessPolicy.create({
        name: 'access-test-1',
        collections: [{ collectionId: collection.id }],
      });

      const accessPolicy2 = await AccessPolicy.create({
        name: 'access-test-2',
        collections: [{ collectionId: collection.id }],
      });

      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-policies/search',
        { sort: { field: 'name', order: 'desc' } },
        { headers }
      );

      expect(response.status).toBe(200);
      const body = response.body;
      expect(body.data[1].name).toBe(accessPolicy1.name);
      expect(body.data[0].name).toBe(accessPolicy2.name);
      expect(body.data[0].collections[0].collection).toBe(collection.id);

      expect(body.meta.total).toBe(2);
    });
  });

  describe('PATCH /:policyId', () => {
    it('admins should be able to update access policy', async () => {
      const collection = await Collection.create({ name: 'access-policy-collection-test' });
      const collection2 = await Collection.create({ name: 'access-policy-collection-test-2' });

      const name = 'access-test-1';
      const accessPolicy = await AccessPolicy.create({
        name,
        collections: [{ collectionId: collection.id }],
      });

      const headers = await getHeaders();
      const response = await request(
        'PATCH',
        `/1/access-policies/${accessPolicy.id}`,
        { collections: [{ collection: collection2.name }], name: 'new name' },
        { headers }
      );
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(response.body.data.collections[0].collection).toBe(collection2.id);

      // pre-existing name
      await AccessPolicy.create({
        name,
        collections: [{ collectionId: collection.id }],
      });
      const response2 = await request(
        'PATCH',
        `/1/access-policies/${accessPolicy.id}`,
        { collections: [{ collection: collection2.name }], name },
        { headers }
      );
      expect(response2.status).toBe(401);
    });
  });

  describe('DELETE /:policyId', () => {
    it('should be able to delete access policy', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });

      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-1',
        collections: [{ collectionId: collection.id }],
      });

      const headers = await getHeaders();
      const response = await request('DELETE', `/1/access-policies/${accessPolicy.id}`, {}, { headers });
      expect(response.status).toBe(204);
      const dbAccessPolicy = await AccessPolicy.findById(accessPolicy.id);
      expect(dbAccessPolicy).toBeNull();
    });
  });
});
