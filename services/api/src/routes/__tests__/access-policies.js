const { setupDb, teardownDb, request } = require('../../utils/testing');
const { ApplicationCredential, Collection } = require('../../models');
// const { ensureCollectionIndex, getCollectionIndex, deleteIndex } = require('../../lib/analytics');
const { createCredentialToken } = require('../../lib/tokens');

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

describe('/1/access-policies', () => {
  describe('POST /', () => {
    it('should be able to create access-policy', async () => {
      const collection = await Collection.create({
        name: 'access-policy-collection-test',
      });
      const systemId = '5fd6036fccd06f4d6b1d8bd2';
      const applicationCredential = await ApplicationCredential.create({
        name: 'application-cred-test',
      });
      const headers = { Authorization: `Bearer ${createCredentialToken(applicationCredential)}` };
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
      expect(data.collections[0].collectionId).toBe(collection.id);
    });
  });
});
