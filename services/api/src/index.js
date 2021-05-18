const { setupTelemetry, logger } = require('@bedrockio/instrumentation');
setupTelemetry();

const { initialize: initPubSub } = require('./lib/pubsub');
const { initialize: initDB } = require('./utils/database');
const { createFixtures } = require('./fixtures');
const { createUserLastingToken } = require('./lib/tokens');
const { User } = require('./models');
const app = require('./app');

const config = require('@bedrockio/config');

const ENV_NAME = config.get('ENV_NAME');
const PORT = config.get('BIND_PORT', 'number');
const HOST = config.get('BIND_HOST');

const adminConfig = {
  name: config.get('ADMIN_NAME'),
  email: config.get('ADMIN_EMAIL'),
  password: config.get('ADMIN_PASSWORD'),
};

module.exports = (async () => {
  await initDB();

  app.listen(PORT, HOST, async () => {
    logger.info(`Started on port //${HOST}:${PORT}`);
    if (ENV_NAME === 'development') {
      logger.info('-----------------------------------------------------------------');
      await createFixtures();
      try {
        await initPubSub();
      } catch (e) {
        console.error(e);
      }
      logger.info(`Admin Login ${adminConfig.email}:${adminConfig.password} (dev env only)`);
      const adminUser = await User.findOne({ email: adminConfig.email });
      logger.info(`Lasting dev User token: ${createUserLastingToken(adminUser)}`);
      logger.info('-----------------------------------------------------------------');
    }
  });

  return app;
})();
