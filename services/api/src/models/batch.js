const mongoose = require('mongoose');
const { createSchema } = require('../utils/schema');
const definition = require('./definitions/batch.json');

const schema = createSchema(definition.attributes);

schema.index({ collectionId: 1, ingestedAt: -1 });

module.exports = mongoose.models.Batch || mongoose.model('Batch', schema);
