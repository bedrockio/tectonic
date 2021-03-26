const { PubSub } = require('@google-cloud/pubsub');
const config = require('@bedrockio/config');

const ENV_NAME = config.get('ENV_NAME');

if (ENV_NAME === 'development') {
  const emulatorHost = config.get('PUBSUB_EMULATOR_HOST');
  if (!emulatorHost) {
    throw new Error('PUBSUB_EMULATOR_HOST is not set, which is required for local dev.');
  }
}

const pubSubClient = new PubSub();

async function publishMessage(topicName, dataString) {
  const dataBuffer = Buffer.from(dataString);

  const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);
  if (ENV_NAME == 'development') {
    console.info(`Message ${messageId} published to topic ${topicName}`);
  }
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
  await pubSubClient.topic(topicName).createSubscription(subscriptionName);
  console.info(`Subscription ${subscriptionName} created for topic ${topicName}.`);
}

async function createPushSubscription(topicName, subscriptionName, pushEndpoint) {
  const options = {
    pushConfig: {
      // Set to an HTTPS endpoint of your choice. If necessary, register
      // (authorize) the domain on which the server is hosted.
      pushEndpoint,
    },
  };

  await pubSubClient.topic(topicName).createSubscription(subscriptionName, options);
  console.info(`Push Subscription ${subscriptionName} created for topic ${topicName}.`);
}

module.exports = {
  pubSubClient,
  publishMessage,
  getTopic,
  createTopic,
  createSubscription,
  createPushSubscription,
};
