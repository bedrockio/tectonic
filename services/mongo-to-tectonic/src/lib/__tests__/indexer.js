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
  it('should sanitize documents', () => {
    const docs = [{ email: 'test@test.com', name: '123' }];
    expect(sanitizeDocuments('users', docs, ['users.email'])).toEqual([
      {
        name: '123',
      },
    ]);
  });
  it('should cursor find lots of documents', async () => {
    const collection = db.collection('products2');
    await collection.deleteMany({});
    const arraySize = Math.floor(Math.random() * 100) + 100;
    const loops = Math.floor(Math.random() * 400) + 100;
    const itemCount = arraySize * loops;
    for (item of Array(arraySize)) {
      let objects = [];
      for (let i = 0; loops > i; i++) {
        objects.push(createObject());
      }
      await collection.insertMany(objects);
    }
    const batchSize = 1000;
    const cursor = collection.find({}, { timeout: false }).sort([
      ['updatedAt', -1],
      ['_id', 1],
    ]);
    const total = await collection.countDocuments();
    const numBatches = Math.ceil(total / batchSize);
    const batches = new Array(numBatches);
    console.log(`Collecting total ${total} with batchSize ${batchSize}: ${numBatches} batches`);
    let read = 0;
    for (const batch of batches) {
      const result = await readCursor(cursor, batchSize);
      if (result.length) {
        read += result.length;
      }
      await sleep(Math.floor(Math.random() * 100));
    }
    await cursor.close();
    expect(read).toBe(itemCount);
  });
});

describe.skip('indexer integration', () => {
  // Add as integration test
  it('should index data from MongoDB', async () => {
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
});
