const { AccessPolicy, Collection } = require('..');

describe('Access', () => {
  describe('serialization', () => {
    it('should expose id', () => {
      const policy = new AccessPolicy();
      const data = JSON.parse(JSON.stringify(policy));
      expect(data.id).toBe(policy.id);
    });

    it('should work with defaultQueries', async () => {
      const collection = new Collection();
      const defaultQuery = {
        userId: 'id42',
      };

      const policy = new AccessPolicy({
        name: 'access-policy-test',
        collections: {
          type: 'read',
          scopeString: JSON.stringify(defaultQuery),
          scopeFields: ['organizationId'],
          collectionId: collection.id,
          excludeFields: ['secret'],
        },
      });
      // console.info(policy);
      expect(policy.collections[0].collectionId.toString()).toBe(collection.id);
      expect(policy.collections[0].scopeString).toBe('{"userId":"id42"}');
      expect(policy.collections[0].scopeFields[0]).toBe('organizationId');
    });

    it('should rename collectionId', () => {
      const collection = new Collection();
      const defaultQuery = {
        userId: 'id42',
      };

      const policy = new AccessPolicy({
        name: 'access-policy-test',
        collections: {
          type: 'read',
          scopeString: JSON.stringify(defaultQuery),
          scopeFields: ['organizationId'],
          collectionId: collection.id,
          excludeFields: ['secret'],
        },
      });
      // console.info(policy);
      const policyJSON = policy.toCollectionJSON();

      expect(policyJSON.collections[0].collection.toString()).toStrictEqual(collection.id);
      expect(policy.collections[0].scopeString).toBe('{"userId":"id42"}');
      expect(policy.collections[0].scopeFields[0]).toBe('organizationId');
    });
  });
});
