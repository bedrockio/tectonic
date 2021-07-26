# Tectonic API

![Run Tests](https://github.com/bedrockio/tectonic/workflows/Tests/badge.svg)

## API Documentation

See http://localhost:3200/docs for full documentation on this API (requires running the web interface).

## Directory Structure

- `.env` - Default configuration values (override via environment)
- `package.json` - Configure dependencies
- `src/**/__tests__` - Unit tests
- `src/lib` - Platform specific library files
- `src/utils` - Various utilities, helpers and middleware extensions
- `src/routes` - API Routes
- `src/routes/__openapi__` - OpenAPI descriptions for use in documentation portal
- `src/models` - Mongoose ORM models (code and JSON) - [Models Documentation](./src/models)
- `src/app.js` - Entrypoint into API (does not bind, so can be used in unit tests)
- `src/index.js` - Launch script for the API
- `scripts` - Scripts and jobs

## Install Dependencies

Ensure Node.js version uniformity using Volta:

```
curl -sSLf https://get.volta.sh | bash
```

Install dependencies: (will install correct Node.js version)

```
yarn install
```

## Testing & Linting

```
yarn test
```

## Running in Development

Code reload using nodemon:

```
yarn start
```

This command will automatically populate MongoDB fixtures when an empty DB is found.

## Configuration

All configuration is done using environment variables. The default values in `.env` can be overwritten using environment variables.

- `BIND_HOST` - Host to bind to, defaults to `"0.0.0.0"`
- `BIND_PORT` - Port to bind to, defaults to `3300`
- `MONGO_URI` - MongoDB URI to connect to, defaults to `mongodb://localhost/tectonic_dev`
- `JWT_SECRET` - JWT secret used for token signing and encryption, defaults to `[change me]`
- `ADMIN_NAME` - Default dashboard admin user name `admin`
- `ADMIN_EMAIL` - Default dashboard admin user `admin@tectonic.io`
- `ADMIN_PASSWORD` - Default dashboard admin password `[change me]`
- `POSTMARK_FROM` - Reply email address `no-reply@tectonic.io`
- `POSTMARK_APIKEY` - APIKey for Postmark `[change me]`
- `BATCHES_STORE` - Method for batches storage. `local` or `gcs` (Google Cloud Storage)
- `BATCHES_GCS_BUCKET` - GCS bucket for batches
- `SENTRY_DSN` - Sentry error monitoring credentials

## Building the Container

```
docker build -t tectonic-api .
```

See [../../deployment](../../deployment/) for more info

## Configuring Background Jobs

The API provides a simple Docker container for running Cronjobs. The Cron schedule can be configured in `scripts/jobs-entrypoint.sh`. Tip: use https://crontab.guru/ to check your cron schedule.

```
docker build -t tectonic-api-jobs -f Dockerfile.jobs .
```

## Reloading DB Fixtures

DB fixtures are loaded automatically in the dev environment. However, using this command you can force reload the DB:

```
./scripts/fixtures/reload
```

_Note: In the staging environment this script can be run by obtaining a shell into the API CLI pod (See Deployment)_

## Multi Tenancy

The API is "multi tenant ready" and can be modified to accommodate specific tenancy patterns:

- Single Tenant per platform deployment: Organization model could be removed.
- Basic Multi Tenancy: Each request will result in a "Default" organization to be set. This can be overriden using the "Organization" header.
- Managed Multi Tenancy: Manually add new organizations in the "Organizations" CRUD UI in the dashboard. Suitable for smaller enterprise use cases.
- Self Serve Multi Tenancy; Requires changes to the register mechanism to create a new Organization for each signup. Suitable for broad SaaS.
- Advanced Multi Tenancy; Allow users to self signup and also be invited into multiple organizations. Requires expaning the user model and invite mechanism to allow for multiple organizations.

Example Create API call with multi tenancy enabled:

```js
const { authenticate, fetchUser } = require('../lib/middleware/authenticate');
const { requirePermissions } = require('../utils/middleware/permissions');

router
  .use(authenticate({ type: 'user' }))
  .use(fetchUser)
  // Only allow access to users that have write permissions for this organization
  .use(requirePermissions({ endpoint: 'collections', level: 'write', context: 'organization' }))
  .post(
    '/',
    validate({
      body: schema,
    }),
    async (ctx) => {
      const collection = await Collection.create({
        // Set the organization for each object created
        organization: ctx.state.organization,
        ...ctx.request.body,
      });
      ctx.body = {
        data: collection,
      };
    }
  );
```

## Logging

`@bedrockio/instrumentation` provides log levels via [pino](https://getpino.io/) as well as optimizations for [Google Cloud Loggin](https://cloud.google.com/logging/) which requires certain fields to be set for http logging.

The http logging is center to rest api logging, as all executed code (besides a few exeptions like scripts/jobs) are executed in the context of a http request. Making it important to be able to "trace" (https://cloud.google.com/trace/) the log output to a given request.

By default the log level in `development` is set to trace, but can be overwritten via env flags (LOG_LEVEL).

Within a Koa request prefer `ctx.logger` as this provides extra logging specific to HTTP requests, otherwise use:

```
const { logger } = require('@bedrockio/instrumentation');

// Inside job, etc.
logger.info("something")

```

## Auto-generating API Documentation

Good API documentation needs love, so make sure to take the time to describe parameters, create examples, etc.

There's a script that automatically generates an OpenAPI definition for any added routes.

Run:

```
node scripts/generate-openapi.js
```

The format in `src/routes/__openapi__` is using a slimmed down version of the OpenAPI spec to make editing easier. API calls can be defined in the `paths` array and Object definitions can be defined in the `objects` array.

Here's an example of an API call definition:

```json
{
  "method": "POST",
  "path": "/login",
  "requestBody": [
    {
      "name": "email",
      "description": "E-mail address of the user trying to log in",
      "required": true,
      "schema": {
        "type": "string",
        "format": "email"
      }
    },
    {
      "name": "password",
      "description": "Password associated with the e-mail address",
      "required": true,
      "schema": {
        "type": "string"
      }
    }
  ],
  "responseBody": [
    {
      "name": "data.token",
      "description": "JWT token that can be used to authenticate user",
      "schema": {
        "type": "string"
      }
    }
  ],
  "examples": [
    {
      "name": "A new login from John Doe",
      "requestBody": {
        "email": "john.doe@gmail.com",
        "password": "AN$.37127"
      },
      "responseBody": {
        "data": {
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZTZhOWMwMDBmYzY3NjQ0N2RjOTkzNmEiLCJ0eXBlIjoidXNlciIsImtpZCI6InVzZXIiLCJpYXQiOjE1ODk1NjgyODQsImV4cCI6MTU5MjE2MDI4NH0.I0DhLK9mBHCy8sJglzyLHYQHFfr34UYyCFyTaEgFFG"
        }
      }
    }
  ]
}
```

All information in `src/routes/__openapi__` is exposed through the API and used by the Markdown-powered documentation portal in `/services/web/src/docs`.

See [../../services/web](../../services/web) for more info on customizing documentation.

## CURL examples

```bash
curl -s -X POST http://localhost:3300/1/events \
-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInR5cGUiOiJ1c2VyIiwia2lkIjoidXNlciIsImlhdCI6MTYwMTg4ODEyOSwiZXhwIjoyNjQzMjg4OTI5fQ.50yZwfOMlyFcFZTWR1ptre1yHxwhR59U8PgPCd9ZcW8' \
-H 'Content-Type: application/json' \
-d '{"collectionId": "606078c674e2fb4edf19075b", "events":[{"test":"me", "type": "click", "occurredAt": "2020-10-12T12:17:01.341Z" }, {"test": "you", "field2": "additional", "type": "login", "occurredAt": "2020-10-12T12:17:01.341Z"}]}' | jq
```
Result:
```json
{
  "batch": {
    "collectionId": "606078c674e2fb4edf19075b",
    "ingestedAt": "2021-04-01T15:13:23.562Z",
    "numEvents": 2,
    "minOccurredAt": "2020-10-12T12:17:01.341Z",
    "maxOccurredAt": "2020-10-12T12:17:01.341Z",
    "memorySize": "146 bytes",
    "hash": "0K4ZQ3BTGEtkggz6RRx2FnX3eJ0UMPttBzdXmIJcjRM=",
    "createdAt": "2021-04-01T15:13:23.616Z",
    "updatedAt": "2021-04-01T15:13:23.647Z",
    "rawUrl": "/var/folders/t9/f90dw0zs6x96js5ssqs4q8x00000gn/T/606078c674e2fb4edf190759-606078c674e2fb4edf19075b-2021-04-01-17-13-23-6065e31335b94b0a329ec57e.ndjson",
    "id": "6065e31335b94b0a329ec57e"
  }
}
```
