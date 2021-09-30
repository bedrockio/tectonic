#!/bin/bash
echo "" > /service/crontab.log

echo "=> Waiting for mongo:27017"
./scripts/wait-for-it.sh 'mongo:27017' -t 60
echo "=> Waiting for elasticsearch:9200"
./scripts/wait-for-it.sh 'elasticsearch:9200' -t 120

# elasticsearch status is fetched and retried after 60 seconds of sleep
./scripts/elasticsearch-status

./scripts/fixtures/load
./scripts/initialize-pubsub

node ./scripts/publish-fixture-events.js

echo "" > /service/.motd
echo "Welcome to the API CLI pod. All API code is available here." >> /service/.motd
echo "" >> /service/.motd
echo "Example commands:" >> /service/.motd
echo "  export                                         # Check env variables" >> /service/.motd
echo "  curl api:3300/1/status                         # See API status" >> /service/.motd
echo "  curl elasticsearch:9200/_cat/indices           # List Elasticsearch indices" >> /service/.motd
echo "  curl elasticsearch:9200/_cluster/health | jq   # Elasticsearch cluster health" >> /service/.motd
echo "  ./scripts/fixtures/load                        # Load DB fixtures" >> /service/.motd
echo "  ./scripts/fixtures/reload                      # Drop DB and load fixtures (dev/staging only)" >> /service/.motd
echo "" >> /service/.motd
echo "cat /service/.motd" >> /root/.bashrc
tail -n 10000 -f /service/crontab.log
