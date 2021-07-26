const { loadModelDir } = require('../utils/schema');

module.exports = {
  AccessPolicy: require('./accessPolicy'),
  Batch: require('./batch'),
  Collection: require('./collection'),
  User: require('./user'),
  ...loadModelDir(__dirname + '/definitions'),
};
