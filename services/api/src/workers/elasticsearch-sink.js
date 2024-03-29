const config = require('@bedrockio/config');
const { pubSubClient, createSubscription } = require('../lib/pubsub');
const { logger } = require('@bedrockio/instrumentation');
const { bulkErrorLog, bulkIndexBatchEvents } = require('../lib/analytics');

const ENV_NAME = config.get('ENV_NAME');
const maxInProgress = config.get('ELASTICSEARCH_SINK_WORKER_MAX_IN_PROGRESS', 'integer') || 100;

function listenForMessages(subscriptionName, maxMilliseconds = 2000) {
  // References an existing subscription

  const subscriberOptions = {
    flowControl: {
      maxMessages: maxInProgress,
      allowExcessMessages: false,
    },
  };
  const subscription = pubSubClient.subscription(subscriptionName, subscriberOptions);

  var bulk = [];
  var pending;

  let counter = 0;

  const bulkIndex = async () => {
    const [...messages] = bulk;
    bulk = [];

    if (pending) {
      clearTimeout(pending);
      pending = null;
    }

    const parsedMessages = messages.map((message) => {
      const data = Buffer.from(message.data, 'base64').toString('utf-8');
      return JSON.parse(data);
    });

    logger.info(`BULK INDEXED ${parsedMessages.length} messages`);
    try {
      const bulkResult = await bulkIndexBatchEvents(parsedMessages);
      // logger.info(bulkResult);
      await bulkErrorLog(bulkResult, parsedMessages);
    } catch (e) {
      logger.error(`BulkIndex ERROR: ${e}`);
    } finally {
      // Alway acknowledge messages
      // TODO: Move to error queue
      for (const message of messages) {
        // "Ack" (acknowledge receipt of) the message
        // logger.info(`Acknowledged ${message.id}`);
        message.ack();
      }
      counter += messages.length;
      logger.info(`Acknowledged ${messages.length} messages (Counter: ${counter})`);
    }
  };

  // Create an event handler to handle messages
  const messageHandler = async (message) => {
    // logger.info(`Received message ${message.id}:`);
    // logger.info(`\tData: ${message.data}`);
    // logger.info(`\tAttributes: ${message.attributes}`);
    // logger.info(message.id);

    bulk.push(message);

    if (bulk.length >= maxInProgress) {
      await bulkIndex();
    } else if (!pending) {
      pending = setTimeout(async () => await bulkIndex(), maxMilliseconds);
    }
  };

  const errorHandler = function (error) {
    // Do something with the error
    logger.error(`ERROR: ${error}`);
    throw error;
  };

  // Listen for new messages until timeout is hit
  subscription.on('message', messageHandler);
  subscription.on('error', errorHandler);
}

async function run() {
  const subscriptionName = config.get('PUBSUB_RAW_EVENTS_SUB_ELASTICSEARCH');

  if (ENV_NAME === 'development') {
    const enrichedEventsTopicName = config.get('PUBSUB_RAW_EVENTS_TOPIC');
    await createSubscription(enrichedEventsTopicName, subscriptionName);
  }

  logger.info(`listening for messages... (subscription: "${subscriptionName})"`);
  listenForMessages(subscriptionName);
}

module.exports = (async () => {
  run(...process.argv.slice(2)).catch((error) => {
    logger.error(`Fatal error: ${error.message}, exiting.`);
    logger.error(error.stack);
    process.exit(1);
  });
})();
