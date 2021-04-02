const { chunk } = require('lodash');

function memorySizeOf(obj) {
  var bytes = 0;

  function sizeOf(obj) {
    if (obj !== null && obj !== undefined) {
      switch (typeof obj) {
        case 'number':
          bytes += 8;
          break;
        case 'string':
          bytes += obj.length * 2;
          break;
        case 'boolean':
          bytes += 4;
          break;
        case 'object':
          var objClass = Object.prototype.toString.call(obj).slice(8, -1);
          if (objClass === 'Object' || objClass === 'Array') {
            for (var key in obj) {
              if (!(key in obj)) continue;
              sizeOf(obj[key]);
            }
          } else bytes += obj.toString().length * 2;
          break;
      }
    }
    return bytes;
  }

  function formatByteSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + ' MB';
    else return (bytes / 1073741824).toFixed(3) + ' GB';
  }

  return formatByteSize(sizeOf(obj));
}

async function chunkedAsyncMap(events, fn, chunkSize = 10) {
  const chunkedArray = chunk(events, chunkSize);
  chunkedArray.reduce(async (previousChunk, currentChunk /*, index*/) => {
    await previousChunk;
    // logger.info(`Processing chunk ${index}...`);
    const currentChunkPromises = currentChunk.map(async (event) => await fn(event));
    await Promise.all(currentChunkPromises);
  }, Promise.resolve());
}

module.exports = {
  memorySizeOf,
  chunkedAsyncMap,
};
