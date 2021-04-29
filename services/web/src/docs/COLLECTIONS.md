# Collections API

This API allows you to manage Collection objects.

## Collection Object

Information about a Collection.

objectSummary({name: 'Collection'})

## Create Collection

Create a new collection object. Requires admin permissions.

callSummary({method: 'POST', path: '/1/collections'})

## Get Collection

Obtain collection object by unique collection ID.

callSummary({method: 'GET', path: '/1/collections/:collectionId'})

## List and Search Collections

List collections and filter by certain attributes. Requires admin permissions.

callSummary({method: 'POST', path: '/1/collections/search'})

## Update Collection

Update collection information by ID. Requires admin permissions.

callSummary({method: 'PATCH', path: '/1/collections/:collectionId'})

## Delete Collection

Delete collection by ID. Requires admin permissions.

callSummary({method: 'DELETE', path: '/1/collections/:collectionId'})
