const request = require('supertest'); //eslint-disable-line
const app = require('../../app');
const qs = require('querystring');
const tokens = require('../tokens');

module.exports = async function handleRequest(httpMethod, url, bodyOrQuery = {}, options = {}) {
  const headers = options.headers || {};
  if (options.user && !headers.Authorization) {
    headers.Authorization = `Bearer ${tokens.createUserToken(options.user)}`;
  }

  let promise;

  if (options.file) {
    const files = Array.isArray(options.file) ? options.file : [options.file];
    promise = request(app.callback()).post(url).set(headers);
    for (let file of files) {
      promise = promise.attach('file', file);
    }
    for (let [key, value] of Object.entries(bodyOrQuery)) {
      promise = promise.field(key, value);
    }
  } else {
    if (httpMethod === 'POST') {
      promise = request(app.callback())
        .post(url)
        .set(headers)
        .send({ ...bodyOrQuery });
    } else if (httpMethod === 'PUT') {
      promise = request(app.callback())
        .put(url)
        .set(headers)
        .send({ ...bodyOrQuery });
    } else if (httpMethod === 'PATCH') {
      promise = request(app.callback())
        .patch(url)
        .set(headers)
        .send({ ...bodyOrQuery });
    } else if (httpMethod === 'DELETE') {
      promise = request(app.callback())
        .del(url)
        .set(headers)
        .send({ ...bodyOrQuery });
    } else if (httpMethod === 'GET') {
      promise = request(app.callback())
        .get(`${url}?${qs.stringify({ ...bodyOrQuery })}`)
        .set(headers);
    } else {
      throw Error(`${httpMethod} is not supported`);
    }
  }

  if (promise) {
    return promise;
  }

  throw Error(`Method not support ${httpMethod} by handleRequest`);
};
