# Guide

This guide will make you familiar with the core concepts, API and React widgets.

# Core Concepts
  - [Events](#events)
  - [Collections](#collections)
  - [Batches](#batches)
  - [Credentials](#credentials)
  - [Access Policies](#access_policies)
  - [Analytics](#analytics)
  - [Widgets](#widgets)

## Events

At the core, Tectonic ingests `events` that have no schema restrictions or requirements. We do recommend an `id` or `_id` field if you want to update the same event (or reingest) in the future. If you have both fields, then `_id` takes precedence.

For timeseries events we recommend a timestamp (.e.g., `occurredAt`) on each event, alternatively you can rely on the `ingestedAt` timestamp that will be added during ingestion.

**Event:**
```json
{
  "id":"606efb3dee05960772e6cddb", // optional
  "occurredAt":"2018-03-20T15:30:46.000Z", // optional
  ...
}
```

## Collections

Events belong to a `collection` and are ingested in `batches`. You can view a collection as an abstraction on top of one (or more) Elasticsearch indices, as all events are inserted into Elasticsearch for querying analytics.

Before you can ingest batches of events, you first need to create a collection. An example collection called `bar-purchases` is available as a fixture and loaded with sample events when a new Tectonic instance is created.

We recommend setting the collection `timeField`, which is the name of the field which contains the date in each time series event.

**Collection:**
```json
{
  "name": "bar-purchases", // Needs to be unique
  "description": "Example data from a cocktail bar's point-of-sale system",
  "timeField": "orderedAt"
}
```

You can create new collections with a `POST` or `PUT` to `<API_URL>/1/collections`, where the `name` needs to be unique and not alredy exist on a `POST`. `PUT` will update the existing collection or create a new one. (The [authorization token](#credentials) is covered later on.)

**> Create Collection:**
```bash
curl -s -XPUT -d '{"name": "bar-purchases","description": "UPDATED Example data from a cocktail bar\'s point-of-sale system","timeField":"orderedAt"}' <API_URL>/1/collections -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```
*Response:*
```json
{
  "data": {
    "name":"bar-purchases",
    "description":"UPDATED Example data from a cocktail bar's point-of-sale system",
    "timeField": "orderedAt",
    "createdAt":"2021-06-23T10:24:38.805Z",
    "updatedAt":"2021-06-23T10:24:38.805Z",
    "id":"60d30be6f499a3e117542ebb"
  }
}
```

<br>*Check the [collections](/docs/collections) API docs for the full specification.*

## Batches

Events are ingested into a collection in batches. Each batch requires a `collection` field with the `id` or `name` of the collection, and an `events` array holding one or more event objects.

**Batch:**
```json
{
  "collection": "bar-purchases", // Alternatively the collectionId
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

Events are ingested by posting a batch to the <API_URL>/1/events endpoint.

**Ingest Batch of Events​​:**
```bash
curl -s -XPOST -d '{"collection": "bar-purchases", "events": [{"id":"606efb3dee05960772e6cddb","sourceSystem":"upserve","venue":{"name":"Pirate Boozy Bar","address":"650 Gough St, San Francisco, CA 94102"},"customer":{"name":"Melissa Spencer"},"server":{"name":"Kathryn Bernier"},"consumption":{"id":"606efb3cee05960772e6cda3","name":"Open Food","price":0,"category":"Food","createdAt":"2019-12-08T13:24:52.000Z"},"amountPaid":1,"occurredAt":"2018-03-20T15:30:46.000Z"}]}' <API_URL>/1/events -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```

*Response:*

```json
{
  "data": {
    "collectionId":"60d30be6f499a3e117542ebb",
    "ingestedAt":"2021-07-16T13:45:45.094Z",
    "numEvents":1,
    "memorySize":"414 bytes",
    "hash":"CEBg8M1YMpVMW7PGp7OzzLVFn2Hu9RQzlOInRam6ZHk=",
    "author": {
      "type":"user",
      "id":"60d30be6f499a3e117542eb9"
    },
    "createdAt":"2021-07-16T13:45:45.097Z",
    "updatedAt":"2021-07-16T13:45:45.131Z",
    "rawUrl":"/var/folders/t9/f90dw0zs6x96js5ssqs4q8x00000gn/T/60d30be6f499a3e117542ebb-2021-07-16-15-45-45-60f18d89468287992b8f82a4.ndjson",
    "id":"60f18d89468287992b8f82a4"
  }
}
```

<br>*Check the [batches](/docs/batches) API docs for the full specification.*

## Credentials

JSON Web Tokens (JWT) are used for authentication. You provide your token in a standard bearer token request (`Authorization: Bearer <token>`) as follows, where the `token` is replaced with your current logged-in admin user token (and is used in all other curl examples in this guide):

```bash
curl -H 'Authorization: Bearer <ADMIN_TOKEN>' <API_URL>/
```

Your token is associated with one of three types of credentials:
1. **User Credential**: Used to login and interact with the dashboard Web UI.
2. **Application Credential**: Used to give applications and systems full API access.
3. **Access Credential**: Used to give scoped access to analytics.

User (admin) and application credentials give full access to all API endpoints.

The `access credentials` are used to give [react-tectonic](https://www.npmjs.com/package/react-tectonic) widgets access to collections for querying event analytics. An `access credential` is linked to an `access policy`, and together define the access rules and scope for collections. Before we can create an `access credential`, we first need to create an `access policy`.

## Access Policies

An `access policy` has a `name` and a list of `collections` with per collection defined `permission`, `scope`, `scopeFields`, `includeFields` and/or `excludeFields`.

- `permission`: Can be `read` or `read-write`, where the second option allows posting new event batches for ingestion. Permission is optional and defaults to `read`.
- `scope`: Is a static default query that is always added to all analytics queries. In the example below it means you will only query data for events with the venue name "Pirate Boozy bar". Scope is optional.
- `scopeFields`: Is a list of fields for which a value has to be supplied by the `access credential` (see `scopeValues` down below) that is using the `access policy`. In the example below, the `access credential` needs to supply a value for the server's name. This field and value are also added to the scope, i.e. default query, for every analytics query made using an `access credential` with this `access policy`.
- `includeFields`: Defines the fields included in the result queries. Default is all fields.
- `excludeFields`: Defines the fields excluded in the query results. In the example below, the `event.id` and `customer` are excluded from search queries.

**Access Policy:**

```json
{
  "name": "bar-purchases-collection-access-example",
  "collections": [
    {
      "collection": "bar-purchases", // Alternatively the collectionId
      "permission": "read", // optional. Defaults to 'read', other option is read-write
      "scope": { // optional
        "event.venue.name": "Pirate Boozy Bar"
      },
      "scopeFields": ["event.server.name"], // optional
      "excludeFields": ["event.id", "customer"] // optional
    }
  ]
}
```

**> Create Access Policy:**

```bash
curl -s -XPUT -d '{"name": "bar-purchases-collection-access-example","collections":[{"collection": "bar-purchases","permission":"read","scope": {"event.venue.name":"Pirate Boozy Bar"},        "scopeFields":["event.server.name"],"excludeFields":["event.id","customer"]}]}' <API_URL>/1/access-policies -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```
*Response:*

```json
{
  "data": {
    "name":"bar-purchases-collection-access-example",
    "collections": [
      {
        "permission":"read",
        "scopeFields":["event.server.name"],
        "includeFields":[],
        "excludeFields":["event.id","customer"],
        "collection":"60d30be6f499a3e117542ebb",
        "scope":{"event.venue.name":"Pirate Boozy Bar"}
      }
    ],
    "createdAt":"2021-07-16T20:35:42.326Z",
    "updatedAt":"2021-07-16T20:35:42.326Z",
    "id":"60f1ed9e51f585b1e956ffeb"
  }
}
```

In order to create an `access credential` for the above `access policy`, it requires `scopeValues` for the field `event.server.name`, as defined by the `scopeFields` in the `access policy`. In the example below, the value for the server's name is "Kathryn Bernier". You can create other access credentials with different values, e.g., "Katie Smith". The query results and analytics will only include events that belong to the provided server name.

**Access Credential:**
```json
{
  "name": "bar-purchases-restricted-access",
  "accessPolicy": "bar-purchases-collection-access-example", // Alternatively the accessPolicyId
  "scopeValues": [
    {
      "field": "event.server.name", // required as defined by accessPolicy scopeFields
      "value": "Kathryn Bernier"
    }
  ]
}
```

**> Create Access Credential:**

```bash
curl -s -XPUT -d '{"name": "bar-purchases-restricted-access","accessPolicy":"bar-purchases-collection-access-example","scopeValues":[{"field": "event.server.name","value":"Kathryn Bernier"}]}' <API_URL>/1/access-credentials -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```

*Response:*

```json
{
  "data": {
    "name":"bar-purchases-restricted-access",
    "accessPolicy":"bar-purchases-collection-access-example",
    "scopeValues":[{"field":"event.server.name","value":"Kathryn Bernier"}],
    "createdAt":"2021-07-16T21:11:53.149Z",
    "updatedAt":"2021-07-16T21:19:57.154Z",
    "id":"60f1f61973bc06b62eac32e6",
    "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVkZW50aWFsSWQiOiI2MGYxZjYxOTczYmMwNmI2MmVhYzMyZTYiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjI2NDcwMzk3fQ.HpYepOqcBtAOElv769os50NExT1CORy-uStVELADDLw"
  }
}
```

When you create an `access credential` you will receive a token in the response.

<br>*Check the [credentials](/docs/credentials) and [access-policies](/docs/access_policies) API docs for the full specification*

## Analytics

You can query analytics with a `user credential` or `application credential`, which gives full access. Or you use an `access credential` with optional collection and scope restrictions as explained in the previous section.

There are five analytics query options:
- Terms
- Timeseries
- Stats
- Cardinality
- Search

Each analytics POST endpoint requires a `collection`, which can be either the collection's name or ID.

**> Analytics Search:**
```bash
curl -s -XPOST -d '{"collection":"bar-purchases","filter":{"size": 1},"debug":true}' <API_URL>/1/analytics/search -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json"
```

*Response:*

```json
{
  "meta": {
    "searchQuery": {
      "index": "tectonic-collection-60d30be6f499a3e117542ebb",
      "body": {
        "sort": [
          {
            "ingestedAt": {
              "order": "desc"
            }
          }
        ],
        "from": 0,
        "size": 1
      }
    },
    "total": 5257,
    "took": 3
  },
  "data": [
    {
      "_id": "606efb40ee05960772e6d03f",
      "_source": {
        "collectionId": "60d30be6f499a3e117542ebb",
        "batchId": "60ed611921b0b5746956764f",
        "ingestedAt": "2021-07-13T09:47:05.573Z",
        "event": {
          "id": "606efb40ee05960772e6d03f",
          "sourceSystem": "upserve",
          "venue": {
            "name": "Pirate Boozy Bar",
            "address": "650 Gough St, San Francisco, CA 94102"
          },
          "customer": {
            "name": "Rosario Jacobi"
          },
          "server": {
            "name": "Kathryn Bernier"
          },
          "consumption": {
            "id": "606efb3cee05960772e6cd98",
            "name": "House shot",
            "price": 800,
            "category": "Cocktail",
            "createdAt": "2019-10-08T12:58:52.000Z"
          },
          "amountPaid": 4000,
          "orderedAt": "2018-12-04T02:25:42.000Z",
          "_id": "606efb40ee05960772e6d03f",
          "occurredAt": "2018-12-04T02:25:42.000Z"
        }
      }
    }
  ]
}
```

The `debug:true` parameter will return the `searchQuery` in the `meta` field of the JSON response. In the meta fields you can also find the `total` and time it `took`. The `data` field is an array that holds all document hits ({_id, _source}).


<br>*Check the [analytics](/docs/analytics) API docs for the full specification.*

## Widgets

- Aggregations
- Components
- Visualizations


```html
 <TectonicProvider
   token=<ADMIN_TOKEN>
   primaryColor="#247870"
   collection="monitoring-events"
   dateField="event.occurredAt"
 >
   <React.Fragment>
     <TimeRangePicker
       renderButton={(label, handleOnClick) => (
         <Button icon="clock" content={label} onClick={handleOnClick} />
       )}
     />
     <AggregateTimeSeries field={`event.venue.name`} interval="1m">
       <SeriesChart
         title="Venues"
         chartType="area"
         height={250}
         valueField="value"
       />
     </AggregateTimeSeries>
   </React.Fragment>
 </TectonicProvider>
```