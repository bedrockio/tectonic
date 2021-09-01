const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { startCase, omitBy } = require('lodash');

const { getValidatorForDefinition } = require('./validator');
const { logger } = require('@bedrockio/instrumentation');

const RESERVED_FIELDS = ['id', 'createdAt', 'updatedAt', 'deletedAt'];

const serializeOptions = {
  getters: true,
  versionKey: false,
  transform: (doc, ret, options) => {
    transformField(ret, doc.schema.obj, options);
  },
};

function transformField(obj, schema, options) {
  if (Array.isArray(obj)) {
    for (let el of obj) {
      transformField(el, schema[0], options);
    }
  } else if (obj && typeof obj === 'object') {
    for (let [key, val] of Object.entries(obj)) {
      // Omit any key with a private prefix "_" or marked
      // "access": "private" in the schema.
      if (key[0] === '_' || isDisallowedField(schema[key], options.private)) {
        delete obj[key];
      } else if (schema[key]) {
        transformField(val, schema[key], options);
      }
    }
  }
}

function createSchema(definition, options = {}) {
  const schema = new mongoose.Schema(
    {
      deletedAt: { type: Date },
      ...definition,
    },
    {
      // Include timestamps by default.
      timestamps: true,

      // Export "id" virtual and omit "__v" as well as private fields.
      toJSON: serializeOptions,
      toObject: serializeOptions,

      ...options,
    }
  );

  schema.static('getValidator', function getValidator() {
    return getValidatorForDefinition(definition, {
      disallowField: (key) => {
        return isDisallowedField(this.schema.obj[key]);
      },
    });
  });

  schema.static('getPatchValidator', function getPatchValidator() {
    return getValidatorForDefinition(definition, {
      disallowField: (key) => {
        return isDisallowedField(this.schema.obj[key]);
      },
      stripFields: RESERVED_FIELDS,
      skipRequired: true,
    });
  });

  schema.methods.assign = function assign(fields) {
    fields = omitBy(fields, (value, key) => {
      return isDisallowedField(this.schema.obj[key]) || RESERVED_FIELDS.includes(key);
    });
    for (let [key, value] of Object.entries(fields)) {
      if (!value && isReferenceField(this.schema.obj[key])) {
        value = undefined;
      }
      this[key] = value;
    }
  };

  schema.method('delete', function () {
    this.deletedAt = new Date();
    return this.save();
  });

  schema.method('restore', function restore() {
    this.deletedAt = undefined;
    return this.save();
  });

  schema.method('destroy', function destroy() {
    return this.remove();
  });

  schema.static('findDeleted', function findOneDeleted(filter) {
    return this.find({
      ...filter,
      deletedAt: { $exists: true },
    });
  });

  schema.static('findOneDeleted', function findOneDeleted(filter) {
    return this.findOne({
      ...filter,
      deletedAt: { $exists: true },
    });
  });

  schema.static('findByIdDeleted', function findByIdDeleted(id) {
    return this.findOne({
      _id: id,
      deletedAt: { $exists: true },
    });
  });

  schema.static('existsDeleted', function existsDeleted() {
    return this.exists({
      deletedAt: { $exists: true },
    });
  });

  schema.static('countDocumentsDeleted', function countDocumentsDeleted(filter) {
    return this.countDocuments({
      ...filter,
      deletedAt: { $exists: true },
    });
  });

  schema.static('findWithDeleted', function findOneWithDeleted(filter) {
    return this.find({
      ...filter,
      deletedAt: undefined,
    });
  });

  schema.static('findOneWithDeleted', function findOneWithDeleted(filter) {
    return this.findOne({
      ...filter,
      deletedAt: undefined,
    });
  });

  schema.static('findByIdWithDeleted', function findByIdWithDeleted(id) {
    return this.findOne({
      _id: id,
      deletedAt: undefined,
    });
  });

  schema.static('existsWithDeleted', function existsWithDeleted() {
    return this.exists({
      deletedAt: undefined,
    });
  });

  schema.static('countDocumentsWithDeleted', function countDocumentsWithDeleted(filter) {
    return this.countDocuments({
      ...filter,
      deletedAt: undefined,
    });
  });

  schema.static('findByIdOrName', function (objectId) {
    if (isObjectIdValid(objectId)) {
      return this.findById(objectId);
    } else {
      return this.findOne({ name: objectId });
    }
  });

  return schema;
}

function isObjectIdValid(id) {
  return mongoose.isValidObjectId(id) && id.match(/^[a-fA-F0-9]{24}$/) ? true : false;
}

function isReferenceField(schema) {
  return resolveSchema(schema)?.type === mongoose.Schema.Types.ObjectId;
}

function isDisallowedField(schema, allowPrivate = false) {
  if (resolveSchema(schema)?.access === 'private') {
    return !allowPrivate;
  }
  return false;
}

function resolveSchema(schema) {
  return Array.isArray(schema) ? schema[0] : schema;
}

function loadModel(definition, name) {
  const { attributes } = definition;
  if (!attributes) {
    throw new Error(`Invalid model definition for ${name}, need attributes`);
  }
  const schema = createSchema(attributes);
  schema.plugin(require('mongoose-autopopulate'));
  return mongoose.model(name, schema);
}

function loadModelDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const basename = path.basename(file, '.json');
    if (file.match(/\.json$/)) {
      const filePath = path.join(dirPath, file);
      const data = fs.readFileSync(filePath);
      try {
        const definition = JSON.parse(data);
        const modelName = definition.modelName || startCase(basename).replace(/\s/g, '');
        if (!mongoose.models[modelName]) {
          loadModel(definition, modelName);
        }
      } catch (error) {
        logger.error(`Could not load model definition: ${filePath}`);
        logger.error(error);
      }
    }
  }
  return mongoose.models;
}

module.exports = {
  createSchema,
  loadModel,
  loadModelDir,
  isObjectIdValid,
};
