// Copyright (c) 2016 Jesús Fernández <jesus@nublar.net>

'use strict';

const rp = require('request-promise');
const debug = require('debug')('node-emtmad-bus-promise');
const _ = require('lodash');
const P = require('bluebird');

var EMT_ID_CLIENT = process.env.EMT_APP_ID;
var EMT_PASSKEY = process.env.EMT_PASSKEY;

// API variables
const baseUrl = 'https://openbus.emtmadrid.es:9443/emt-proxy-server/last';
var getIncomingBusesToStopUrl = baseUrl + '/geo/GetArriveStop.php';
var getStopsFromLocationUrl = baseUrl + '/geo/GetStopsFromXY.php';
var getStopsLineUrl = baseUrl + '/geo/GetStopsLine.php';
var getNodesLinesUrl = baseUrl + '/bus/GetNodesLines.php';

var lineDirectionCache = {};

// Una función wrapper que controle errores devueltos por la API

/**
 * Handle an error condition from the EMT API.
 * Returns a promise object with the body if successfull or an error if there was an error.
 * (0) PassKey OK and authorized for period
 * (1) No PassKey necesary
 * (2) PassKey distinct than the current Passkey
 * (3) PassKey expired
 * (4) Client unauthorized
 * (5) Client deactivate
 * (6) Client locked
 * (9) Attemp to Auth Failed
 * @param {*} response 
 */
function handleAPIError(options) {
    _.set(options, 'json', false);
    _.set(options, 'resolveWithFullResponse', true);
    _.set(options, 'time', true);
    return rp(options)
        .catch(function (response) {
            debug(`Request took ${response.timingPhases.total|0}ms`);
            if (response.statusCode != 200) {
                debug(`API Error: ${response.statusCode}`);
                return P.reject(Error(`Technical issue: ${response.statusCode}`));
            }
        })
        .then(function (response) {
            debug(`API successful response: ${response.statusCode}`);
            debug(`Request took ${response.timingPhases.total|0}ms`);
            var body = JSON.parse(response.body);
            var returnCode = parseInt(body.ReturnCode);
            if (Array.isArray(body) && body.length === 1 && !body[0]) { // 
                // Empty response from the API. body is [ false ]; This is actually not an error
                debug('API Empty response')
                return P.resolve(false);
            } else if (returnCode != NaN && returnCode > 1) {
                // returnCode is an error. body contains the error.
                debug(`API Error #${returnCode}: ${body.Description}`)
                return P.reject(Error(`API Error #${returnCode}: ${body.Description}`));
            }
            return P.resolve(body);
        });
}

function doesStopExist(idStop) {
    // idStop must be an integer
    var idStop = parseInt(idStop);
    if (isNaN(idStop)) {
        return P.reject(Error("Invalid line ID"));
    }
    var formData = {
        cultureInfo: "ES",
        Nodes: idStop,
        idClient: EMT_ID_CLIENT,
        passKey: EMT_PASSKEY
    };
    var options = {
        method: 'POST',
        uri: getNodesLinesUrl,
        form: formData,
        headers: {
            /* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
        },
    };
    return handleAPIError(options)
        .then(function (body) {
            var node = _.get(body.resultValues, 'node', -1);
            if (node === -1) {
                debug('Stop does not exist');
                return P.reject(false);
            }
            debug('Stop exists');
            return true;
        });
}

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
        };

        // There is no way to understand from the API if the stop does not exist or if there are no buses arriving
        // Make a request first to make sure the stop exists with EMT:/bus/GetNodesLines.php and then get incoming buses
        return doesStopExist(idStop)
            .then(function (result) {
                return handleAPIError(options)
                    .then(function (body) {
                        return _.get(body, 'arrives', []);
                    })
            })
            .catch(function (error) {
                return P.reject(Error('Stop does not exist'));
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
        };

        return handleAPIError(options)
            .then(function (body) {
                return _.get(body, 'stop', []);
            });
    },
    /*
     * Given a location object and a search radius, find the stops closer to the user.
     * Returns a Promise object that fulfills to an array of Stops.
     */
    getStopsLine: function (line, direction = false) {
        debug(`Getting stops for line ${line} and direction ${direction}`);
        const cacheKey = `${line}/${direction}`;
        if (_.has(lineDirectionCache, cacheKey)) {
            debug('Results are in the cache');
            return Promise.resolve(_.get(lineDirectionCache, cacheKey, {}));
        }

        var formData = {
            cultureInfo: "ES",
            idClient: EMT_ID_CLIENT,
            passKey: EMT_PASSKEY,
            line: line
        };
        if (direction) {
            if (direction !== "A" && direction !== "B") {
                return P.reject(Error('Invalid direction'));
            }
            _.set(formData, 'direction', direction);
        }
        var options = {
            method: 'POST',
            uri: getStopsLineUrl,
            form: formData,
            headers: {
                /* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
            },
        };
        return handleAPIError(options)
            .then(function (body) {
                if (body === false) {
                    return P.reject(Error("Line not found"));
                }
                _.set(lineDirectionCache, cacheKey, body);
                return body;
            });
    }
};