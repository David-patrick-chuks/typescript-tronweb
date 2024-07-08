"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const querystring_1 = __importDefault(require("querystring"));
const _base_1 = require("../../src/utils/_base");
const utils_1 = __importDefault(require("../utils"));
const providers = __importStar(require("./providers"));
class Event extends _base_1.WithTronwebAndInjectpromise {
    setServer(eventServer, healthcheck = 'healthcheck') {
        // tronWeb instance attrs are handled in a weird way
        // All usages do not check for undefined, but allow to set
        // attrs to undefined regularly.
        // FIXME: should it be allowed?
        // @ts-ignore
        if (!eventServer)
            return (this.tronWeb.eventServer = undefined);
        if (utils_1.default.isString(eventServer))
            eventServer = new providers.HttpProvider(eventServer);
        if (!this.tronWeb.isValidProvider(eventServer))
            throw new Error('Invalid event server provided');
        this.tronWeb.eventServer = eventServer;
        this.tronWeb.eventServer.isConnected = () => this.tronWeb.eventServer
            .request(healthcheck)
            .then(() => true)
            .catch(() => false);
    }
    getEventsByContractAddress(contractAddress, options = {}, callback) {
        /* eslint-disable prefer-const */
        let { sinceTimestamp, since, fromTimestamp, eventName, blockNumber, size, page, onlyConfirmed, onlyUnconfirmed, previousLastEventFingerprint, previousFingerprint, fingerprint, rawResponse, sort, filters, } = Object.assign({
            sinceTimestamp: 0,
            eventName: false,
            blockNumber: false,
            size: 20,
            page: 1,
        }, options);
        /* eslint-enable prefer-const */
        if (!callback)
            return this.injectPromise(this.getEventsByContractAddress, contractAddress, options);
        fromTimestamp = fromTimestamp || sinceTimestamp || since;
        if (!this.tronWeb.eventServer)
            return callback('No event server configured');
        const routeParams = [];
        if (!this.tronWeb.isAddress(contractAddress))
            return callback('Invalid contract address provided');
        if (eventName && !contractAddress)
            return callback('Usage of event name filtering requires a contract address');
        if (typeof fromTimestamp !== 'undefined' &&
            !utils_1.default.isInteger(fromTimestamp))
            return callback('Invalid fromTimestamp provided');
        if (!utils_1.default.isInteger(size))
            return callback('Invalid size provided');
        if (size > 200) {
            console.warn('Defaulting to maximum accepted size: 200');
            size = 200;
        }
        if (!utils_1.default.isInteger(page))
            return callback('Invalid page provided');
        if (blockNumber && !eventName)
            return callback('Usage of block number filtering requires an event name');
        if (contractAddress)
            routeParams.push(this.tronWeb.address.fromHex(contractAddress));
        if (eventName)
            routeParams.push(eventName);
        if (blockNumber)
            routeParams.push(blockNumber);
        const qs = {
            size,
            page,
        };
        if (filters != null &&
            typeof filters === 'object' &&
            Object.keys(filters).length > 0)
            qs.filters = JSON.stringify(filters);
        if (fromTimestamp)
            qs.fromTimestamp = qs.since = fromTimestamp;
        if (onlyConfirmed)
            qs.only_confirmed = onlyConfirmed;
        if (onlyUnconfirmed && !onlyConfirmed)
            qs.only_unconfirmed = onlyUnconfirmed;
        if (sort)
            qs.sort = sort;
        fingerprint =
            fingerprint || previousFingerprint || previousLastEventFingerprint;
        if (fingerprint)
            qs.fingerprint = fingerprint;
        return this.tronWeb.eventServer
            .request(`event/contract/${routeParams.join('/')}?${querystring_1.default.stringify(qs)}`)
            .then((data) => {
            if (!data)
                return callback('Unknown error occurred');
            if (!utils_1.default.isArray(data))
                return callback(data);
            if (rawResponse)
                return callback(null, data);
            else
                return callback(null, data.map((event) => utils_1.default.mapEvent(event)));
        })
            .catch((err) => callback((err.response && err.response.data) || err));
    }
    getEventsByTransactionID(transactionID, options = {}, callback) {
        if (!callback || !utils_1.default.isFunction(callback))
            return this.injectPromise(this.getEventsByTransactionID, transactionID, options);
        if (!this.tronWeb.eventServer)
            return callback('No event server configured');
        return this.tronWeb.eventServer
            .request(`event/transaction/${transactionID}`)
            .then((data) => {
            if (!callback)
                return null;
            if (!data)
                return callback('Unknown error occurred');
            if (!utils_1.default.isArray(data))
                return callback(data);
            return callback(null, options.rawResponse === true
                ? data
                : data.map((event) => utils_1.default.mapEvent(event)));
        })
            .catch((err) => callback &&
            callback((err.response && err.response.data) || err));
    }
}
exports.default = Event;
//# sourceMappingURL=event.js.map