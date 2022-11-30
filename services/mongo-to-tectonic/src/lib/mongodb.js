const config = require('@bedrockio/config');
const { MongoClient } = require('mongodb');
const { logger } = require('@bedrockio/instrumentation');
const MONGO_URI = config.get('MONGO_URI');

let client;

const flags = {
  // The underlying MongoDB driver has deprecated their current connection string parser.
  useNewUrlParser: true,
  // To opt in to using the MongoDB driver's new connection management engine.
  // https://mongoosejs.com/docs/deprecations.html#useunifiedtopology
  useUnifiedTopology: true,
};
exports.flags = flags;

async function connect(options = {}) {
  client = new MongoClient(MONGO_URI, flags);
  return new Promise((accept, reject) => {
    client.connect(function (err) {
      if (err) return reject(err);
      if (process.env.NODE_ENV !== 'test') logger.info(`Connected successfully to MongoDB server: ${MONGO_URI}`);
      const db = client.db(options.database);
      accept(db);
    });
  });
}

async function disconnect() {
  client.close();
}

module.exports = {
  connect,
  disconnect,
};
