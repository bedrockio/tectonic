const { Collection } = require('../../models');

function interpretAnalyticsError(ctx, error, searchQuery) {
  const { meta } = error;
  const indexNotFound = error.message.match(/index_not_found_exception/i);

  if (meta && meta.body && meta.body.error.reason) {
    let message = indexNotFound ? `Elasticsearch index not found` : `Elasticsearch error: ${meta.body.error.reason}`;
    if (!indexNotFound && meta.body.error.caused_by?.type && meta.body.error.caused_by?.reason) {
      message += `, caused by ${meta.body.error.caused_by.type}: ${meta.body.error.caused_by.reason}`;
    }
    const status = indexNotFound ? 404 : 400;
    ctx.type = 'json';
    ctx.status = status;
    ctx.body = {
      error: { message, status, searchQuery },
    };
  } else {
    throw error;
  }
}

function checkFieldInclusion(ctx, fieldName, fieldValue, includeFields = [], excludeFields = []) {
  if (includeFields.length && !includeFields.includes(fieldValue)) {
    ctx.throw(401, `${fieldName} '${fieldValue}' is not included`);
  }
  if (excludeFields.length && excludeFields.includes(fieldValue)) {
    ctx.throw(401, `${fieldName} '${fieldValue}' is excluded`);
  }
}

function checkFilterTermsInclusion(ctx, terms, includeFields, excludeFields) {
  if (terms && terms.length) {
    for (const term of terms) {
      for (const key of Object.keys(term)) {
        checkFieldInclusion(ctx, 'Filter term', key, includeFields, excludeFields);
      }
    }
  }
}

function validateScope(scope) {
  if (typeof scope != 'object') return false;
  for (const key in scope) {
    if (typeof key != 'string') return false;
    if (typeof scope[key] == 'object') return false;
  }
  return true;
}

function validateTerms(terms = []) {
  for (const term of terms) {
    if (typeof term != 'object') return false;
    for (const key in term) {
      if (typeof key != 'string') return false;
      if (typeof term[key] == 'object') return false;
    }
  }
  return true;
}

function checkTerms(ctx, terms) {
  if (!validateTerms(terms)) {
    ctx.throw(401, `terms should be array with objects of max 1 level deep and with string keys`);
  }
}

async function validateCollections(ctx, collections) {
  const updatedCollections = [];
  for (const col of collections) {
    const collection = await Collection.findByIdOrName(col.collection);
    if (!collection) ctx.throw(401, `collection '${col.collection}' does not exist`);
    col.collectionName = collection.name;
    delete col.collection;
    updatedCollections.push(col);
    if (col.scope) {
      if (!validateScope(col.scope)) {
        ctx.throw(401, `scope should be an object max 1 level deep and with string keys`);
      }
      col.scopeString = JSON.stringify(col.scope);
      delete col.scope;
    }
  }
  return updatedCollections;
}

function getMissingFields(accessPolicy, scopeValues) {
  const scopeFields = new Set();
  for (let collection of accessPolicy.collections) {
    for (let field of collection.scopeFields) {
      scopeFields.add(field);
    }
  }

  if (scopeFields.size == 0) return false;
  if (!scopeValues || scopeValues.length == 0) return Array.from(scopeFields);

  const scopeValuesFields = scopeValues.map(({ field }) => field);
  const missingFields = [];
  for (let field of scopeFields) {
    if (!scopeValuesFields.includes(field)) missingFields.push(field);
  }
  if (missingFields.length) return missingFields;
  return false;
}

function checkScopeValues(ctx, accessPolicy, scopeValues) {
  const missingFields = getMissingFields(accessPolicy, scopeValues);
  if (missingFields && missingFields.length) {
    ctx.throw(401, `scopeValues missing fields: '${missingFields.sort().join(',')}'`);
  }
}

module.exports = {
  interpretAnalyticsError,
  checkFieldInclusion,
  checkFilterTermsInclusion,
  validateCollections,
  checkScopeValues,
  checkTerms,
};
