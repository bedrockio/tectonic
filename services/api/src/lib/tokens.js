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

function createUserToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      type: 'user',
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
    },
    secrets.user,
    {
      expiresIn: expiresIn.lasting,
    }
  );
}

module.exports = {
  createUserToken,
  createPolicyToken,
  createUserLastingToken,
};
