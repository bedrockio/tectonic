const { setupTelemetry, logger } = require('@bedrockio/instrumentation');

if (process.env.NODE_ENV === 'production') {
  setupTelemetry({
    http: {
      ignoreIncomingPaths: ['/', '/1/status/mongodb'],
    },
  });
}

const { initialize: initPubSub } = require('./lib/pubsub');
const { getStats } = require('./lib/analytics');
const { initialize: initDB } = require('./utils/database');
const { createFixtures } = require('./fixtures');
// const { createCredentialToken } = require('./lib/tokens');
// const { User } = require('./models');
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
      const { cluster_name, indices, status } = await getStats();
      logger.info(`Elasticsearch cluster "${cluster_name}" has ${indices?.count || 0} indices and status "${status}" `);
      await createFixtures();
      try {
        await initPubSub();
      } catch (e) {
        console.error(e);
      }
      logger.info(`Admin Login ${adminConfig.email}:${adminConfig.password} (dev env only)`);
      // const adminUser = await User.findOne({ email: adminConfig.email });
      // logger.info(`Lasting dev User token: ${createUserLastingToken(adminUser)}`);
      logger.info('-----------------------------------------------------------------');
    }
  });

  return app;
})();
