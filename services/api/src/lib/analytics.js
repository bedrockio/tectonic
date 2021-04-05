const fs = require('fs');
const elasticsearch = require('@elastic/elasticsearch');
const config = require('@bedrockio/config');
const { get: objectGet } = require('lodash');
const { createHash } = require('crypto');
const { logger } = require('@bedrockio/instrumentation');

const elasticsearchClient = new elasticsearch.Client({
  node: config.get('ELASTICSEARCH_URI'),
  log: 'error',
});

async function terms(index, aggField, options = undefined) {
  const body = parseFilterOptions(options, true);
  if (!options) options = {};
  body.from = 0;
  body.size = 0;
  let additionalAggs = undefined;
  if (options.field) {
    if (!additionalAggs) additionalAggs = {};
    additionalAggs['fieldOperation'] = {
      [options.operation || 'sum']: { field: options.field },
    };
  }
  if (options.includeTopHit || options.referenceFetch) {
    if (!additionalAggs) additionalAggs = {};
    additionalAggs['includeTopHit'] = {
      top_hits: { size: 1 },
    };
  }
  body.aggs = {
    aggField: {
      terms: {
        field: aggField,
        order: options.field ? { fieldOperation: options.aggFieldOrder || 'desc' } : undefined,
        size: options.termsSize || 10,
      },
      aggs: additionalAggs,
    },
  };
  // console.log(JSON.stringify(body, null, 2));
  const result = await elasticsearchClient.search({
    index,
    body,
  });
  const hits = result.body.aggregations.aggField.buckets.map((bucket) => {
    return {
      key: bucket.key,
      count: bucket.doc_count,
      value: bucket.fieldOperation ? bucket.fieldOperation.value : 0,
      topHit: bucket.includeTopHit ? bucket.includeTopHit.hits.hits[0] : undefined,
    };
  });
  if (options.referenceFetch) {
    const { sourceField, destinationIndex, destinationField } = options.referenceFetch;
    if (!sourceField || !destinationField || !destinationIndex) {
      throw new Error('Invalid referenceFetch need sourceField, destinationField and destinationIndex');
    }
    for (const hit of hits) {
      if (!hit.topHit) continue;
      const sourceValue = objectGet(hit.topHit._source, sourceField);
      if (!sourceValue) continue;
      const reference = await fetch(destinationIndex, destinationField, sourceValue);
      hit.reference = reference;
    }
  }
  return hits;
}

async function timeSeries(index, operation, field, options = undefined) {
  const body = parseFilterOptions(options, true);
  body.from = 0;
  body.size = 0;
  body.aggs = {
    timeSeries: {
      date_histogram: {
        field: options.dateField || 'createdAt',
        interval: options.interval || '1d',
        min_doc_count: 0,
      },
      aggs: {
        fieldOperation: field
          ? {
              [operation]: {
                field,
              },
            }
          : undefined,
      },
    },
  };
  // console.log(JSON.stringify(body, null, 2));
  const result = await elasticsearchClient.search({
    index,
    body,
  });
  // console.log(JSON.stringify(result, null, 2));
  return result.body.aggregations.timeSeries.buckets.map(({ key_as_string, key, doc_count, fieldOperation }) => {
    return {
      dateStr: key_as_string,
      timestamp: key,
      count: doc_count || 0,
      value: fieldOperation ? fieldOperation.value || 0 : 0,
    };
  });
}

async function stats(index, fields, options = undefined) {
  const body = parseFilterOptions(options, true);
  body.from = 0;
  body.size = 0;
  body.aggs = {};
  fields.forEach((field, i) => {
    body.aggs[`${i}Stats`] = {
      stats: {
        field,
      },
    };
  });
  const result = await elasticsearchClient.search({
    index,
    body,
  });
  const stats = {};
  fields.forEach((field, i) => {
    stats[field] = result.body.aggregations[`${i}Stats`];
  });
  return stats;
}

