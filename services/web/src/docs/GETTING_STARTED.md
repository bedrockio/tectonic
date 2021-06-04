# Getting Started

The <APP_NAME> API is a RESTful JSON API.

## Authorization

JWT is used for all authentication. You can provide your API token in a standard bearer token request (`Authorization: Bearer <token>`) like so:

```bash
curl -H 'Authorization: Bearer <token>' <API_URL>/
```

Your API token is associated with one of three types of credentials:
1. Application Credential
2. Access Credential
3. User (admin) Credential (Used to login and interact with the dashboard Web UI)

Application and User (admin) credentials give full access to all API endpoints.

Access credentials are required to query analytics. See `Querying Analytics` down below.

### Application Credential

You can control your cluster with your admin application credential. For example, to list all collections:
​
```bash
curl -s <API_URL>/1/collections -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```

## Inserting Events
​
A Collection can store batches of Events. Here's an example of inserting a batch of events, which requires a `collection` field with the id or name of the collection, and an `events` array where each event element requires an `occurredAt` field:
​​
```bash
curl -s -XPOST -d '{"collection": "bar-purchases", "events": [{"id":"606efb3dee05960772e6cddb","sourceSystem":"upserve","venue":{"name":"Pirate Boozy Bar","address":"650 Gough St, San Francisco, CA 94102"},"customer":{"name":"Melissa Spencer"},"server":{"name":"Kathryn Bernier"},"consumption":{"id":"606efb3cee05960772e6cda3","name":"Open Food","price":0,"category":"Food","createdAt":"2019-12-08T13:24:52.000Z"},"amountPaid":1,"occurredAt":"2018-03-20T15:30:46.000Z"}]}' <API_URL>/1/events -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```

If an event has an `id` or `_id` field it will update the same (ES) event if you ingest it a second time. If you have both fields, then `_id` takes precedence.

Currently you need to have a valid Application Credential token in the header. This will expand with (write) access credentials in the future.

## Ingesting bar-purchases events

Run ingest script:

```bash
cd servies/api
node scripts/publish-fixture-events.js
```

Reloading fixture data:

```
cd services/api
./scripts/fixtures/reload
```

_Note:This will move into the docker compose setup_
​
## Creating collections

Before you can ingest events to other collections than `bar-purchases`, you need to create them first as follows:

```bash
curl -s -XPOST -d '{"name": "power-meter-values", "description": "Meter values from a power outlet"}' <API_URL>/1/collections -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```

Collection names are required to be unique and are lowercased.

## Querying Analytics
### Creating an AccessCredential
​
An AccessCredential is a unique token that you can create on behalf of your users. An AccessCredential defines which collections a user is allowed to access and what base queries are set for a given collection. An AccessCredential comes with a JSON Web Token so that direct access from the app-side can be given.

​
For example, if we wanted to create a token for the owner of the "Pirate Boozy Bar", we'd want to ensure that any analytics query always restricts the `venue.name` to `Pirate Boozy Bar`:
​

Step 1, create an AccessPolicy:
​
```bash
curl -s -XPOST -d '{"name":"bar-access-test","collections":[{"type":"read","scope":{"venue.name":"Pirate Boozy Bar"},"collectionId":"60a660940546243490caec36"}]}' <API_URL>/1/access-policies -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```
​
Step 2, create an AccessCredential (this can be done for every user):
​
```bash
curl -s -XPOST -d '{"name": "test-user", "accessPolicy": "50a660940546243490caec42"}' <API_URL>/1/access-credentials -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```

This will return the new AccessCredential with a `token` field.

### Querying your Events

In order to query your events, you need a valid access credential with access to the collection you want to query.

```bash
curl -s -XPOST -d '{"collection": "bar-purchases"}' <API_URL>/1/analytics/search -H "Authorization: Bearer <access-credential>" -H "Content-Type: application/json"
```

### Advanced Access Policy

Access policies can also be used as a template with `scopeParams` that need to be passed as `scopeArgs` in the AccessCredential. This allows for user specific access credentials given one access policy. For example, you might want to have the userId act as a scope for the analytics.

Step 1, create AccessPolicy:
​
```bash
curl -s -XPOST -d '{"name":"bar-access-userid-test","collections":[{"type":"read","scope":{"venue.name":"Pirate Boozy Bar"},"scopeParams":["userId"],"collectionId":"60a660940546243490caec36"}]}' <API_URL>/1/access-policies -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```
​
Step 2, create an AccessCredential for userId 42:
​
```bash
curl -s -XPOST -d '{"name":"test-user-42","accessPolicy":"50a660940546243490caec66","scopeArgs":{"userId":42}}' <API_URL>/1/access-credentials -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```
