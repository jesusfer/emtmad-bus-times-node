// Copyright (c) 2016 Jesús Fernández <jesus@nublar.net>

'use strict';

const rp = require('request-promise');
const debug = require('debug')('emtmad-bus-times-promise');
const _ = require('lodash');
const P = require('bluebird');

var EMT_ID_CLIENT = process.env.EMT_APP_ID;
var EMT_PASSKEY = process.env.EMT_PASSKEY;

// API variables
var getIncomingBusesToStopUrl = 'https://openbus.emtmadrid.es/emt-proxy-server/last/geo/GetArriveStop.php';
var getStopsFromLocationUrl = 'https://openbus.emtmadrid.es/emt-proxy-server/last/geo/GetStopsFromXY.php';

module.exports = {
    /*
    * Given the ID of a bus stop, get the buses arriving to it.
    * Returns a Promise object that fulfills to an array of arriving buses.
    */
    getIncomingBusesToStop: function (idStop) {
        debug(`Getting incoming buses at stop ${idStop}`);
        var formData = {
            cultureInfo: "ES",
            idStop: idStop,
            idClient: EMT_ID_CLIENT,
            passKey: EMT_PASSKEY
        };
        var options = {
            method: 'POST',
            uri: getIncomingBusesToStopUrl,
            form: formData,
            headers: {
                /* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
            },
            json: true // Automatically stringifies the body to JSON
        };

        return rp(options).then(function (body) {
            return _.get(body, 'arrives', []);
        });
    },
    /*
    * Given a location object and a search radius, find the stops closer to the user.
    * Returns a Promise object that fulfills to an array of Stops.
    */
    getStopsFromLocation: function (location, radius) {
        debug(`Getting stops in a radius of ${radius}m near ${location.latitude},${location.longitude}`);
        if ((location.latitude === 0 && location.longitude === 0) || radius < 1) {
            // There will never be a bus from the EMT here :)
            debug('Empty location. Not calling the EMT API');
            return P.resolve([]);
        }
        var formData = {
            cultureInfo: "ES",
            idClient: EMT_ID_CLIENT,
            passKey: EMT_PASSKEY,
            latitude: location.latitude,
            longitude: location.longitude,
            Radius: radius
        };
        var options = {
            method: 'POST',
            uri: getStopsFromLocationUrl,
            form: formData,
            headers: {
                /* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
            },
            json: true // Automatically stringifies the body to JSON
        };

        return rp(options).then(function (body) {
            return _.get(body, 'stop', []);
        });
    }
};
