const fs = require('fs');
const elasticsearch = require('@elastic/elasticsearch');
const config = require('@bedrockio/config');
const { createHash } = require('crypto');
const { logger } = require('@bedrockio/instrumentation');
const ENV_NAME = config.get('ENV_NAME');

const elasticsearchClient = new elasticsearch.Client({
  node: config.get('ELASTICSEARCH_URI'),
  log: 'error',
});

async function terms(index, aggField, options = {}, returnSearchOptions = false) {
  const body = parseFilterOptions(options, true);
  const { field, includeTopHit, includeFields, excludeFields } = options;
  body.from = 0;
  body.size = 0;
  let additionalAggs = undefined;
  if (field) {
    if (!additionalAggs) additionalAggs = {};
    additionalAggs['fieldOperation'] = {
      [options.operation || 'sum']: { field },
    };
  }
  if (includeTopHit) {
    if (!additionalAggs) additionalAggs = {};
    additionalAggs['includeTopHit'] = {
      top_hits: { size: 1 },
    };
    if ((includeFields && includeFields.length) || (excludeFields && excludeFields.length)) {
      additionalAggs['includeTopHit'].top_hits._source = {};
    }
    if (includeFields && includeFields.length) {
      additionalAggs['includeTopHit'].top_hits._source.includes = includeFields;
    }
    if (excludeFields && excludeFields.length) {
      additionalAggs['includeTopHit'].top_hits._source.excludes = excludeFields;
    }
  }
  body.aggs = {
    aggField: {
      terms: {
        field: aggField,
        order: field ? { fieldOperation: options.aggFieldOrder || 'desc' } : undefined,
        size: options.termsSize || 10,
      },
      aggs: additionalAggs,
    },
  };
  const searchOptions = { index, body };
  if (returnSearchOptions) return searchOptions;
  const result = await elasticsearchClient.search(searchOptions);
  const hits = result.body.aggregations.aggField.buckets.map((bucket) => {
    return {
      key: bucket.key,
      count: bucket.doc_count,
      value: bucket.fieldOperation ? bucket.fieldOperation.value : 0,
      topHit: bucket.includeTopHit ? bucket.includeTopHit.hits.hits[0] : undefined,
    };
  });
  return hits;
}

async function timeSeries(index, operation, field, options = undefined, returnSearchOptions = false) {
  const body = parseFilterOptions(options, true);
  body.from = 0;
  body.size = 0;
  const { dateField, interval, timeZone } = options;
  const date_histogram = {
    field: dateField || 'ingestedAt',
    interval: interval || '1d',
    min_doc_count: 0,
  };
  if (options.range && options.range[dateField]) {
    date_histogram.extended_bounds = {};
    const { from, to, gte, gt, lte, lt, time_zone } = options.range[dateField];
    if (from) {
      date_histogram.extended_bounds.min = from;
    } else if (gte) {
      date_histogram.extended_bounds.min = gte;
    } else if (gt) {
      date_histogram.extended_bounds.min = gt;
    }
    if (to) {
      date_histogram.extended_bounds.max = to;
    } else if (lte) {
      date_histogram.extended_bounds.max = lte;
    } else if (lt) {
      date_histogram.extended_bounds.max = lt;
    }

    if (time_zone) {
      date_histogram.time_zone = timeZone;
    }
  }

  if (timeZone) {
    date_histogram.time_zone = timeZone;
  }

  body.aggs = {
    timeSeries: {
      date_histogram,
      aggs: {
        fieldOperation:
          field && operation
            ? {
                [operation]: {
                  field,
                },
              }
            : undefined,
      },
    },
  };
  const searchOptions = { index, body };
  if (returnSearchOptions) return searchOptions;
  const result = await elasticsearchClient.search(searchOptions);

  return result.body.aggregations.timeSeries.buckets.map(({ key_as_string, key, doc_count, fieldOperation }) => {
    return {
      dateStr: key_as_string,
      timestamp: key,
      count: doc_count || 0,
      value: fieldOperation ? fieldOperation.value || 0 : 0,
    };
  });
}

async function timeMap(index, options = undefined, returnSearchOptions = false) {
  const body = parseFilterOptions(options, true);
  body.from = 0;
  body.size = 0;
  const { dateField, interval, timeZone } = options;
  const date_histogram = {
    field: dateField || 'ingestedAt',
    interval: interval || '1d',
    min_doc_count: 0,
  };

  if (timeZone) {
    date_histogram.time_zone = timeZone;
  }

  const safeDateField = dateField.replace(/[^a-zA-Z0-9.]/g, '');
  body.aggs = {
    dayOfWeekDistribution: {
      terms: {
        script: {
          lang: 'painless',
          source: `doc['${safeDateField}'].value.getDayOfWeekEnum().getValue()`,
        },
      },
      aggs: {
        hourDistribution: {
          terms: {
            script: {
              lang: 'painless',
              source: `doc['${safeDateField}'].value.getHour()`,
            },
            size: 25,
          },
        },
      },
    },
  };
  const searchOptions = { index, body };
  if (returnSearchOptions) return searchOptions;
  const result = await elasticsearchClient.search(searchOptions);
  return result.body.aggregations.dayOfWeekDistribution.buckets.map(({ key, doc_count, hourDistribution }) => {
    return {
      dayOfWeek: parseInt(key, 10),
      count: doc_count || 0,
      hours: hourDistribution.buckets.map(({ key, doc_count }) => {
        return {
          hour: parseInt(key, 10),
          count: doc_count || 0,
        };
      }),
    };
  });
}

