# Mongo to Tectonic

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

- `MONGO_URI` - MongoDB URI (source) to connect to, defaults to `mongodb://localhost/tectonic_dev`
- `MONGO_COLLECTIONS_TO_INDEX` - MongoDB collections to index and collect in Tectonic
- `MONGO_COLLECTIONS_TO_INDEX_HISTORICAL` - Collects versioned (based on MONGO_VERSION_FIELD) documents
- `MONGO_UPDATED_AT_FIELD` - Sets the updated at field to check updates against (Default: `updatedAt`)
- `MONGO_INDEXER_INTERVAL_SECONDS` - The indexer interval (Default 30 seconds)
- `MONGO_EXCLUDE_ATTRIBUTES` - Exlude collection fields from being collected, e.g., "users.email,users.hashedPassword"
- `MONGO_VERSION_FIELD` - MongoDB version field (Default: `__v`)
- `TECTONIC_URL` - Tectonic URL
- `TECTONIC_APPLICATION_TOKEN` - The Tectonic Application token to give access to Tectonic ingestion
- `TECTONIC_COLLECTION_PREFIX` - Tectonic Collection prefix

## Deployment

See [mongo-to-tectonic-deployment.yml](mongo-to-tectonic-deployment.yml) for the Kubernetes deployment file.