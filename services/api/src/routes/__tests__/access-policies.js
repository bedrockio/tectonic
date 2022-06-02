const { setupDb, teardownDb, request, getParsedErrorMessage } = require('../../utils/testing');
const { ApplicationCredential, AccessCredential, Collection, AccessPolicy } = require('../../models');
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
      expect(data.collections[0].collection).toStrictEqual(collection.name);
      expect(data.collections[0].scope).toBeDefined();
      expect(data.collections[0].scope.systemId).toBe(systemId);
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

    it('should be able to update collections on access-policy with put', async () => {
      const collection1 = await Collection.create({
        name: 'access-policy-collections-1-test',
      });
      const collection2 = await Collection.create({
        name: 'access-policy-collections-2-test',
      });
      const systemId = '5fd6036fccd06f4d6b1d8bd2';

      const name = 'access-policy-collections-test';
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
              collection: collection1.name, // fetch by name
              scope: { systemId },
              includeFields: ['id'],
            },
          ],
        },
        { headers }
      );
      expect(response.error).toBe(false);
      expect(response.status).toBe(200);

      const response2 = await request(
        'PUT',
        '/1/access-policies',
        {
          name,
          collections: [
            {
              collection: collection1.name, // fetch by name
              scope: { systemId },
              includeFields: ['id', 'createdAt'],
            },
            {
              collection: collection2.name, // fetch by name
              scope: { systemId },
              includeFields: ['id', 'createdAt'],
            },
          ],
        },
        { headers }
      );
      expect(response2.error).toBe(false);
      expect(response2.status).toBe(200);
      //console.log(JSON.stringify(response2.body, null, 2));
      expect(response2.body.data.collections.length).toBe(2);
      expect(response2.body.data.collections[0].includeFields).toStrictEqual(['id', 'createdAt']);
    });

    it('should not be able to create access-policy with nested scope object', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });

      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-policies',
        {
          name: 'access-policy-test',
          collections: [
            {
              collection: collection.name, // fetch by name
              scope: { systemId: { mac: 'os' } },
            },
          ],
        },
        { headers }
      );
      // if (response.error) console.error(response.error);
      expect(response.status).toBe(401);
      expect(getParsedErrorMessage(response)).toBe('scope should be an object max 1 level deep and with string keys');
    });

    it('should be able to create access-policy with dot in scope field name', async () => {
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
              scope: { 'event.systemId': systemId },
            },
          ],
        },
        { headers }
      );
      // if (response.error) console.error(response.error);
      expect(response.error).toBe(false);
      expect(response.status).toBe(200);
      expect(response.body.data.collections[0].scope['event.systemId']).toBe(systemId);
    });
  });

  describe('GET /:policyId', () => {
    it('should be able to access policy', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });

      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-1',
        collections: [{ collectionName: collection.name }],
      });

      const headers = await getHeaders();
      const response = await request('GET', `/1/access-policies/${accessPolicy.id}`, {}, { headers });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(accessPolicy.name);
      expect(response.body.data.collections[0].collection).toBe(collection.name);
    });

    it('should not be able to access policy with access type credentials', async () => {
      await AccessCredential.deleteMany({});
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });

      const accessPolicy = await AccessPolicy.create({
        name: 'access-test-1',
        collections: [{ collectionName: collection.name }],
      });

      const accessCredential = await AccessCredential.create({ name: 'access-policy-test', accessPolicy });
      const headers = { Authorization: `Bearer ${createCredentialToken(accessCredential)}` };

      const response = await request('GET', `/1/access-policies/${accessPolicy.id}`, {}, { headers });
      expect(getParsedErrorMessage(response)).toBe("jwt token type 'access' is not allowed");
      expect(response.status).toBe(401);
    });
  });

  describe('POST /search', () => {
    it('should list out access policies', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });

      const accessPolicy1 = await AccessPolicy.create({
        name: 'access-test-1',
        collections: [{ collectionName: collection.name }],
      });

      const accessPolicy2 = await AccessPolicy.create({
        name: 'access-test-2',
        collections: [{ collectionName: collection.name }],
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
      expect(body.data[0].collections[0].collection).toBe(collection.name);

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
        collections: [{ collectionName: collection.name }],
      });

      const systemId = '42';
      const headers = await getHeaders();
      const response = await request(
        'PATCH',
        `/1/access-policies/${accessPolicy.id}`,
        { collections: [{ collection: collection2.name, scope: { systemId } }], name: 'new name' },
        { headers }
      );
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(response.body.data.collections[0].collection).toBe(collection2.name);
      expect(response.body.data.collections[0].scope).toBeDefined();
      expect(response.body.data.collections[0].scope.systemId).toBe(systemId);

      // pre-existing name
      await AccessPolicy.create({
        name,
        collections: [{ collectionName: collection.name }],
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
        collections: [{ collectionName: collection.name }],
      });

      const headers = await getHeaders();
      const response = await request('DELETE', `/1/access-policies/${accessPolicy.id}`, {}, { headers });
      expect(response.status).toBe(204);
      const dbAccessPolicy = await AccessPolicy.findById(accessPolicy.id);
      expect(dbAccessPolicy).toBeNull();
    });
  });
});
