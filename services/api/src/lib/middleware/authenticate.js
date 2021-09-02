const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { secrets } = require('./../secrets');

function getToken(ctx) {
  let token;
  const parts = (ctx.request.get('authorization') || '').split(' ');
  if (parts.length === 2) {
    const [scheme, credentials] = parts;
    if (/^Bearer$/i.test(scheme)) token = credentials;
  }
  return token;
}

function validateToken(ctx, token) {
  // ignoring signature for the moment
  const decoded = jwt.decode(token, { complete: true });
  if (decoded === null) return ctx.throw(401, 'bad jwt token');
  const { payload } = decoded;

  const { type } = payload;
  const secret = secrets[type];
  if (!secret) {
    ctx.throw(401, `jwt token of type '${type}' is not supported`);
  }

  // confirming signature
  try {
    jwt.verify(token, secret); // verify will throw
  } catch (e) {
    ctx.throw(401, e);
  }

  return payload;
}

function authenticate({ optional = false, types } = {}) {
  return async (ctx, next) => {
    if (!ctx.state.jwt) {
      const token = getToken(ctx);
      if (token) {
        ctx.state.jwt = validateToken(ctx, token);
        const type = ctx.state.jwt.type;
        if (types && !types.includes(type)) {
          ctx.throw(401, `jwt token type '${type}' is not allowed`);
        }
      } else if (!optional) {
        ctx.throw(401, 'no jwt token found in request');
      }
    }
    return next();
  };
}

async function fetchUser(ctx, next) {
  if (!ctx.state.authUser && ctx.state.jwt) {
    const { User } = mongoose.models;
    if (ctx.state.jwt.type !== 'user') ctx.throw(401, 'Correct type is missing in associated token');
    if (!ctx.state.jwt.userId) ctx.throw(401, 'userId is missing in associated token');
    ctx.state.authUser = await User.findById(ctx.state.jwt.userId);
    if (!ctx.state.authUser) ctx.throw(401, 'user associated to token could not not be found');
  }
  await next();
}

async function fetchApplicationCredential(ctx, next) {
  if (!ctx.state.authApplicationCredential && ctx.state.jwt) {
    const { ApplicationCredential } = mongoose.models;
    if (ctx.state.jwt.type !== 'application') ctx.throw(401, 'Correct type is missing in associated token');
    if (!ctx.state.jwt.credentialId) ctx.throw(401, 'credentialId is missing in associated token');
    ctx.state.authApplicationCredential = await ApplicationCredential.findById(ctx.state.jwt.credentialId);
    if (!ctx.state.authApplicationCredential)
      ctx.throw(401, 'applicationCredential associated to token could not not be found');
  }
  await next();
}

async function fetchAccessCredential(ctx, next) {
  if (!ctx.state.authAccessCredential && ctx.state.jwt) {
    const { AccessCredential } = mongoose.models;
    if (ctx.state.jwt.type !== 'access') ctx.throw(401, 'Correct type is missing in associated token');
    if (!ctx.state.jwt.credentialId) ctx.throw(401, 'credentialId is missing in associated token');
    ctx.state.authAccessCredential = await AccessCredential.findById(ctx.state.jwt.credentialId);
    if (!ctx.state.authAccessCredential) ctx.throw(401, 'accessCredential associated to token could not not be found');
  }
  await next();
}

async function fetchCredential(ctx, next) {
  const type = ctx.state.jwt && ctx.state.jwt.type;

  if (type == 'user') return fetchUser(ctx, next);
  if (type == 'application') return fetchApplicationCredential(ctx, next);
  if (type == 'access') return fetchAccessCredential(ctx, next);

  ctx.throw(401, 'Correct type is missing in associated token');
}