async function listIndices() {
  const { body } = await elasticsearchClient.cat.indices();
  return body
    .split('\n')
    .slice(0, -1)
    .map((line) => {
      const parse = line.split(/\s+/);
      return {
        index: parse[2],
        status: parse[0],
        diskSize: parse[8],
        count: parseInt(parse[6], 10),
      };
    });
}

async function cardinality(index, fields, options = undefined) {
  const body = parseFilterOptions(options, true);
  body.from = 0;
  body.size = 0;
  body.aggs = {};
  fields.forEach((field, i) => {
    body.aggs[`${i}Stats`] = {
      cardinality: {
        field,
      },
    };
  });
  const result = await elasticsearchClient.search({
    index,
    body,
  });
  const stats = {};
  fields.forEach((field, i) => {
    stats[field] = result.body.aggregations[`${i}Stats`].value;
  });
  return stats;
}

async function search(index, options = undefined) {
  const body = parseFilterOptions(options);
  const result = await elasticsearchClient.search({
    index,
    body,
  });
  return result.body;
}

async function fetch(index, field, value) {
  const body = {
    query: {
      term: {
        [field]: value,
      },
    },
    size: 1,
  };
  const result = await elasticsearchClient.search({
    index,
    body,
  });
  const { hits } = result.body;
  if (!hits.hits.length) return null;
  return hits.hits[0]._source;
}

async function get(index, id) {
  const result = await elasticsearchClient.get({
    index,
    id,
  });
  const { body } = result;
  return body;
}

function parseFilterOptions(options = { from: 0, size: 100 }, skipSort = false) {
  const sort = [
    {
      [options.dateField || 'timestamp']: {
        order: 'desc',
      },
    },
  ];
  const { providerId, from, size, terms, excludeTerms, exists, notExists, minTimestamp, q, range } = options;
  const body = {
    sort: skipSort ? undefined : sort,
    from,
    size,
  };
  if (terms) {
    body.query = {
      bool: {
        must: terms.map((term) => {
          return {
            term,
          };
        }),
      },
    };
  }
  if (excludeTerms) {
    body.query = {
      bool: {
        must_not: excludeTerms.map((term) => {
          return {
            term,
          };
        }),
      },
    };
  }
  if (exists) {
    if (!body.query) {
      body.query = {};
    }
    if (!body.query.bool) {
      body.query.bool = {};
    }
    if (!body.query.bool.must) {
      body.query.bool.must = [];
    }
    body.query.bool.must.push({
      exists: {
        field: exists,
      },
    });
  }
  if (providerId) {
    if (!body.query) {
      body.query = {};
    }
    if (!body.query.bool) {
      body.query.bool = {};
    }
    if (!body.query.bool.must) {
      body.query.bool.must = [];
    }
    body.query.bool.must.push({
      term: {
        providerId: providerId,
      },
    });
  }
  if (notExists) {
    if (!body.query) {
      body.query = {};
    }
    if (!body.query.bool) {
      body.query.bool = {};
    }
    if (!body.query.bool.must_not) {
      body.query.bool.must_not = [];
    }
    body.query.bool.must_not.push({
      exists: {
        field: notExists,
      },
    });
  }
  if (minTimestamp) {
    if (!body.query) {
      body.query = {};
    }
    if (!body.query.bool) {
      body.query.bool = {};
    }
    if (!body.query.bool.must) {
      body.query.bool.must = [];
    }
    body.query.bool.must.push({
      range: {
        timestamp: {
          gt: minTimestamp,
        },
      },
    });
  }
  if (range) {
    if (!body.query) {
      body.query = {};
    }
    if (!body.query.bool) {
      body.query.bool = {};
    }
    if (!body.query.bool.must) {
      body.query.bool.must = [];
    }
    body.query.bool.must.push({
      range: range,
    });
  }
  if (q) {
    if (!body.query) {
      body.query = {};
    }
    if (!body.query.bool) {
      body.query.bool = {};
    }
    if (!body.query.bool.must) {
      body.query.bool.must = [];
    }
    body.query.bool.must.push({
      query_string: {
        query: q,
      },
    });
  }
  // console.log(JSON.stringify(body, null, 2));
  return body;
}

