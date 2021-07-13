# Guide

This guide will make you familiar with the core concepts, API and React widgets.

# Core Concepts
  - [Events](#events)
  - [Collections](#collections)
  - [Authorization (policies and credentials)](#authorization)
  - [Querying Analytics](#querying-analytics)
  - [Widgets](#widgets)

## Events

```json
{
  "id":"606efb3dee05960772e6cddb",
  "occurredAt":"2018-03-20T15:30:46.000Z",
  ...
}
```

## Collections

A Collection can store batches of Events. Here's an example of inserting a batch of events, which requires a `collection` field with the id or name of the collection, and an `events` array where each event element requires an `occurredAt` field:

```json
{
  "collection": "bar-purchases",
  "events": [
    {
      "id":"606efb3dee05960772e6cddb",
      "sourceSystem":"upserve",
      "venue": {
        "name":"Pirate Boozy Bar",
        "address":"650 Gough St, San Francisco, CA 94102"
      },
      "customer": {
        "name":"Melissa Spencer"
      },
      "server": {
        "name":"Kathryn Bernier"
      },
      "consumption": {
        "id":"606efb3cee05960772e6cda3",
        "name":"Open Food",
        "price": 10,
        "category":"Food",
        "createdAt":"2019-12-08T13:24:52.000Z"
      },
      "amountPaid":12,
      "orderedAt":"2018-03-20T15:30:46.000Z",
      "occurredAt":"2018-03-20T15:30:46.000Z"
    }
  ]
}
```
​​
```bash
curl -s -XPOST -d '{"collection": "bar-purchases", "events": [{"id":"606efb3dee05960772e6cddb","sourceSystem":"upserve","venue":{"name":"Pirate Boozy Bar","address":"650 Gough St, San Francisco, CA 94102"},"customer":{"name":"Melissa Spencer"},"server":{"name":"Kathryn Bernier"},"consumption":{"id":"606efb3cee05960772e6cda3","name":"Open Food","price":0,"category":"Food","createdAt":"2019-12-08T13:24:52.000Z"},"amountPaid":1,"occurredAt":"2018-03-20T15:30:46.000Z"}]}' <API_URL>/1/events -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```

If an event has an `id` or `_id` field it will update the same (ES) event if you ingest it a second time. If you have both fields, then `_id` takes precedence.

## Authorization

JWT is used for all authentication. You can provide your API token in a standard bearer token request (`Authorization: Bearer <token>`) like so:

```bash
curl -H 'Authorization: Bearer <ADMIN_TOKEN>' <API_URL>/
```

Your API token is associated with one of three types of credentials:
1. Application Credential
2. Access Credential
3. User (admin) Credential (Used to login and interact with the dashboard Web UI)

Application and User (admin) credentials give full access to all API endpoints.

Access credentials are required to query analytics. See `Querying Analytics` down below.

## Querying Analytics


## Widgets