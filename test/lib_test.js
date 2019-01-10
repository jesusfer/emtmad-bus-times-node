'use strict';

var _ = require('lodash');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised).should();
var bus;

var TIMEOUT = _.get(process.env, 'TEST_TIMEOUT', 10000);
var EMT_ID_CLIENT = process.env.EMT_APP_ID;
var EMT_PASSKEY = process.env.EMT_PASSKEY;
describe('API authentication errors', function () {
    this.timeout(TIMEOUT);

    before(function () {
        process.env['EMT_APP_ID'] = '';
        process.env['EMT_PASSKEY'] = '';
        bus = require('../lib/emtmad-bus-promise');
    });

    after(function () {
        process.env['EMT_APP_ID'] = EMT_ID_CLIENT;
        process.env['EMT_PASSKEY'] = EMT_PASSKEY;
        var name = require.resolve('../lib/emtmad-bus-promise');
        delete require.cache[name];
        name = require.resolve('../lib/config');
        delete require.cache[name];
        bus = require('../lib/emtmad-bus-promise');
    });

    describe('missing keys', function () {
        it('should return an Error', function () {
            return bus.getIncomingBusesToStop(1).should.eventually.be.rejectedWith(Error);
        });
    });
});

describe('Library functions', function () {
    this.timeout(TIMEOUT);
    describe('getIncomingBusesToStop', function () {
        // Stop 69 always should have a bus coming
        // Stop 3729 only has buses during the night
        // Stop 5376 only has buses during the day
        describe('With stop existance checking', () => {
            var check = Boolean(process.env['EMTAPI_CHECK']);
            before(function () {
                var name = require.resolve('../lib/emtmad-bus-promise');
                delete require.cache[name];
                name = require.resolve('../lib/config');
                delete require.cache[name];
                process.env['EMTAPI_CHECK'] = true;
                bus = require('../lib/emtmad-bus-promise');
            });
            after(function () {
                var name = require.resolve('../lib/emtmad-bus-promise');
                delete require.cache[name];
                name = require.resolve('../lib/config');
                delete require.cache[name];
                process.env['EMTAPI_CHECK'] = check;
                bus = require('../lib/emtmad-bus-promise');
            });
            it('should return a non empty array', function () {
                return bus.getIncomingBusesToStop(69).should.eventually.have.length.greaterThan(0);
            });
            it('should return a non empty array (cached)', function () {
                return bus.getIncomingBusesToStop(69).should.eventually.have.length.greaterThan(0);
            });
            it('should return an empty array', async function () {
                // This is ugly and there may be other cases
                var day = await bus.getIncomingBusesToStop(5376);
                var night = await bus.getIncomingBusesToStop(3729);
                var b = (day.length == 0 && night.length > 0) || (day.length > 0 && night.length == 0);
                b.should.be.true;
            });
            it('should be rejected if non existent', function () {
                return bus.getIncomingBusesToStop(9999999).should.eventually.be.rejectedWith(Error);
            });
            it('should return Error if stop is invalid', function () {
                return bus.getIncomingBusesToStop('a').should.eventually.be.rejectedWith(Error);
            });
        });
        describe('Without stop existance checking', () => {
            var check = Boolean(process.env['EMTAPI_CHECK']);
            before(function () {
                var name = require.resolve('../lib/emtmad-bus-promise');
                delete require.cache[name];
                name = require.resolve('../lib/config');
                delete require.cache[name];
                process.env['EMTAPI_CHECK'] = false;
                bus = require('../lib/emtmad-bus-promise');
            });
            after(function () {
                var name = require.resolve('../lib/emtmad-bus-promise');
                delete require.cache[name];
                name = require.resolve('../lib/config');
                delete require.cache[name];
                process.env['EMTAPI_CHECK'] = check;
                bus = require('../lib/emtmad-bus-promise');
            });
            it('should return a non empty array', function () {
                return bus.getIncomingBusesToStop(69).should.eventually.have.length.greaterThan(0);
            });
            it('should be rejected if non existent', function () {
                return bus.getIncomingBusesToStop(9999999).should.eventually.be.rejectedWith(Error);
            });
            it('should return Error if stop is invalid', function () {
                return bus.getIncomingBusesToStop('a').should.eventually.be.rejectedWith(Error);
            });
        });
    });
    describe('getStopsFromLocation', function () {
        it('should return an empty array', function () {
            var loc = {
                'latitude': 0.0,
                'longitude': 0.0
            };
            return bus.getStopsFromLocation(loc, 200).should.eventually.have.lengthOf(0);
        });
        it('should return an empty array (radius)', function () {
            var loc = {
                'latitude': 40.4,
                'longitude': -3.6
            };
            return bus.getStopsFromLocation(loc, 0).should.eventually.have.lengthOf(0);
        });
        it('should return a non empty array', function () {
            var loc = {
                'latitude': 40.4,
                'longitude': -3.6
            };
            return bus.getStopsFromLocation(loc, 200).should.eventually.have.length.greaterThan(0);
        });
    });
    describe('getStopsLine', function () {
        it('should return the details of the requested line', function () {
            return bus.getStopsLine(21).should.eventually.have.property('label', '21');
        });
        it('should return the details of the requested line and direction', function () {
            return bus.getStopsLine(21, '1').should.eventually.have.property('label', '21');
        });
        it('should return Error if non existent', function () {
            return bus.getStopsLine(1000).should.eventually.be.rejectedWith(Error);
        });
        it('should return Error if non existent (with direction)', function () {
            return bus.getStopsLine(1000, '1').should.eventually.be.rejectedWith(Error);
        });
        it('should return Error when wrong direction ', function () {
            return bus.getStopsLine(21, '3').should.eventually.be.rejectedWith(Error);
        });
        it('should return a cached response', function () {
            // This is just for coverage reports. The returned value doesn't include cache info.
            return bus.getStopsLine(21)
                .then(function () {
                    return bus.getStopsLine(21);
                }).should.eventually.have.property('label', '21');
        });
    });
    describe('getNodesLines', () => {
        it('should return the details of one stop - Integer', () => {
            return bus.getNodesLines(69).should.eventually.have.lengthOf(1);
        });
        it('should return the details of one stop - Array', () => {
            return bus.getNodesLines([69]).should.eventually.have.lengthOf(1);
        });
        it('should return the details of several stops', () => {
            return bus.getNodesLines([69, 3729]).should.eventually.have.lengthOf(2);
        });
        it('should throw an error (non array and non integer)', () => {
            (() => { bus.getNodesLines('a'); }).should.Throw();
        });
        it('should throw an error (-number)', () => {
            (() => { bus.getNodesLines(-1); }).should.Throw();
        });
        it('should be rejected with wrong stop ID', () => {
            return bus.getNodesLines(99999).should.eventually.be.rejectedWith(Error);
        });
    });
});