const { setupTelemetry, logger } = require('@bedrockio/instrumentation');
setupTelemetry();

const { initialize: initPubSub } = require('./lib/pubsub');
const { initialize: initDB } = require('./utils/database');
const { createFixtures } = require('./fixtures');
const app = require('./app');

const config = require('@bedrockio/config');

const ENV_NAME = config.get('ENV_NAME');
const PORT = config.get('BIND_PORT', 'number');
const HOST = config.get('BIND_HOST');

module.exports = (async () => {
  await initDB();

  app.listen(PORT, HOST, async () => {
    logger.info(`Started on port //${HOST}:${PORT}`);
    if (ENV_NAME === 'development') {
      logger.info('-----------------------------------------------------------------');
      await createFixtures();
      await initPubSub();
      logger.info(
        `${config.get('APP_NAME')} Admin Login ${config.get('ADMIN_EMAIL')}:${config.get(
          'ADMIN_PASSWORD'
        )} (dev env only)`
      );
      logger.info('-----------------------------------------------------------------');
    }
  });

  return app;
})();
