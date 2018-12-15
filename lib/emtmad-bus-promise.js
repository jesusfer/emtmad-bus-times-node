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
var stopCache = {};

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
    debug(`handleAPIError->New request to ${options.uri}`);
    return rp(options)
        .catch(function (response) {
            debug(`handleAPIError->Request took ${response.timingPhases.total | 0}ms`);
            if (response.statusCode != 200) {
                debug(`handleAPIError->API Error: ${response.statusCode}`);
                return P.reject(Error(`Technical issue: ${response.statusCode}`));
            }
            return P.reject(Error(`Technical issue: ${response}`));
        })
        .then(function (response) {
            debug(`handleAPIError->API successful response: ${response.statusCode}`);
            debug(`handleAPIError->Request took ${response.timingPhases.total | 0}ms`);
            var body = JSON.parse(response.body);
            var returnCode = parseInt(body.ReturnCode);
            if (Array.isArray(body) && body.length === 1 && !body[0]) { // 
                // Empty response from the API. body is [ false ]; This is actually not an error
                debug('handleAPIError->API Empty response')
                return P.resolve(false);
            } else if (returnCode != NaN && returnCode > 1) {
                // returnCode is an error. body contains the error.
                debug(`handleAPIError->API Error #${returnCode}: ${body.Description}`)
                return P.reject(Error(`API Error #${returnCode}: ${body.Description}`));
            }
            return P.resolve(body);
        });
}

function doesStopExist(idStop) {
    // idStop must be an integer
    var idStopInt = parseInt(idStop);
    if (isNaN(idStopInt)) {
        return P.reject(Error(`Invalid stop ID: ${idStop}`));
    }

    if (_.has(stopCache, idStopInt)) {
        debug(`doesStopExist->Cached stop existence: ${idStopInt}`);
        return Promise.resolve(true);
    }

    return getNodesLines([idStop])
        .then(function (stops) {
            if (stops.length === 1) {
                debug(`doesStopExist->Stop exists: ${idStopInt}`);
                _.set(stopCache, idStopInt, true);
                return true;
            }
            else {
                debug(`doesStopExist->Stop does not exist: ${idStopInt}`);
                return P.reject(false);
            }
        });
}

/*
 * Given the ID of a bus stop, get the buses arriving to it.
 * Returns a Promise object that fulfills to an array of arriving buses.
 */

function getIncomingBusesToStop(idStop) {
    debug(`getIncomingBusesToStop->Getting incoming buses at stop ${idStop}`);
    var formData = {
        cultureInfo: "ES",
        idStop: idStop,
        idClient: EMT_ID_CLIENT,
        passKey: EMT_PASSKEY
    };
    var options = {
        method: 'POST',
        uri: getIncomingBusesToStopUrl,
        form: formData
    };

    // There is no way to understand from the API if the stop does not exist or if there are no buses arriving
    // Make a request first to make sure the stop exists with EMT:/bus/GetNodesLines.php and then get incoming buses
    return doesStopExist(idStop)
        .then(function () {
            return handleAPIError(options)
                .then(function (body) {
                    return _.get(body, 'arrives', []);
                })
        })
        .catch(function (error) {
            return P.reject(Error(`Stop ${idStop} not found: ${error}`));
        });
}
/*
 * Given a location object and a search radius, find the stops closer to the user.
 * Returns a Promise object that fulfills to an array of Stops.
 */
function getStopsFromLocation(location, radius) {
    debug(`getStopsFromLocation->Getting stops in a radius of ${radius}m near ${location.latitude},${location.longitude}`);
    if ((location.latitude === 0 && location.longitude === 0) || radius < 1) {
        // There will never be a bus from the EMT here :)
        debug('getStopsFromLocation->Empty location. Not calling the EMT API');
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
        form: formData
    };

    return handleAPIError(options)
        .then(function (body) {
            return _.get(body, 'stop', []);
        });
}
/*
 * Given a location object and a search radius, find the stops closer to the user.
 * Returns a Promise object that fulfills to an array of Stops.
 */
function getStopsLine(line, direction = false) {
    debug(`getStopsLine->Line ${line} direction ${direction}`);
    const cacheKey = `${line}/${direction}`;
    if (_.has(lineDirectionCache, cacheKey)) {
        debug('getStopsLine->Results in the cache');
        return Promise.resolve(_.get(lineDirectionCache, cacheKey, {}));
    }

    var formData = {
        cultureInfo: "ES",
        idClient: EMT_ID_CLIENT,
        passKey: EMT_PASSKEY,
        line: line
    };
    if (direction) {
        if (direction !== "1" && direction !== "2") {
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
                return P.reject(Error('Line not found'));
            }
            _.set(lineDirectionCache, cacheKey, body);
            return body;
        });
}
/**
 * Returns information from a list of stops.
 * @param {Array} stops An array of stop Ids to get information from
 */
function getNodesLines(stops = []) {
    let query = "";
    let formData = {
        cultureInfo: "ES",
        idClient: EMT_ID_CLIENT,
        passKey: EMT_PASSKEY
    };
    if (stops.length > 0) {
        query = _.join(stops, '|');
        _.set(formData, 'Nodes', query);
    }
    debug(`getNodesLines->Getting stop information for: ${query}`);
    var options = {
        method: 'POST',
        uri: getNodesLinesUrl,
        form: formData,
        timeout: 240000
    };
    return handleAPIError(options)
        .then(function (body) {
            debug(`getNodesLines->Got stop information for query: ${query}`);
            if (body === false) {
                return P.reject(Error('Stop(s) not found'));
            }
            let stops = _.get(body, 'resultValues', []);
            if (!Array.isArray(stops)) {
                stops = [stops];
            }
            return stops;
        });
}
module.exports = {
    getIncomingBusesToStop,
    getStopsFromLocation,
    getStopsLine,
    getNodesLines
};

