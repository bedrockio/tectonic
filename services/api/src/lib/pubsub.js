const { PubSub } = require('@google-cloud/pubsub');
const config = require('@bedrockio/config');

const ENV_NAME = config.get('ENV_NAME');
const PUBSUB_RAW_EVENTS_TOPIC = config.get('PUBSUB_RAW_EVENTS_TOPIC');
const PUBSUB_RAW_EVENTS_SUB_ELASTICSEARCH = config.get('PUBSUB_RAW_EVENTS_SUB_ELASTICSEARCH');

let noPubSub = false;

if (ENV_NAME === 'development') {
  const pubsubEmulator = config.get('PUBSUB_EMULATOR');
  if (!pubsubEmulator) {
    console.warn('PUBSUB_EMULATOR is set to False. Messages will not be published to pubsub.');
    noPubSub = true;
  }
}

async function init() {
  if (noPubSub) {
    console.warn('PUBSUB_EMULATOR is set to False. Topics are not initialized');
  } else {
    console.info(`Create subscription: ${PUBSUB_RAW_EVENTS_SUB_ELASTICSEARCH}`);
    await createSubscription(PUBSUB_RAW_EVENTS_TOPIC, PUBSUB_RAW_EVENTS_SUB_ELASTICSEARCH);
  }
}

const pubSubClient = new PubSub();

async function publishMessage(topicName, dataString) {
  if (noPubSub) {
    console.info(`PublishMessage: ${dataString} to topic: ${topicName}`);
    return -1;
  }

  const dataBuffer = Buffer.from(dataString);

  const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);
  // console.info(`Message ${messageId} published to topic ${topicName}`);
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

async function createSubscription(topicName, subscriptionName, subscriptionOptions = { ackDeadlineSeconds: 599 }) {
  const [subscriptions] = await pubSubClient.getSubscriptions();
  if (subscriptions.filter((sub) => sub.name && sub.name.split('/').slice(-1)[0] == subscriptionName).length == 0) {
    await createTopic(topicName);
    await pubSubClient.topic(topicName).createSubscription(subscriptionName, subscriptionOptions);
    console.info(`Subscription "${subscriptionName}" created for topic "${topicName}".`);
  }
}

module.exports = {
  pubSubClient,
  createSubscription,
  createTopic,
  getTopic,
  publishMessage,
  init,
};