async function stats(index, fields, options = undefined, returnSearchOptions = false) {
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
  const searchOptions = { index, body };
  if (returnSearchOptions) return searchOptions;
  const result = await elasticsearchClient.search(searchOptions);
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

async function cardinality(index, fields, options = undefined, returnSearchOptions = false) {
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
  // console.log(index, JSON.stringify(body, null, 2));
  const searchOptions = { index, body };
  if (returnSearchOptions) return searchOptions;
  const result = await elasticsearchClient.search(searchOptions);
  const stats = {};
  fields.forEach((field, i) => {
    stats[field] = result.body.aggregations[`${i}Stats`].value;
  });
  return stats;
}

async function search(index, options = {}, returnSearchOptions = false) {
  const body = parseFilterOptions(options);
  const { includeFields, excludeFields } = options;
  if (((includeFields && includeFields.length) || (excludeFields && excludeFields.length)) && !body._source) {
    body._source = {};
  }
  if (includeFields && includeFields.length) {
    body._source.includes = includeFields;
  }
  if (excludeFields && excludeFields.length) {
    body._source.excludes = excludeFields;
  }
  const searchOptions = { index, body };
  if (returnSearchOptions) return searchOptions;
  const result = await elasticsearchClient.search(searchOptions);
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

function ensureBodyQueryBoolMust(body) {
  if (!body.query) {
    body.query = {};
  }
  if (!body.query.bool) {
    body.query.bool = {};
  }
  if (!body.query.bool.must) {
    body.query.bool.must = [];
  }
}

function ensureBodyQueryBoolMustNot(body) {
  if (!body.query) {
    body.query = {};
  }
  if (!body.query.bool) {
    body.query.bool = {};
  }
  if (!body.query.bool.must) {
    body.query.bool.must_not = [];
  }
}

function parseFilterOptions(options = {}, skipSort = false) {
  const sort = [
    {
      [options.dateField || 'ingestedAt']: {
        order: 'desc',
      },
    },
  ];
  const { from = 0, size = 100, terms, excludeTerms, exists, notExists, minTimestamp, q, range, ids, scope } = options;
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
    ensureBodyQueryBoolMust(body);
    body.query.bool.must.push({
      exists: {
        field: exists,
      },
    });
  }
  if (notExists) {
    ensureBodyQueryBoolMustNot(body);
    body.query.bool.must_not.push({
      exists: {
        field: notExists,
      },
    });
  }
  if (minTimestamp) {
    ensureBodyQueryBoolMust(body);
    body.query.bool.must.push({
      range: {
        timestamp: {
          gt: minTimestamp,
        },
      },
    });
  }
  if (range) {
    ensureBodyQueryBoolMust(body);
    body.query.bool.must.push({
      range: range,
    });
  }
  if (q) {
    ensureBodyQueryBoolMust(body);
    body.query.bool.must.push({
      query_string: {
        query: q,
      },
    });
  }
  if (ids) {
    ensureBodyQueryBoolMust(body);
    body.query.bool.must.push({
      ids: {
        values: ids,
      },
    });
  }
  if (scope) {
    ensureBodyQueryBoolMust(body);
    for (const [key, value] of Object.entries(scope)) {
      const scopeTerm = { term: {} };
      // TODO: move event. prefix out of this lib
      scopeTerm.term[`event.${key}`] = value;
      body.query.bool.must.push(scopeTerm);
    }
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
    if (ENV_NAME != 'test') logger.info('Deleting index:', index);
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

const getCollectionIndex = (collectionId) => {
  if (ENV_NAME == 'test') {
    return `test-tectonic-collection-${collectionId}`;
  } else {
    return `tectonic-collection-${collectionId}`;
  }
};

const ensureCollectionIndex = async (collection, collectionIndexName) => {
  const collectionId = collection.id;
  const properties = {
    ingestedAt: {
      type: 'date',
    },
  };
  if (collection.timeField) {
    properties.event = { properties: {} };
    properties.event.properties[collection.timeField] = { type: 'date' };
  }
  let index = getCollectionIndex(collectionId);
  if (collectionIndexName) index += `-${collectionIndexName}`;
  const exists = await indexExists(index);
  if (!exists) {
    if (ENV_NAME != 'test') logger.info(index, 'index does not exist yet. Creating now...');
    try {
      await elasticsearchClient.indices.create({
        index,
        body: {
          mappings: {
            dynamic_templates,
            properties,
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
    const { collectionId, id: batchId, ingestedAt } = batch;
    const index = { _index: getCollectionIndex(collectionId) };
    if (event.id) index._id = event.id;
    if (event._id) index._id = event._id;
    const doc = {
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

async function ensureAlias(index, alias, { recreate = true } = {}) {
  const existsResult = await elasticsearchClient.indices.existsAlias({ index, name: alias });
  if (recreate && existsResult.statusCode === 200) {
    await elasticsearchClient.indices.deleteAlias({ index, name: alias });
  }
  const existsResult2 = await elasticsearchClient.indices.existsAlias({ index, name: alias });
  if (!(existsResult2.statusCode === 200)) {
    await elasticsearchClient.indices.putAlias({ index, name: alias });
  }
}

async function getMapping(index) {
  const { body } = await elasticsearchClient.indices.getMapping({ index });
  return body;
}

module.exports = {
  terms,
  timeSeries,
  timeMap,
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
  getCollectionIndex,
  ensureAlias,
  getMapping,
};
