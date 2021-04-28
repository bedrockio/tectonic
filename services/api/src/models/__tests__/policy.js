const { Policy, Collection } = require('..');

describe('Access', () => {
  describe('serialization', () => {
    it('should expose id', () => {
      const policy = new Policy();
      const data = JSON.parse(JSON.stringify(policy));
      expect(data.id).toBe(policy.id);
    });

    it('should work with defaultQueries', () => {
      const collection = new Collection();
      const defaultQuery = {
        userId: 'id42',
      };

      const policy = new Policy({
        collections: {
          type: 'read',
          scope: defaultQuery,
          collectionId: collection.id,
          fields: {
            type: 'blacklist',
            exclude: 'secret',
          },
        },
      });
      // console.info(policy);

      expect(policy.collections[0].collectionId.toString()).toBe(collection.id);
      expect(policy.collections[0].scope.userId).toBe('id42');
    });
  });
});
