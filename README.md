# node-emtmad-bus-promise

Node.js module to access services from the public API of the Public Transport Authority of Madrid, Spain (EMT).

This module is a fork of https://github.com/alvaroreig/emtmad-bus-times-node that returns Promise objects instead of doing sync calls to the EMT API.

## API Access

Request access to the API at http://opendata.emtmadrid.es/Formulario

## Installation

node-emtmad-bus-promise is packaged using NPM. Just require the package inside your code:

```js
var EMTAPI = require('node-emtmad-bus-promise');
```

## Initializing the API

The first thing you need to do before using the API is calling initAPICredentials with your credentials:

```js
EMTAPI.initAPICredentials('YOUR_API_ID','YOUR_API_PASSKEY');
```

## Usage: get incoming buses to a given bus stop

Call the function getIncomingBusesToStop(busStopNumber) and a Promise will be returned that fulfills to an array of estimations:

```js
    let stop = {
        Id: 3041
    }

    EMTAPI.getIncomingBusesToStop(stop.Id)
        .then(function (arriving) {
            stop.arriving = arriving;
            resolve(stop);
        })
        .catch(function (error) {
            resolve(`Error: ${error}`);
        });

```

The array of estimations is built with Bus objects that represent an incoming bus to the specified bus stop. The most relevant attributes for each bus are:

```js
{
    "lineId": "32", // The line of the bus
    "busDistance": 9, // In meters
    "busTimeLeft": 0 // In seconds
}
```

## Usage: get stops close to a location

Call the function getStopsFromLocation(location, radius) and a Promise will be returned that fulfills to an array of stops:

```js
    let location = {
        latitude: -3.7324823992585,
        longitude: 40.377653538528
    }
    let searchRadius = 250;

    EMTAPI.getStopsFromLocation(location, searchRadius)
        .then(function (stops) {
            // do something
        })
        .catch(function (error) {
            resolve(`Error: ${error}`);
        });

```

The array of stops is built with Stop objects that look like this:

```js
{
    stopId: '2443',
    name: 'AV.ABRANTES-PZA.LASMENINAS',
    postalAddress: 'Av.deAbrantes, 106',
    longitude: -3.7324823992585,
    latitude: 40.377653538528,
    line: [Line Object]
}
```

## Further reading

The objects returned in this API are exactly the same as the EMT API. A comprehensive documentation of the objects returned by the EMT API can be downloaded in the following link: http://opendata.emtmadrid.es/Documentos/Opendata-v-1-12.aspx

## Development

Do you want to contribute? Great! Pull requests are more than welcome.
