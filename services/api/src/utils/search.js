const Joi = require('@hapi/joi');
const { escapeRegExp } = require('lodash');
const ObjectId = require('mongoose').Types.ObjectId;
const PassThrough = require('stream').PassThrough;
const csv = require('fast-csv');

function searchValidation(options = {}) {
  const { limit = 50, sortField = 'createdAt', sortOrder = 'desc' } = options;
  return {
    ids: Joi.array().items(Joi.string()),
    startAt: Joi.date(),
    endAt: Joi.date(),
    skip: Joi.number().default(0),
    sort: Joi.object({
      field: Joi.string().required(),
      order: Joi.string().allow('desc', 'asc').required(),
    }).default({
      field: sortField,
      order: sortOrder,
    }),
    limit: Joi.number().positive().default(limit),
    keyword: Joi.string().allow(''),
  };
}

function exportValidation(options = {}) {
  const { filename = 'export.csv' } = options;
  return {
    filename: Joi.string().default(filename),
    format: Joi.string().allow('json', 'csv').default('json'),
  };
}

function getSearchQuery(body, options = {}) {
  const { keyword, startAt, endAt, ids = [] } = body;
  const { keywordFields = [] } = options;
  const query = { deletedAt: { $exists: false } };
  if (startAt || endAt) {
    query.createdAt = {};
    if (startAt) {
      query.createdAt.$gte = startAt;
    }
    if (endAt) {
      query.createdAt.$lte = endAt;
    }
  }
  if (ids.length) {
    query._id = { $in: ids };
  }
  if (keyword && !keywordFields.length) {
    throw new Error('No keyword search has been configured for this API call');
  }
  if (keyword) {
    query.$or = [];
    const reg = RegExp(escapeRegExp(keyword), 'i');
    for (let field of keywordFields) {
      query.$or.push({
        [field]: reg,
      });
    }
    if (ObjectId.isValid(keyword)) {
      query.$or.push({
        _id: keyword,
      });
    }
  }
  return query;
}

async function search(model, query, body) {
  const { sort, skip, limit } = body;
  let find = model
    .find(query)
    .sort({ [sort.field]: sort.order === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit);
  const data = await find.exec();
  const total = await model.countDocuments(query);
  return {
    data,
    meta: {
      total,
      skip,
      limit,
    },
  };
}

function searchExport(ctx, data) {
  const { format, filename } = ctx.request.body;
  if (format === 'csv') {
    const csvStream = csv.format({ headers: true, objectMode: true, delimiter: ';' });

    ctx.body = csvStream.pipe(PassThrough());

    data.forEach((item) => {
      csvStream.write(exports.flatten(item));
    });
    ctx.set('Content-Disposition', `attachment; filename=${filename}`);
    ctx.set('Content-Type', 'text/csv');
    csvStream.end();
    return true;
  }
  return false;
}

module.exports = {
  searchValidation,
  exportValidation,
  getSearchQuery,
  search,
  searchExport,
};
