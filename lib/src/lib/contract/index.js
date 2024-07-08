"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _base_1 = require("../../../src/utils/_base");
const utils_1 = __importDefault(require("../../utils"));
const method_1 = __importDefault(require("./method"));
class _Contract extends _base_1.WithTronwebAndInjectpromise {
    constructor(tronWeb, abi = [], address) {
        super(tronWeb);
        this.address = address || null;
        this.abi = abi;
        this.eventListener = null;
        this.eventCallback = null;
        this.bytecode = null;
        this.deployed = false;
        this.lastBlock = null;
        this.methods = {};
        this.methodInstances = {};
        this.props = [];
        if (this.tronWeb.isAddress(address))
            this.deployed = true;
        else
            this.address = null;
        this.loadAbi(abi);
        return this;
    }
    _getEvents(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.address)
                throw new Error('Contract is not configured with an address');
            if (options.rawResponse)
                throw new Error('Cannot parse raw response here.');
            const events = yield this.tronWeb.event.getEventsByContractAddress(this.address, options);
            const [latestEvent] = events.sort((a, b) => b.block - a.block);
            const newEvents = events.filter((event, index) => {
                if (options.resourceNode &&
                    event.resourceNode &&
                    options.resourceNode.toLowerCase() !==
                        event.resourceNode.toLowerCase())
                    return false;
                const duplicate = events
                    .slice(0, index)
                    .some((priorEvent) => JSON.stringify(priorEvent) === JSON.stringify(event));
                if (duplicate)
                    return false;
                if (!this.lastBlock)
                    return true;
                return event.block > this.lastBlock;
            });
            if (latestEvent)
                this.lastBlock = latestEvent.block;
            return newEvents;
        });
    }
    _startEventListener(options = {}, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.eventListener)
                clearInterval(this.eventListener);
            if (!this.tronWeb.eventServer)
                throw new Error('Event server is not configured');
            if (!this.address)
                throw new Error('Contract is not configured with an address');
            this.eventCallback = callback;
            yield this._getEvents(options);
            this.eventListener = setInterval(() => {
                this._getEvents(options)
                    .then((newEvents) => newEvents.forEach((event) => {
                    this.eventCallback && this.eventCallback(event);
                }))
                    .catch((err) => {
                    console.error('Failed to get event list', err);
                });
            }, 3000);
        });
    }
    _stopEventListener() {
        if (!this.eventListener)
            return;
        clearInterval(this.eventListener);
        this.eventListener = null;
        this.eventCallback = null;
    }
    hasProperty(property) {
        return (Object.prototype.hasOwnProperty.call(this, property) ||
            // TODO: just remove this, it's very old stuff
            this.__proto__.hasOwnProperty(property) // eslint-disable-line
        );
    }
    loadAbi(abi) {
        this.abi = abi;
        this.methods = {};
        this.props.forEach((prop) => delete this[prop]);
        abi.forEach((func) => {
            // Don't build a method for constructor function.
            // That's handled through contract create.
            if (!func.type ||
                /constructor/i.test(func.type) ||
                func.type === 'event' ||
                func.type === 'error')
                return;
            const method = new method_1.default(this, func);
            const methodCall = method.onMethod.bind(method);
            const { name, functionSelector, signature } = method;
            this.methods[name] = methodCall;
            this.methods[functionSelector] = methodCall;
            this.methods[signature] = methodCall;
            this.methodInstances[name] = method;
            this.methodInstances[functionSelector] = method;
            this.methodInstances[signature] = method;
            if (!this.hasProperty(name)) {
                this[name] = methodCall;
                this.props.push(name);
            }
            if (!this.hasProperty(functionSelector)) {
                this[functionSelector] = methodCall;
                this.props.push(functionSelector);
            }
            if (!this.hasProperty(signature)) {
                this[signature] = methodCall;
                this.props.push(signature);
            }
        });
    }
    decodeInput(data) {
        const methodName = data.substring(0, 8);
        const inputData = data.substring(8);
        if (!this.methodInstances[methodName])
            throw new Error('Contract method ' + methodName + ' not found');
        const methodInstance = this.methodInstances[methodName];
        return {
            name: methodInstance.name,
            params: this.methodInstances[methodName].decodeInput(inputData),
        };
    }
    new(options, privateKey = this.tronWeb.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.new, options, privateKey);
            try {
                const address = this.tronWeb.address.fromPrivateKey(privateKey);
                if (!address)
                    return callback('Invalid privateKey provided!');
                const transaction = yield this.tronWeb.transactionBuilder.createSmartContract(options, address);
                const signedTransaction = yield this.tronWeb.trx.sign(transaction, privateKey);
                const contract = yield this.tronWeb.trx.sendRawTransaction(signedTransaction);
                if (contract.code)
                    return callback({
                        error: contract.code,
                        message: this.tronWeb.toUtf8(contract.message),
                    });
                yield utils_1.default.sleep(3000);
                return this.at(signedTransaction.contract_address, callback);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    at(contractAddress, callback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.at, contractAddress);
            try {
                const contract = yield this.tronWeb.trx.getContract(contractAddress);
                if (!contract.contract_address)
                    return callback('Unknown error: ' + JSON.stringify(contract, null, 2));
                this.address = contract.contract_address;
                this.bytecode = contract.bytecode;
                this.deployed = true;
                this.loadAbi(((_a = contract.abi) === null || _a === void 0 ? void 0 : _a.entrys) ? contract.abi.entrys : []);
                return callback(null, this);
            }
            catch (ex) {
                if ((ex === null || ex === void 0 ? void 0 : ex.toString) && ex.toString().includes('does not exist'))
                    return callback('Contract has not been deployed on the network');
                return callback(ex);
            }
        });
    }
    events(options = {}, callback) {
        if (!utils_1.default.isFunction(callback))
            throw new Error('Callback function expected');
        const self = this;
        return {
            start(startCallback) {
                if (!startCallback) {
                    self._startEventListener(options, callback);
                    return this;
                }
                self._startEventListener(options, callback)
                    .then(() => {
                    startCallback();
                })
                    .catch((err) => {
                    startCallback(err);
                });
                return this;
            },
            stop() {
                self._stopEventListener();
            },
        };
    }
}
const _ContractI = _Contract;
class Contract extends _ContractI {
}
exports.default = Contract;
// export default Contract;
//# sourceMappingURL=index.js.map