# RESTful JSON API v1

The <APP_NAME> API is a RESTful JSON API.

### URLs

Main production API URL:

```
<API_URL>/
```

### Requests

A pragmatic RESTful style is enforced on all API calls. GET requests are only used to obtain objects.

Search/List API calls are done using POST to allow reliable JSON parameters. Example search:

```bash
curl -XPOST <API_URL>/2/users/search \
  -d '{"limit": 100, "skip": 0}' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

### Responses

A standard successful response envelope has a `data` attribute containing the result. An optional `meta` response can be given to provide supplementary information such as pagination information:

```json
{
  "data": [{}],
  "meta": {
    "total": 45367,
    "skip": 0,
    "limit": 100
  }
}
```

Mutation operations (PATCH and DELETE) may contain a `success` boolean in the response.

### Errors

Errors are returned as follows:

```json
{
  "error": {
    "message": "\"userId\" needs to be a valid ID"
  }
}
```

An additional `details` array is added for validation errors to specify which fields had errors:

```json
{
  "error": {
    "message": "\"userId\" needs to be a valid ID",
    "details": [
      {
        "message": "\"userId\" needs to be a valid ID",
        "path": ["userId"],
        "type": "string.invalidID",
        "context": {
          "value": "INVALID",
          "key": "userId",
          "label": "userId"
        }
      }
    ]
  }
}
```