async function refreshIndex(index) {
  await elasticsearchClient.indices.refresh({ index });
}

async function ensureIndex(index, { recreate = false } = {}) {
  const existsResult = await elasticsearchClient.indices.exists({ index });
  if (recreate && existsResult.statusCode === 200) {
    await elasticsearchClient.indices.delete({ index });
  }
  const existsResult2 = await elasticsearchClient.indices.exists({ index });
  if (!(existsResult2.statusCode === 200)) {
    const defaultDynamicMapping = {
      dynamic_templates: [
        {
          strings_as_keywords: {
            match_mapping_type: 'string',
            mapping: {
              type: 'keyword',
            },
          },
        },
      ],
      properties: {
        'time-stamp': {
          type: 'long',
        },
        timestamp: {
          type: 'date',
        },
      },
    };
    await elasticsearchClient.indices.create({
      index,
      body: {
        mappings: defaultDynamicMapping,
      },
    });
  }
}

async function indexEvent(index, event, { idField = null, refresh = false } = {}) {
  let id = idField ? event[idField] : event.id;
  if (!id) {
    const md5 = createHash('md5');
    md5.update(JSON.stringify(event));
    id = md5.digest('hex');
    event.id = id;
  }
  // console.log(index, type, id, event);
  await elasticsearchClient.index({
    index,
    id: id,
    body: event,
    refresh,
  });
}

function loadJsonStreamFile(path) {
  return fs
    .readFileSync(path)
    .toString('utf-8')
    .split('\n')
    .filter((line) => line.length)
    .map((line) => JSON.parse(line));
}

const indexExists = async (index) => {
  const { body: exists } = await elasticsearchClient.indices.exists({ index });
  return exists;
};

const deleteIndex = async (index) => {
  const exists = await indexExists(index);
  if (exists) {
    logger.info('Deleting index:', index);
    await elasticsearchClient.indices.delete({ index });
  }
};

const dynamic_templates = [
  {
    strings_as_keywords: {
      match_mapping_type: 'string',
      mapping: {
        type: 'keyword',
      },
    },
  },
];

const ensureCollectionIndex = async (collectionId, collectionIndexName) => {
  let index = `tectonic-collection-${collectionId}`;
  if (collectionIndexName) index += `-${collectionIndexName}`;
  const exists = await indexExists(index);
  if (!exists) {
    logger.info(index, 'index does not exist yet. Creating now...');
    try {
      await elasticsearchClient.indices.create({
        index,
        body: {
          mappings: {
            dynamic_templates,
          },
        },
      });
    } catch (e) {
      logger.error(e);
      return false;
    }
  }
  return true;
};

const bulkIndexBatchEvents = async (batchEvents) => {
  // logger.info('events:', batchEvents);
  const body = batchEvents.flatMap(({ batch, event }) => {
    const { datalakeId, collectionId, id: batchId, ingestedAt } = batch;
    const index = { _index: `tectonic-collection-${collectionId}` };
    if (event.id) index._id = event.id;
    const doc = {
      datalakeId,
      collectionId,
      batchId,
      ingestedAt,
      event,
    };
    return [{ index }, doc];
  });
  return await elasticsearchClient.bulk({
    body,
    refresh: true,
  });
};

const bulkErrorLog = async (bulkResult, events) => {
  if (!bulkResult || !bulkResult.body || !bulkResult.body.items) {
    logger.error('Missing bulkResult.body.items');
    return;
  }
  const items = bulkResult.body.items;
  if (events.length != items.length) {
    logger.error('Events.length does not equal items length');
    return;
  }
  items.forEach((item, index) => {
    if (item.index.status == 400) {
      logger.error({ event: events[index], error: item.index.error });
    }
  });
};

module.exports = {
  terms,
  timeSeries,
  stats,
  cardinality,
  search,
  get,
  fetch,
  elasticsearchClient,
  indexEvent,
  refreshIndex,
  ensureIndex,
  loadJsonStreamFile,
  listIndices,
  indexExists,
  deleteIndex,
  ensureCollectionIndex,
  bulkIndexBatchEvents,
  bulkErrorLog,
};