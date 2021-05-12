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

function authenticate({ optional = false } = {}) {
  return async (ctx, next) => {
    if (!ctx.state.jwt) {
      const token = getToken(ctx);
      if (token) {
        ctx.state.jwt = validateToken(ctx, token);
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
    if (!ctx.state.jwt.userId) ctx.throw(401, 'userId is missing in associated token');
    ctx.state.authUser = await User.findById(ctx.state.jwt.userId);
    if (!ctx.state.authUser) ctx.throw(401, 'user associated to token could not not be found');
  }
  await next();
}

async function fetchPolicy(ctx, next) {
  if (!ctx.state.authPolicy && ctx.state.jwt) {
    const { AccessPolicy } = mongoose.models;
    if (!ctx.state.jwt.policyId) ctx.throw(401, 'policyId is missing in associated token');
    ctx.state.authPolicy = await AccessPolicy.findById(ctx.state.jwt.policyId);
    if (!ctx.state.authPolicy) ctx.throw(401, 'policy associated to token could not not be found');
  }
  await next();
}

module.exports = {
  authenticate,
  fetchUser,
  fetchPolicy,
};
