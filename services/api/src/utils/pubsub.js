const { PubSub } = require('@google-cloud/pubsub');
const config = require('@bedrockio/config');

const ENV_NAME = config.get('ENV_NAME');

let noPubSub = false;

if (ENV_NAME === 'development' || ENV_NAME === 'test') {
  const emulatorHost = config.get('PUBSUB_EMULATOR_HOST');
  if (!emulatorHost) {
    if (ENV_NAME == 'development') {
      console.warn('PUBSUB_EMULATOR_HOST is not set. Messages will not be published to pubsub.');
    }
    noPubSub = true;
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

async function createSubscription(topicName, subscriptionName) {
  const [subscriptions] = await pubSubClient.getSubscriptions();
  if (subscriptions.filter((sub) => sub.name && sub.name.split('/').slice(-1)[0] == subscriptionName).length == 0) {
    await createTopic(topicName);
    await pubSubClient.topic(topicName).createSubscription(subscriptionName);
    console.info(`Subscription "${subscriptionName}" created for topic "${topicName}".`);
  }
}

module.exports = {
  createSubscription,
  createTopic,
  getTopic,
  publishMessage,
};
