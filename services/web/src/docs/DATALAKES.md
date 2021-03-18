# Datalakes API

This API allows you to manage Datalake objects.

## Datalake Object

Information about a Datalake.

objectSummary({name: 'Datalake'})

## Create Datalake

Create a new datalake object. Requires admin permissions.

callSummary({method: 'POST', path: '/1/datalakes'})

## Get Datalake

Obtain datalake object by unique datalake ID.

callSummary({method: 'GET', path: '/1/datalakes/:datalakeId'})

## List and Search Datalakes

List datalakes and filter by certain attributes. Requires admin permissions.

callSummary({method: 'POST', path: '/1/datalakes/search'})

## Update Datalake

Update datalake information by ID. Requires admin permissions.

callSummary({method: 'PATCH', path: '/1/datalakes/:datalakeId'})

## Delete Datalake

Delete datalake by ID. Requires admin permissions.

callSummary({method: 'DELETE', path: '/1/datalakes/:datalakeId'})
