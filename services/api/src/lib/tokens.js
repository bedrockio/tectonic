const jwt = require('jsonwebtoken');
const { secrets } = require('./secrets');

const expiresIn = {
  temporary: '1d',
  regular: '30d',
  invite: '1d',
  lasting: '1y',
  policy: '1w',
};

function createUserToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      type: 'user',
    },
    secrets.user,
    { expiresIn: expiresIn.regular }
  );
}

function createPolicyToken(policy) {
  return jwt.sign(
    {
      policyId: policy._id,
      type: 'policy',
    },
    secrets.policy,
    { expiresIn: expiresIn.policy }
  );
}

function createUserLastingToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      type: 'user',
    },
    secrets.user,
    { expiresIn: expiresIn.lasting }
  );
}

module.exports = {
  createUserToken,
  createPolicyToken,
  createUserLastingToken,
};
