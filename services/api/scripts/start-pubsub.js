// const Emulator = require('google-pubsub-emulator');

// async function run() {
//   const options = {
//     debug: false, // if you like to see the emulator output
//     topics: [], // automatically created topics
//     host: 'localhost',
//     port: 8200,
//   };

//   const emulator = new Emulator(options);
//   let started = false;
//   setTimeout(() => {
//     if (!started) {
//       console.error('Emulator could not be started');
//       emulator.stop();
//       process.exit(-1);
//     }
//   }, 2000);
//   await emulator.start();
//   started = true;
// }

// run().then(() => {
//   console.info('PubSub is running...');
// });

// const { spawn } = require('child_process');

// var child = spawn('gcloud beta emulators pubsub start --host-port 0.0.0.0:8200', { async: true, silent: true });

// function onExit() {
//   console.info('Process Exit');
//   child.kill('SIGINT');
//   process.exit(0);
// }

// process.on('SIGINT', onExit);
// process.on('exit', onExit);

var child = require('child_process').spawn('gcloud', [
  'beta',
  'emulators',
  'pubsub',
  'start',
  '--host-port',
  '0.0.0.0:8200',
]);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

function onExit() {
  console.info('Process Exit');
  child.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', onExit);
process.on('exit', onExit);
