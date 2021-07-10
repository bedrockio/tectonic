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
  const type = credential.accessPolicy ? 'access' : 'application';
  const { _id: credentialId } = credential;
  return jwt.sign({ credentialId, type }, secrets[type], { expiresIn: expiresIn[type] });
}

module.exports = {
  createUserToken,
  createCredentialToken,
};
