const Emulator = require('google-pubsub-emulator');

async function run() {
  const options = {
    debug: false, // if you like to see the emulator output
    topics: [], // automatically created topics
  };

  const emulator = new Emulator(options);
  emulator.start();
}

run().then(() => {
  console.info('PubSub is running...');
});