async function fetchCollection(ctx, next) {
  const { collection } = ctx.request.body;
  if (!collection || typeof collection !== 'string') {
    ctx.throw(401, `Collection body string paramater is missing`);
  }
  let dbCollection;
  try {
    const { Collection } = mongoose.models;
    dbCollection = await Collection.findByIdOrName(collection);
  } catch (e) {
    console.error(e);
    ctx.throw(401, `Collection ${collection} not valid`);
  }
  if (!dbCollection) {
    ctx.throw(401, `Collection '${collection}' could not be found`);
  }
  ctx.state.collection = dbCollection;
  return next();
}

async function fetchAccessPolicyCollection(ctx, next) {
  const collection = ctx.state.collection;
  if (!collection) {
    ctx.throw(401, `Collection state not fetched`);
  }

  const collectionId = collection.id;
  const collectionName = collection.name;

  // Give admin user and application credential full access
  if (ctx.state.authUser || ctx.state.authApplicationCredential) {
    ctx.state.accessPolicyCollection = {
      collectionId,
    };
    return next();
  }

  // Check Access credential
  const { accessPolicy, scopeValues } = ctx.state.authAccessCredential;
  if (!accessPolicy || !accessPolicy.collections || !Array.isArray(accessPolicy.collections)) {
    ctx.throw(401, `AccessCredential is missing valid accessPolicy`);
  }
  const accessPolicyCollection = accessPolicy.collections.find(({ collectionName: cname }) => collectionName == cname);
  if (!accessPolicyCollection) {
    ctx.throw(401, `AccessPolicy has no access to collection: ${collectionName} (${collectionId})`);
  }
  if (accessPolicyCollection.scopeString) {
    accessPolicyCollection.scope = JSON.parse(accessPolicyCollection.scopeString);
  }

  // Add collectionId field, because only colletionName is stored in the AccessPolicy model collections
  accessPolicyCollection.collectionId = collectionId;

  // check scopeFields
  if (accessPolicyCollection.scopeFields && accessPolicyCollection.scopeFields.length != 0) {
    if (!scopeValues || !scopeValues.length) {
      ctx.throw(401, `Missing scopeValues on access credential`);
    }
    for (const scopeField of accessPolicyCollection.scopeFields) {
      const scopeValue = scopeValues.find(({ field }) => scopeField == field);
      if (!scopeValue || !scopeValue.value) {
        ctx.throw(401, `Missing scopeValues for field '${scopeField}'`);
      }

      // Add to scope
      if (!accessPolicyCollection.scope) accessPolicyCollection.scope = {};
      accessPolicyCollection.scope[scopeField] = scopeValue.value;
    }
  }

  ctx.state.accessPolicyCollection = accessPolicyCollection;
  return next();
}

async function checkCollectionWriteAccess(ctx, next) {
  const collection = ctx.state.collection;
  if (!collection) {
    ctx.throw(401, `Collection ${collection} state not fetched`);
  }

  const collectionId = collection.id;
  const collectionName = collection.name;

  // Give admin user and application credential full access
  if (ctx.state.authUser || ctx.state.authApplicationCredential) {
    return next();
  }

  // Check Access credential
  const { accessPolicy } = ctx.state.authAccessCredential;
  if (!accessPolicy || !accessPolicy.collections || !Array.isArray(accessPolicy.collections)) {
    ctx.throw(401, `AccessCredential is missing valid accessPolicy`);
  }
  const accessPolicyCollection = accessPolicy.collections.find(({ collectionName: cname }) => collectionName == cname);
  if (!accessPolicyCollection) {
    ctx.throw(401, `AccessPolicy has no access to collection: ${collectionName} (${collectionId})`);
  }
  if (accessPolicyCollection.permission != 'read-write') {
    ctx.throw(401, `AccessPolicy has no read-write permission to collection: ${collectionName} (${collectionId})`);
  }
  return next();
}

module.exports = {
  authenticate,
  fetchUser,
  fetchCredential,
  fetchAccessPolicyCollection,
  fetchCollection,
  checkCollectionWriteAccess,
};
