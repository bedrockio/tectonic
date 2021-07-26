const mongoose = require('mongoose');
const { createSchema } = require('../utils/schema');
const definition = require('./definitions/collection.json');

const schema = createSchema(definition.attributes);

schema.index({ name: 1, lastEntryAt: 1 });

module.exports = mongoose.models.Collection || mongoose.model('Collection', schema);
