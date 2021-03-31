const config = require('@bedrockio/config');
const { pubSubClient, createSubscription } = require('../lib/pubsub');
// const { bulkErrorLog, bulkIndexEvents } = require('../lib/analytics');

const ENV_NAME = config.get('ENV_NAME');
const maxInProgress = config.get('ELASTICSEARCH_SINK_WORKER_MAX_IN_PROGRESS', 'integer') || 100;

function listenForMessages(subscriptionName, index, maxMilliseconds = 2000) {
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

    const parsedMessages = messages.flatMap((message) => {
      const data = Buffer.from(message.data, 'base64').toString('utf-8');
      return JSON.parse(data);
    });

    // const bulkResult = await bulkIndexEvents(parsedMessages, index);
    // await bulkErrorLog(bulkResult, parsedMessages);
    console.info(`BULK INDEXED ${parsedMessages.length} messages`);

    messages.forEach((message) => {
      // "Ack" (acknowledge receipt of) the message
      // console.log(`Acknowledged ${message.id}`);
      message.ack();
    });
    counter += messages.length;
    console.info(`Acknowledged ${messages.length} messages (Counter: ${counter})`);
  };

  // Create an event handler to handle messages
  const messageHandler = async (message) => {
    // console.log(`Received message ${message.id}:`);
    // console.log(`\tData: ${message.data}`);
    // console.log(`\tAttributes: ${message.attributes}`);
    // console.log(message.id);

    bulk.push(message);

    if (bulk.length >= maxInProgress) {
      await bulkIndex();
    } else if (!pending) {
      pending = setTimeout(async () => await bulkIndex(), maxMilliseconds);
    }
  };

  const errorHandler = function (error) {
    // Do something with the error
    console.error(`ERROR: ${error}`);
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

  console.info(`listening for messages... (subscription: "${subscriptionName})"`);
  listenForMessages(subscriptionName);
}

module.exports = (async () => {
  run(...process.argv.slice(2)).catch((error) => {
    console.error(`Fatal error: ${error.message}, exiting.`);
    console.error(error.stack);
    process.exit(1);
  });
})();
