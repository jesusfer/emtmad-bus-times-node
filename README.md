# node-emtmad-bus-promise

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![codecov](https://codecov.io/gh/jesusfer/node-emtmad-bus-promise/branch/master/graph/badge.svg)](https://codecov.io/gh/jesusfer/node-emtmad-bus-promise)
[![Dependency Status][depstat-image]][depstat-url]
[![Dev Dependency Status][devdepstat-image]][devdepstat-url]

Node.js module to access services from the public API of the Public Transport Authority of Madrid, Spain (EMT).

This module is a fork of https://github.com/alvaroreig/emtmad-bus-times-node that returns Promise objects instead of doing sync calls to the EMT API.

## API Access

Request access to the API at http://opendata.emtmadrid.es/Formulario. You will be given a Client ID and a Passkey.

## Installation

node-emtmad-bus-promise is packaged using NPM. Just require the package inside your code:

```js
var EMTAPI = require('node-emtmad-bus-promise');
```

## Initializing the API

In order to use this API you need to set two environment variables with your Client ID and Passkey. These variables need to be set before using require on the module.

```sh
EMT_APP_ID = <your client id>
EMT_PASSKEY = <your passkey>
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

## Usage: get stops of a line

Call the function getStopsLine(line, direction) and a Promise will be returned that fulfills to the whole of object returned by the EMT API. Since this query is pretty time consuming, the results are cached per line/direction combination to speed up things.

```js
    let line = "118"; // line should be the lineId and not the label of the line
    let direction = 1; // lines have two directions represented either by: 1 or 2

    EMTAPI.getStopsLine(line, direction)
        .then(function (results) {
            // do something
        })
        .catch(function (error) {
            resolve(`Error: ${error}`);
        });

```

The object is described in the EMT API and looks like this:

```js
{
    lineId: 516, // Line Id
    label: 'N16', // Label for this line
    destination: 'TEXT', // Destination of line
    incidents: 0 // 0: No incidents, 1: Incidents
    stop: [] // List of Stop
    line: [] // List of Line
}
```

## Further reading

The objects returned in this API are exactly the same as the EMT API. A comprehensive documentation of the objects returned by the EMT API can be downloaded in the following link: http://opendata.emtmadrid.es/Documentos/Opendata-v-1-12.aspx

## Development

Do you want to contribute? Great! Pull requests are more than welcome.

[travis-image]: https://travis-ci.org/jesusfer/node-emtmad-bus-promise.svg?branch=master
[travis-url]: https://travis-ci.org/jesusfer/node-emtmad-bus-promise

[npm-url]: https://npmjs.org/package/node-emtmad-bus-promise
[npm-image]: https://img.shields.io/npm/v/node-emtmad-bus-promise.svg

[depstat-url]: https://david-dm.org/jesusfer/node-emtmad-bus-promise
[depstat-image]: https://img.shields.io/david/jesusfer/node-emtmad-bus-promise/master.svg

[devdepstat-url]: https://david-dm.org/jesusfer/node-emtmad-bus-promise#info=devDependencies
[devdepstat-image]: https://img.shields.io/david/dev/jesusfer/node-emtmad-bus-promise/master.svg
