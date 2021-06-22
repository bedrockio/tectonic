const { loadModelDir } = require('../utils/schema');

module.exports = {
  User: require('./user'),
  AccessPolicy: require('./accessPolicy'),
  ...loadModelDir(__dirname + '/definitions'),
};
