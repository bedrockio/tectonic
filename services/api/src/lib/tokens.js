const jwt = require('jsonwebtoken');
const config = require('@bedrockio/config');

const expiresIn = {
  temporary: '1d',
  regular: '30d',
  invite: '1d',
  lasting: '1y',
  policy: '1w',
};

const secrets = {
  user: config.get('JWT_SECRET'),
  policy: config.get('POLICY_JWT_SECRET'),
};

function createUserTemporaryToken(claims, type) {
  return jwt.sign(
    {
      ...claims,
      type,
      kid: 'user',
    },
    secrets.user,
    {
      expiresIn: expiresIn.temporary,
    }
  );
}

function createUserToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      type: 'user',
      kid: 'user',
    },
    secrets.user,
    {
      expiresIn: expiresIn.regular,
    }
  );
}

function createPolicyToken(policy) {
  return jwt.sign(
    {
      policyId: policy._id,
      type: 'policy',
      kid: 'policy',
    },
    secrets.policy,
    {
      expiresIn: expiresIn.policy,
    }
  );
}

function createUserLastingToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      type: 'user',
      kid: 'user',
    },
    secrets.user,
    {
      expiresIn: expiresIn.lasting,
    }
  );
}

module.exports = {
  createUserTemporaryToken,
  createUserToken,
  createPolicyToken,
  createUserLastingToken,
};
