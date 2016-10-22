// Copyright (c) 2016 Jesús Fernández <jesus@nublar.net>

'use strict';

const rp = require('request-promise');
const debug = require('debug')('emtmad-bus-times-promise');
const _ = require('lodash');
const P = require('bluebird');

// Probably not the best way to share vars between functions in module scope. Please let me know the right way.
var globalIdClient = '';
var globalPasskey = '';

// API variables
var getIncomingBusesToStopUrl = 'https://openbus.emtmadrid.es/emt-proxy-server/last/geo/GetArriveStop.php';
var getStopsFromLocationUrl = 'https://openbus.emtmadrid.es/emt-proxy-server/last/geo/GetStopsFromXY.php';

module.exports = {
    initAPICredentials: function (idClient, passKey) {
        globalIdClient = idClient;
        globalPasskey = passKey;
    },
    getIncomingBusesToStop: function (idStop) {
        debug(`Getting incoming buses at stop ${idStop}`);
        // Entry parameters
        var formData = {
            cultureInfo: "ES",
            idStop: idStop,
            idClient: globalIdClient,
            passKey: globalPasskey
        };
        var options = {
            method: 'POST',
            uri: getIncomingBusesToStopUrl,
            form: formData,
            headers: {
                /* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
            },
            json: true // Automatically stringifies the body to JSON
            // TODO is there an option for not checking the cert?
        };

        return rp(options).then(function (body) {
            return _.get(body, 'arrives', []);
        });
    },
    getStopsFromLocation: function (location, radius) {
        debug(`Getting stops in a radius of ${radius}m near ${location.latitude},${location.longitude}`);
        if ((location.latitude === 0 && location.longitude === 0) || radius < 1) {
            // There will never be a bus from the EMT here :)
            debug('Empty location. Not calling the EMT API');
            return P.resolve([]);
        }
        // Entry parameters
        var formData = {
            cultureInfo: "ES",
            idClient: globalIdClient,
            passKey: globalPasskey,
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
