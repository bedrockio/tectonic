const config = require('@bedrockio/config');
const { MongoClient } = require('mongodb');
const { logger } = require('@bedrockio/instrumentation');
const MONGGO_URI = config.get('MONGO_URI');;

let client;

const flags = {
  // The underlying MongoDB driver has deprecated their current connection string parser.
  useNewUrlParser: true,
  // Make Mongoose's default index build use createIndex() instead of ensureIndex()
  // to avoid deprecation warnings from the MongoDB driver
  useCreateIndex: true,
  // To opt in to using the MongoDB driver's new connection management engine.
  // https://mongoosejs.com/docs/deprecations.html#useunifiedtopology
  useUnifiedTopology: true,
  // Set to false to make findOneAndUpdate() and findOneAndRemove()
  // use native findOneAndUpdate() rather than findAndModify()
  useFindAndModify: false,
};
exports.flags = flags;

async function connect(options = {}) {
  client = new MongoClient(MONGGO_URI, flags);
  return new Promise((accept, reject) => {
    client.connect(function (err) {
      if (err) return reject(err);
      logger.info(`Connected successfully to MongoDB server: ${url}`);
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
