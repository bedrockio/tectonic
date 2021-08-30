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
  await AccessCredential.deleteMany({});
  await ApplicationCredential.deleteMany({});
});

async function getHeaders() {
  const applicationCredential = await ApplicationCredential.create({ name: `${uniqueId('application-credential')}` });
  return { Authorization: `Bearer ${createCredentialToken(applicationCredential)}` };
}

describe('/1/access-credentials', () => {
  describe('POST /', () => {
    it('should be able to create access-credential', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name }],
      });

      const name = 'access-credential-test';
      const scopeValues = [];
      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-credentials',
        { name, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      const data = response.body.data;
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(data.name).toBe(name);
      expect(data.accessPolicy).toBe(accessPolicy.name);
    });

    it('should not be able to create access-credential with existing name', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name }],
      });

      const name = 'access-credential-test';
      const scopeValues = [];
      await AccessCredential.create({ name, accessPolicy });

      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-credentials',
        { name, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      // if (response.error) console.error(response.error);
      expect(response.status).toBe(401);
    });
  });

  describe('POST / with scopes', () => {
    it('should be able to create access-credential with scope', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name, scopeFields: ['userId'] }],
      });

      const name = 'access-credential-test';
      const scopeValues = [{ field: 'userId', value: '123' }];
      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-credentials',
        { name, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      const data = response.body.data;
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(data.name).toBe(name);
      expect(data.accessPolicy).toBe(accessPolicy.name);
      expect(data.scopeValues).toStrictEqual(scopeValues);
      // PUT should be the same as POST
      const responsePUT = await request(
        'PUT',
        '/1/access-credentials',
        { name, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      expect(responsePUT.status).toBe(200);
    });

    it('should not be able to create access-credential with incorrect scopeValues', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name, scopeFields: ['userId'] }],
      });

      const name = 'access-credential-test';
      const scopeValues = [{ userId: '123' }];
      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-credentials',
        { name, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      expect(response.status).toBe(400);
      expect(getParsedErrorMessage(response)).toBe(
        '"scopeValues[0].field" is required\n"scopeValues[0].value" is required\n"scopeValues[0].userId" is not allowed'
      );
      // PUT should be the same as POST
      const responsePUT = await request(
        'PUT',
        '/1/access-credentials',
        { name, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      expect(responsePUT.status).toBe(400);
      expect(getParsedErrorMessage(responsePUT)).toBe(
        '"scopeValues[0].field" is required\n"scopeValues[0].value" is required\n"scopeValues[0].userId" is not allowed'
      );
    });

    it('should not be able to create access-credential with missing field in scopeValues', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name, scopeFields: ['organizationId', 'credentialId'] }],
      });

      const name = 'access-credential-test';
      const scopeValues = [{ field: 'userId', value: '123' }];
      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-credentials',
        { name, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      expect(response.status).toBe(401);
      expect(getParsedErrorMessage(response)).toBe("scopeValues missing fields: 'organizationId, credentialId'");
      // PUT should be the same as POST
      const responsePUT = await request(
        'PUT',
        '/1/access-credentials',
        { name, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      expect(responsePUT.status).toBe(401);
      expect(getParsedErrorMessage(responsePUT)).toBe("scopeValues missing fields: 'organizationId, credentialId'");
    });
  });

  describe('PUT /', () => {
    it('should be able to create access-credential with existing name on put', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name }],
      });

      const name = 'access-credential-test';
      const scopeValues = [];
      await AccessCredential.create({ name, accessPolicy });

      const headers = await getHeaders();
      // pre-existing name:
      const response = await request(
        'PUT',
        '/1/access-credentials',
        { name, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(response.error).toBe(false);

      // No pre-existing name:
      const name2 = name + '2';
      const response2 = await request(
        'PUT',
        '/1/access-credentials',
        { name: name2, accessPolicy: accessPolicy.id, scopeValues },
        { headers }
      );
      expect(response2.error).toBe(false);
      expect(response2.status).toBe(200);
      expect(response2.body.data.name).toBe(name2);
    });
  });

  describe('GET /:accessCredential', () => {
    it('should be able to get access credential', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name }],
      });

      const name = 'access-credential-test';
      const accessCredential = await AccessCredential.create({ name, accessPolicy });

      const headers = await getHeaders();
      const response = await request('GET', `/1/access-credentials/${accessCredential.id}`, {}, { headers });
      const data = response.body.data;
      expect(response.status).toBe(200);
      expect(data.name).toBe(accessCredential.name);
      expect(data.accessPolicy.id).toBe(accessPolicy.id);
    });
  });

  describe('POST /search', () => {
    it('should list out access credentials', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name }],
      });

      const name = 'access-credential-test';
      const accessCredential1 = await AccessCredential.create({ name: name + '-1', accessPolicy });
      const accessCredential2 = await AccessCredential.create({ name: name + '-2', accessPolicy });

      const headers = await getHeaders();
      const response = await request(
        'POST',
        '/1/access-credentials/search',
        { sort: { field: 'name', order: 'desc' } },
        { headers }
      );

      expect(response.status).toBe(200);
      const data = response.body.data;
      expect(data[1].name).toBe(accessCredential1.name);
      expect(data[0].name).toBe(accessCredential2.name);
      expect(response.body.meta.total).toBe(2);
    });
  });

  describe('PATCH /:credential', () => {
    it('admins should be able to update access credential', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name }],
      });
      const accessPolicy2 = await AccessPolicy.create({
        name: 'access-policy-test-2',
        collections: [{ collectionName: collection.name }],
      });

      const name = 'access-credential-test';
      const accessCredential = await AccessCredential.create({ name, accessPolicy });
      const headers = await getHeaders();
      const response = await request(
        'PATCH',
        `/1/access-credentials/${accessCredential.id}`,
        { accessPolicy: accessPolicy2.id, name: 'new name' },
        { headers }
      );
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(response.body.data.accessPolicy).toBe(accessPolicy2.name);

      // pre-existing name
      await AccessCredential.create({ name, accessPolicy });
      const response2 = await request(
        'PATCH',
        `/1/access-credentials/${accessCredential.id}`,
        { accessPolicy: accessPolicy2.id, name },
        { headers }
      );
      expect(response2.status).toBe(401);
    });
  });

  describe('DELETE /:credential', () => {
    it('should be able to delete access credential', async () => {
      const collection = await Collection.create({ name: 'collection-test' });
      const accessPolicy = await AccessPolicy.create({
        name: 'access-policy-test',
        collections: [{ collectionName: collection.name }],
      });

      const name = 'access-credential-test';
      const accessCredential = await AccessCredential.create({ name, accessPolicy });

      const headers = await getHeaders();
      const response = await request('DELETE', `/1/access-credentials/${accessCredential.id}`, {}, { headers });
      expect(response.status).toBe(204);
      const dbAccessCredential = await AccessCredential.findById(accessCredential.id);
      expect(dbAccessCredential).toBeNull();
    });
  });
});
