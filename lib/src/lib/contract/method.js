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
const utils_1 = __importDefault(require("../../utils"));
const _base_1 = require("../../utils/_base");
const abi_1 = require("../../utils/abi");
const MISSING_ADDRESS_MSG = 'Smart contract is missing address';
const getFunctionSelector = (abi) => {
    abi.stateMutability = abi.stateMutability
        ? abi.stateMutability.toLowerCase()
        : 'nonpayable';
    abi.type = abi.type ? abi.type.toLowerCase() : '';
    if (abi.type === 'fallback' || abi.type === 'receive')
        return '0x';
    const iface = new utils_1.default.ethersUtils.Interface([abi]);
    if (abi.type === 'event')
        return iface
            .getEvent(abi.name)
            .format(utils_1.default.ethersUtils.FormatTypes.sighash);
    return iface
        .getFunction(abi.name)
        .format(utils_1.default.ethersUtils.FormatTypes.sighash);
};
const decodeOutput = (abi, output) => {
    return (0, abi_1.decodeParamsV2ByABI)(abi, output);
};
class Method extends _base_1.WithTronwebAndInjectpromise {
    constructor(contract, abi) {
        super(contract.tronWeb);
        this.contract = contract;
        this.abi = abi;
        this.name = abi.name || (abi.name = abi.type);
        this.inputs = abi.inputs || [];
        this.outputs = abi.outputs || [];
        this.functionSelector = getFunctionSelector(abi);
        this.signature = this.tronWeb
            .sha3(this.functionSelector, false)
            .slice(0, 8);
        this.defaultOptions = {
            feeLimit: this.tronWeb.feeLimit,
            callValue: 0,
            userFeePercentage: 100,
            shouldPollResponse: false,
        };
    }
    decodeInput(data) {
        return decodeOutput(this.inputs, '0x' + data);
    }
    onMethod(...args) {
        let rawParameter = '';
        if (this.abi && !/event/i.test(this.abi.type))
            rawParameter = (0, abi_1.encodeParamsV2ByABI)(this.abi, args);
        return {
            call: (options = {}, callback) => {
                options = Object.assign(Object.assign({}, options), { rawParameter });
                return this._call([], [], options, callback);
            },
            send: (options = {}, privateKey = this.tronWeb.defaultPrivateKey, callback) => {
                options = Object.assign(Object.assign({}, options), { rawParameter });
                return this._send([], [], options, privateKey, callback);
            },
            watch: (this['_watch'] = this._watch.bind(this)),
        };
    }
    _call(types, args, options = {}, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this._call, types, args, options);
            if (types.length !== args.length)
                return callback('Invalid argument count provided');
            if (!this.contract.address)
                return callback(MISSING_ADDRESS_MSG);
            if (!this.contract.deployed)
                return callback('Calling smart contracts requires you to load the contract first');
            const { stateMutability } = this.abi;
            if (!['pure', 'view'].includes(stateMutability.toLowerCase()))
                return callback(`Methods with state mutability "${stateMutability}" must use send()`);
            const final_options = Object.assign(Object.assign(Object.assign(Object.assign({}, this.defaultOptions), { from: this.tronWeb.defaultAddress.hex }), options), { _isConstant: true });
            const parameters = args.map((value, index) => ({
                type: types[index],
                value,
            }));
            // Changed by me, was triggerSmartContract
            this.tronWeb.transactionBuilder.triggerConstantContract(this.contract.address, this.functionSelector, final_options, parameters, final_options.from
                ? this.tronWeb.address.toHex(final_options.from)
                : undefined, (err, transaction) => {
                if (err)
                    return callback(err);
                if (!transaction ||
                    !utils_1.default.hasProperty(transaction, 'constant_result'))
                    return callback('Failed to execute');
                try {
                    const len = transaction.constant_result[0].length;
                    if (len === 0 || len % 64 === 8) {
                        let msg = 'The call has been reverted or has thrown an error.';
                        if (len !== 0) {
                            msg += ' Error message: ';
                            let msg2 = '';
                            const chunk = transaction.constant_result[0].substring(8);
                            for (let i = 0; i < len - 8; i += 64)
                                msg2 += this.tronWeb.toUtf8(chunk.substring(i, i + 64));
                            msg += msg2
                                // eslint-disable-next-line no-control-regex
                                .replace(/(\u0000|\u000b|\f)+/g, ' ')
                                .replace(/ +/g, ' ')
                                .replace(/\s+$/g, '');
                        }
                        return callback(msg);
                    }
                    let output = decodeOutput(this.abi, '0x' + transaction.constant_result[0]);
                    if (output.length === 1 && Object.keys(output).length === 1)
                        output = output[0];
                    return callback(null, output);
                }
                catch (ex) {
                    return callback(ex);
                }
            });
        });
    }
    _send(types, args, options = {}, privateKey = this.tronWeb.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this._send, types, args, options, privateKey);
            if (types.length !== args.length)
                throw new Error('Invalid argument count provided');
            if (!this.contract.address)
                return callback(MISSING_ADDRESS_MSG);
            if (!this.contract.deployed)
                return callback('Calling smart contracts requires you to load the contract first');
            const { stateMutability } = this.abi;
            if (['pure', 'view'].includes(stateMutability.toLowerCase()))
                return callback(`Methods with state mutability "${stateMutability}" must use call()`);
            // If a function isn't payable, dont provide a callValue.
            if (!['payable'].includes(stateMutability.toLowerCase()))
                options.callValue = 0;
            // TODO: this intersection may be not needed after final options cleanup
            const final_options = Object.assign(Object.assign(Object.assign({}, this.defaultOptions), { from: this.tronWeb.defaultAddress.hex }), options);
            const parameters = args.map((value, index) => ({
                type: types[index],
                value,
            }));
            try {
                const address = privateKey
                    ? this.tronWeb.address.fromPrivateKey(privateKey)
                    : this.tronWeb.defaultAddress.base58;
                const transaction = yield this.tronWeb.transactionBuilder.triggerSmartContract(this.contract.address, this.functionSelector, final_options, parameters, this.tronWeb.address.toHex(address));
                if (!transaction.result || !transaction.result.result)
                    return callback('Unknown error: ' + JSON.stringify(transaction, null, 2));
                // If privateKey is false, this won't be signed here.
                // We assume sign functionality will be replaced.
                const signedTransaction = yield this.tronWeb.trx.sign(transaction.transaction, privateKey);
                if (!signedTransaction.signature) {
                    if (!privateKey)
                        return callback('Transaction was not signed properly');
                    return callback('Invalid private key provided');
                }
                const broadcast = yield this.tronWeb.trx.sendRawTransaction(signedTransaction);
                if (broadcast.code) {
                    const err = {
                        error: broadcast.code,
                        message: broadcast.code,
                    };
                    if (broadcast.message)
                        err.message = this.tronWeb.toUtf8(broadcast.message);
                    return callback(err);
                }
                if (!final_options.shouldPollResponse)
                    return callback(null, signedTransaction.txID);
                const { maxRetries = 20, pollingInterval = 3000 } = options;
                const checkResult = (index = 0) => __awaiter(this, void 0, void 0, function* () {
                    if (index === maxRetries - 1)
                        return callback({
                            error: 'Cannot find result in solidity node',
                            transaction: signedTransaction,
                        });
                    const output = yield this.tronWeb.trx.getTransactionInfo(signedTransaction.txID);
                    if (!Object.keys(output).length)
                        return setTimeout(() => {
                            checkResult(index + 1);
                        }, pollingInterval);
                    if ('result' in output && output.result === 'FAILED')
                        return callback({
                            error: this.tronWeb.toUtf8(output.resMessage),
                            transaction: signedTransaction,
                            output,
                        });
                    if (!utils_1.default.hasProperty(output, 'contractResult'))
                        return callback({
                            error: 'Failed to execute: ' +
                                JSON.stringify(output, null, 2),
                            transaction: signedTransaction,
                            output,
                        });
                    if (final_options.rawResponse)
                        return callback(null, output);
                    let decoded = decodeOutput(this.abi, '0x' + output.contractResult[0]);
                    if (decoded.length === 1 && Object.keys(decoded).length === 1)
                        decoded = decoded[0];
                    if (final_options.keepTxID)
                        return callback(null, [signedTransaction.txID, decoded]);
                    return callback(null, decoded);
                });
                checkResult();
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    _watch(options = {}, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!utils_1.default.isFunction(callback))
                throw new Error('Expected callback to be provided');
            if (!this.contract.address)
                return callback(MISSING_ADDRESS_MSG);
            if (!this.abi.type || !/event/i.test(this.abi.type))
                return callback('Invalid method type for event watching');
            if (!this.tronWeb.eventServer)
                return callback('No event server configured');
            let listener = null;
            let lastBlock = null;
            const since = Date.now() - 1000;
            const getEvents = () => __awaiter(this, void 0, void 0, function* () {
                if (!this.contract.address)
                    throw new Error(MISSING_ADDRESS_MSG);
                try {
                    const params = {
                        since,
                        eventName: this.name,
                        sort: 'block_timestamp',
                        blockNumber: 'latest',
                        filters: options.filters,
                    };
                    if (options.size)
                        params.size = options.size;
                    if (options.resourceNode)
                        if (/full/i.test(options.resourceNode))
                            params.onlyUnconfirmed = true;
                        else
                            params.onlyConfirmed = true;
                    const events = yield this.tronWeb.event.getEventsByContractAddress(this.contract.address, params);
                    const [latestEvent] = events.sort((a, b) => b.block - a.block);
                    const newEvents = events.filter((event, index) => {
                        if (options.resourceNode &&
                            event.resourceNode &&
                            options.resourceNode.toLowerCase() !==
                                event.resourceNode.toLowerCase())
                            return false;
                        const duplicate = events
                            .slice(0, index)
                            .some((priorEvent) => JSON.stringify(priorEvent) ===
                            JSON.stringify(event));
                        if (duplicate)
                            return false;
                        if (!lastBlock)
                            return true;
                        return event.block > lastBlock;
                    });
                    if (latestEvent)
                        lastBlock = latestEvent.block;
                    return newEvents;
                }
                catch (ex) {
                    return Promise.reject(ex);
                }
            });
            const bindListener = () => {
                if (listener)
                    clearInterval(listener);
                listener = setInterval(() => {
                    getEvents()
                        .then((events) => events.forEach((event) => {
                        callback(null, utils_1.default.parseEvent(event, this.abi));
                    }))
                        .catch((err) => callback(err));
                }, 3000);
            };
            yield getEvents();
            bindListener();
            return {
                start: bindListener,
                stop: () => {
                    if (!listener)
                        return;
                    clearInterval(listener);
                    listener = null;
                },
            };
        });
    }
}
exports.default = Method;
//# sourceMappingURL=method.js.map