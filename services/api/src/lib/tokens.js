const jwt = require('jsonwebtoken');
const { secrets } = require('./secrets');

const expiresIn = {
  temporary: '1d',
  regular: '30d',
  access: '1w',
  application: '1y',
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

function createCredentialToken(credential) {
  const { type, _id: credentialId } = credential;
  if (!['access', `application`].includes(type)) {
    return null;
  }

  return jwt.sign({ credentialId, type }, secrets[type], { expiresIn: expiresIn[type] });
}

module.exports = {
  createUserToken,
  createCredentialToken,
};
