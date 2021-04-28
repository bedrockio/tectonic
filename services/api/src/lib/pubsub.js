const { PubSub } = require('@google-cloud/pubsub');
const config = require('@bedrockio/config');
const { logger } = require('@bedrockio/instrumentation');

const ENV_NAME = config.get('ENV_NAME');
const PUBSUB_RAW_EVENTS_TOPIC = config.get('PUBSUB_RAW_EVENTS_TOPIC');
const PUBSUB_RAW_EVENTS_SUB_ELASTICSEARCH = config.get('PUBSUB_RAW_EVENTS_SUB_ELASTICSEARCH');

let noPubSub = false;

if (ENV_NAME === 'development') {
  const pubsubEmulator = config.get('PUBSUB_EMULATOR');
  if (!pubsubEmulator) {
    logger.warn('PUBSUB_EMULATOR is set to False. Messages will not be published to pubsub.');
    noPubSub = true;
  }
}

async function initialize() {
  if (noPubSub) {
    logger.warn('PUBSUB_EMULATOR is set to False. Topics are not initialized');
  } else {
    await createSubscription(PUBSUB_RAW_EVENTS_TOPIC, PUBSUB_RAW_EVENTS_SUB_ELASTICSEARCH);
  }
}

const pubSubClient = new PubSub();

async function publishMessage(topicName, dataString) {
  if (noPubSub) {
    logger.info(`PublishMessage: ${dataString} to topic: ${topicName}`);
    return -1;
  }

  const dataBuffer = Buffer.from(dataString);

  const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);
  // logger.info(`Message ${messageId} published to topic ${topicName}`);
  return messageId;
}

async function getTopic(topicName) {
  const [topic] = await pubSubClient.topic(topicName).get();
  return topic;
}

async function createTopic(topicName) {
  const [topic] = await pubSubClient.topic(topicName).get({ autoCreate: true });
  return topic;
}

async function createSubscription(topicName, subscriptionName, ackDeadlineSeconds = 599) {
  const subscriptionOptions = {
    ackDeadlineSeconds,
    expirationPolicy: {},
  };

  logger.info('PubSub getSubscriptions');
  const [subscriptions] = await pubSubClient.getSubscriptions();

  if (subscriptions.filter((sub) => sub.name && sub.name.split('/').slice(-1)[0] == subscriptionName).length == 0) {
    logger.info(`Create subscription: ${subscriptionName}}`);
    await createTopic(topicName);
    await pubSubClient.topic(topicName).createSubscription(subscriptionName, subscriptionOptions);
    logger.info(`Subscription "${subscriptionName}" created for topic "${topicName}".`);
  }
}

module.exports = {
  pubSubClient,
  createSubscription,
  createTopic,
  getTopic,
  publishMessage,
  initialize,
};
