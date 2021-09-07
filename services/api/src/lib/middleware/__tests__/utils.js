const { Collection } = require('../../../models');
const { setupDb, teardownDb, context } = require('../../../utils/testing');
const { checkFieldInclusion, checkFilterTermsInclusion, validateCollections, checkScopeValues } = require('../utils');

describe('checkfieldInclusion', () => {
  it('should trigger an error if the field is not whitelisted or excluded', async () => {
    expect.assertions(5);
    let ctx = context();
    await expect(async () => {
      checkFieldInclusion(ctx, 'aggField', 'event.nope', ['event.id']);
    }).rejects.toHaveProperty('message', "aggField 'event.nope' is not included");
    await expect(async () => {
      checkFieldInclusion(ctx, 'aggField', 'event.nope', [], ['event.nope']);
    }).rejects.toHaveProperty('message', "aggField 'event.nope' is excluded");
    await expect(async () => {
      checkFieldInclusion(ctx, 'aggField', 'event.nope', ['event.nope'], ['event.nope']);
    }).rejects.toHaveProperty('message', "aggField 'event.nope' is excluded");
    await expect(async () => {
      checkFieldInclusion(ctx, 'aggField', 'event.nope', [], ['event']);
    }).rejects.toHaveProperty('message', "aggField 'event.nope' is excluded");
    await expect(checkFieldInclusion(ctx, 'aggField', 'event.nope', ['event'], [])).toBe(true);
  });
});

describe('checkfilterTermsInclusion', () => {
  it('should trigger an error if one of the filter terms is not whitelisted or excluded', async () => {
    expect.assertions(5);
    let ctx = context();
    const terms = [{ 'event.nope': 'something' }];
    await expect(async () => {
      checkFilterTermsInclusion(ctx, terms, ['event.id']);
    }).rejects.toHaveProperty('message', "Filter term 'event.nope' is not included");
    await expect(async () => {
      checkFilterTermsInclusion(ctx, terms, [], ['event.nope']);
    }).rejects.toHaveProperty('message', "Filter term 'event.nope' is excluded");
    await expect(async () => {
      checkFilterTermsInclusion(ctx, terms, ['event.nope'], ['event.nope']);
    }).rejects.toHaveProperty('message', "Filter term 'event.nope' is excluded");
    await expect(async () => {
      checkFilterTermsInclusion(ctx, terms, [], ['event']);
    }).rejects.toHaveProperty('message', "Filter term 'event.nope' is excluded");
    await expect(checkFilterTermsInclusion(ctx, terms, ['event'], [])).toBe(true);
  });
});

describe('validateCollections', () => {
  beforeAll(async () => {
    await setupDb();
  });

  afterAll(async () => {
    await teardownDb();
  });

  it('should return validated collection', async () => {
    await Collection.deleteMany({});
    await Collection.create({ name: 'test' });
    let ctx = context();
    const collections = [{ collection: 'test', scope: {} }];
    const validatedCollections = await validateCollections(ctx, collections);
    expect(validatedCollections).toEqual([{ collectionName: 'test', scopeString: '{}' }]);
  });

  it('should trigger an error if one of the collections does not exist', async () => {
    expect.assertions(1);
    let ctx = context();
    const collections = [{ collection: 'nope', scope: {} }];
    await expect(async () => {
      await validateCollections(ctx, collections);
    }).rejects.toHaveProperty('message', "collection 'nope' does not exist");
  });

  it('should trigger an error if scope is too deep', async () => {
    expect.assertions(1);
    await Collection.deleteMany({});
    await Collection.create({ name: 'test' });
    let ctx = context();
    const collections = [{ collection: 'test', scope: { a: { b: { c: 1 } } } }];
    await expect(async () => {
      await validateCollections(ctx, collections);
    }).rejects.toHaveProperty('message', 'scope should be an object max 1 level deep and with string keys');
  });
});

describe('checkScopeValues', () => {
  const accessPolicy = {
    collections: [
      {
        collectionName: 'test-1',
        scopeFields: ['userId'],
      },
      {
        collectionName: 'test-2',
        scopeFields: ['userId'],
      },
      {
        collectionName: 'test-3',
        scopeFields: ['organizationId'],
      },
    ],
  };
  it('should trigger an error if scopeValues are missing', async () => {
    expect.assertions(2);
    let ctx = context();

    const scopeValues = [{ field: 'organizationId', value: '123' }];
    await expect(async () => {
      checkScopeValues(ctx, accessPolicy, scopeValues);
    }).rejects.toHaveProperty('message', "scopeValues missing fields: 'userId'");
    await expect(async () => {
      checkScopeValues(ctx, accessPolicy, []);
    }).rejects.toHaveProperty('message', "scopeValues missing fields: 'organizationId,userId'");
  });
});
