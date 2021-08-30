const mongoose = require('mongoose');
const { createSchema } = require('../utils/schema');
const definition = require('./definitions/accessPolicy.json');

const schema = createSchema(definition.attributes);

schema.methods.toCollectionJSON = function toCollectionJSON() {
  const accessPolicy = this.toJSON();
  const collections = [];

  for (const col of accessPolicy.collections) {
    col.collection = col.collectionName;
    delete col.collectionName;
    if (col.scopeString) {
      col.scope = JSON.parse(col.scopeString);
      delete col.scopeString;
    }
    collections.push(col);
  }
  accessPolicy.collections = collections;
  return accessPolicy;
};

module.exports = mongoose.models.AccessPolicy || mongoose.model('AccessPolicy', schema);
