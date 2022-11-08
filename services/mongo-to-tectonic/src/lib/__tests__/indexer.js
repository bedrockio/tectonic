const { connect, disconnect } = require('./../mongodb');
const { indexMongodbCollection, sanitizeDocuments, readCursor } = require('./../indexer');

let db;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

jest.setTimeout(300 * 1000);

beforeAll(async () => {
  db = await connect({ database: 'bedrock_test' });
});

afterAll(async () => {
  db = await disconnect();
});

function createObject() {
  return {
    price: 50.0,
    currency: 'USD',
    variations: [
      { size: 'L', quantity: 100 },
      { size: 'M', quantity: 10 },
    ],
    isPublic: true,
    description: 'Lorem ipsum longo texto',
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 1,
  };
}

describe('indexer', () => {
  // Add as integration test
  it.skip('should index data from MongoDB', async () => {
    const collection = db.collection('products');
    await collection.deleteMany({});
    const objects = [];
    for (let i = 0; 500 > i; i++) {
      objects.push(createObject());
    }
    await collection.insertMany(objects);
    // await deleteMongodbCollectionIndex(db, 'products');
    const { numIndexed, total } = await indexMongodbCollection(db, 'products');
    // await refreshMongodbCollectionIndex(db, 'products');
    expect(numIndexed).toBe(objects.length);
    expect(total).toBe(objects.length);
    await collection.insertMany([createObject(), createObject()]);
    const { numIndexed: numIndexed2, total: total2 } = await indexMongodbCollection(db, 'products');
    expect(numIndexed2).toBe(2);
    expect(total2).toBe(2);
  });
  it('should sanitize documents', () => {
    const docs = [{ email: 'test@test.com', name: '123' }];
    expect(sanitizeDocuments('users', docs, ['users.email'])).toEqual([
      {
        name: '123',
      },
    ]);
  });
  it.skip('should cursor find lots of documents', async () => {
    const collection = db.collection('products2');
    await collection.deleteMany({});
    for (item of Array(201)) {
      let objects = [];
      for (let i = 0; 500 > i; i++) {
        objects.push(createObject());
      }
      await collection.insertMany(objects);
    }
    const batchSize = 1000;
    //.noCursorTimeout() // Not available
    const cursor = collection.find({}, { timeout: false }).sort([
      ['updatedAt', -1],
      ['_id', 1],
    ]);
    const total = await collection.countDocuments();
    const numBatches = Math.ceil(total / batchSize);
    const batches = new Array(numBatches);
    console.log(`Collecting total ${total} with batchSize ${batchSize}`);
    let read = 0;
    for (const batch of batches) {
      const result = await readCursor(cursor, batchSize);
      if (result.length) {
        read += result.length;
      }
      if (read == 50000) {
        console.log('50k done...');
      }
      await sleep(1000);
    }
    expect(read).toBe(100500);
  });
});
