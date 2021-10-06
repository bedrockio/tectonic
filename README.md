# Tectonic Platform

More documentation about specific services and components can be found in the following sections:

- [services/api](services/api) - Data API and data model layer that powers all applications
- [services/web](services/web) - Web application and administration dashboard

## Quick Start

Using Docker Compose you can build and run all services and dependencies as follows:

```bash
docker-compose up
```

Open the dashboard at http://localhost:3200/ - Admin login credentials can be seen in the API output.

## Local development

Steps to run the full stack locally:

#### 1) Make sure to have MongoDB and Elasticsearch running

Optinally run as docker containers:

```bash
# create local data folders for mongo and ES
sudo mkdir /root/data
sudo mkdir /root/esdata
chmod 777 -R /root/esdata

# run docker containers for mongo and ES
docker run --name mongo -d -p 27017:27017 -v /root/data:/data/db mongo:5.0.1
docker run --name elasticsearch -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -v /root/esdata:/usr/share/elasticsearch/data elasticsearch:7.12.0
```

#### 2) Start API service

```bash
cd services/api
yarn install
yarn start

# Note: Reload fixtures with:
# ./scripts/fixtures/reload
```

#### 3) Start Elasticsearch Pubsub sink worker

```bash
cd services/api
yarn elasticsearch-sink:start
```

#### 4) Start Web service

```bash
cd services/web
yarn install
yarn start
```

#### 5) Publish fixture events for the `bar-purchases` collection:

```bash
cd services/api
node scripts/publish-fixture-events.js
```

#### 6) Check Dashboard Url

Login with `admin@tectonic.io`:`tectonic.now` at [http://localhost:3200](http://localhost:3200)

### API Documentation

Full portal with examples:

http://localhost:3200/docs/getting-started

Code documentation:

[services/api](services/api)

### Web Documentation

[services/web](services/web)

## Releases

In order to release a new Tectonic version, you need to create a `release` on github with an incremented version tag, e.g., `v1.0.1`, `v1.2.4`, `v2.0.0`, and release notes. Next you can checkout the release branch locally:

```bash
git pull origin master
git checkout v1.0.1
```

On this branch you can build the images and push the images to Docker Hub as follows:

```bash
bedrock cloud build # select all services
./docker-push all 1.0.1 # pass the branch/release version, without the `v` prefix
```

### Release latest tag

To push the latest tag from the master branch and not a specific release version:

```bash
bedrock cloud build # select all services
./docker-push # pushes all services with the 'latest' tag
./docker-push api # pushes only the api service with the 'latest' tag
./docker-push api latest # same as above
```
