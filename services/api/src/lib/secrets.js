const config = require('@bedrockio/config');

const secrets = {
  user: config.get('USER_JWT_SECRET'),
  application: config.get('APPLICATION_JWT_SECRET'),
  access: config.get('ACCESS_JWT_SECRET'),
  policy: config.get('POLICY_JWT_SECRET'), // TODO: remove policy secret
};

module.exports = {
  secrets,
};
