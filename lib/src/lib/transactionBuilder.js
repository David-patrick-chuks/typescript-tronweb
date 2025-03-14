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
const __1 = __importDefault(require(".."));
const paramValidator_1 = __importDefault(require("../paramValidator"));
const utils_1 = __importDefault(require("../utils"));
const _base_1 = require("../utils/_base");
const abi_1 = require("../utils/abi");
const address_1 = require("../utils/address");
const ethersUtils_1 = require("../utils/ethersUtils");
const trx_1 = require("./trx");
const INVALID_RESOURCE_MESSAGE = 'Invalid resource provided: Expected "BANDWIDTH" or "ENERGY';
let self;
//helpers
function toHex(value) {
    return __1.default.address.toHex(value);
}
function fromUtf8(value) {
    return self.tronWeb.fromUtf8(value);
}
function resultManager(transaction, callback) {
    if (transaction.Error)
        return callback(transaction.Error);
    if (transaction.result && transaction.result.message)
        return callback(self.tronWeb.toUtf8(transaction.result.message));
    return callback(null, transaction);
}
class TransactionBuilder extends _base_1.WithTronwebAndInjectpromise {
    constructor(tronWeb) {
        super(tronWeb);
        this.sendAsset = this.sendToken.bind(this);
        this.purchaseAsset = this.purchaseToken.bind(this);
        this.createAsset = this.createToken.bind(this);
        this.updateAsset = this.updateToken.bind(this);
        self = this;
        this.validator = new paramValidator_1.default(tronWeb);
    }
    sendTrx(to, amount = 0, from = this.tronWeb.defaultAddress.hex, options = {}, callback) {
        if (!callback)
            return this.injectPromise(this.sendTrx, to, amount, from, options);
        // accept amounts passed as strings
        amount = parseInt(amount.toString());
        if (this.validator.notValid([
            {
                name: 'recipient',
                type: 'address',
                value: to,
            },
            {
                name: 'origin',
                type: 'address',
                value: from,
            },
            {
                names: ['recipient', 'origin'],
                type: 'notEqual',
                msg: 'Cannot transfer TRX to the same account',
            },
            {
                name: 'amount',
                type: 'integer',
                gt: 0,
                value: amount,
            },
        ], callback))
            return;
        const data = {
            to_address: toHex(to),
            owner_address: toHex(from),
            amount: amount,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/createtransaction', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    sendToken(to, amount = 0, tokenID, from = this.tronWeb.defaultAddress.hex, options = {}, callback) {
        if (!callback)
            return this.injectPromise(this.sendToken, to, amount, tokenID, from, options);
        amount = parseInt(amount.toString());
        if (this.validator.notValid([
            {
                name: 'recipient',
                type: 'address',
                value: to,
            },
            {
                name: 'origin',
                type: 'address',
                value: from,
            },
            {
                names: ['recipient', 'origin'],
                type: 'notEqual',
                msg: 'Cannot transfer tokens to the same account',
            },
            {
                name: 'amount',
                type: 'integer',
                gt: 0,
                value: amount,
            },
            {
                name: 'token ID',
                type: 'tokenId',
                value: tokenID,
            },
        ], callback))
            return;
        const data = {
            to_address: toHex(to),
            owner_address: toHex(from),
            asset_name: fromUtf8(tokenID),
            amount: parseInt(amount.toString()),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/transferasset', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    purchaseToken(issuerAddress, tokenID, amount = 0, buyer = this.tronWeb.defaultAddress.hex, options = {}, callback) {
        if (!callback)
            return this.injectPromise(this.purchaseToken, issuerAddress, tokenID, amount, buyer, options);
        if (this.validator.notValid([
            {
                name: 'buyer',
                type: 'address',
                value: buyer,
            },
            {
                name: 'issuer',
                type: 'address',
                value: issuerAddress,
            },
            {
                names: ['buyer', 'issuer'],
                type: 'notEqual',
                msg: 'Cannot purchase tokens from same account',
            },
            {
                name: 'amount',
                type: 'integer',
                gt: 0,
                value: amount,
            },
            {
                name: 'token ID',
                type: 'tokenId',
                value: tokenID,
            },
        ], callback))
            return;
        const data = {
            to_address: toHex(issuerAddress),
            owner_address: toHex(buyer),
            asset_name: fromUtf8(tokenID),
            amount: parseInt(amount.toString()),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/participateassetissue', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    freezeBalance(amount = 0, duration = 3, resource = trx_1.ResourceT.BANDWIDTH, address = this.tronWeb.defaultAddress.hex, receiverAddress, options = {}, callback) {
        if (!callback)
            return this.injectPromise(this.freezeBalance, amount, duration, resource, address, receiverAddress, options);
        if (this.validator.notValid([
            {
                name: 'origin',
                type: 'address',
                value: address,
            },
            {
                name: 'receiver',
                type: 'address',
                value: receiverAddress,
                optional: true,
            },
            {
                name: 'amount',
                type: 'integer',
                gt: 0,
                value: amount,
            },
            {
                name: 'duration',
                type: 'integer',
                gte: 3,
                value: duration,
            },
            {
                name: 'resource',
                type: 'resource',
                value: resource,
                msg: INVALID_RESOURCE_MESSAGE,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(address),
            frozen_balance: parseInt(amount.toString()),
            frozen_duration: parseInt(duration.toString()),
            resource: resource,
            receiver_address: receiverAddress != null &&
                toHex(receiverAddress) !== toHex(address)
                ? toHex(receiverAddress)
                : undefined,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/freezebalance', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    unfreezeBalance(resource = trx_1.ResourceT.BANDWIDTH, address = this.tronWeb.defaultAddress.hex, receiverAddress, options = {}, callback) {
        if (!callback)
            return this.injectPromise(this.unfreezeBalance, resource, address, receiverAddress, options);
        if (this.validator.notValid([
            {
                name: 'origin',
                type: 'address',
                value: address,
            },
            {
                name: 'receiver',
                type: 'address',
                value: receiverAddress,
                optional: true,
            },
            {
                name: 'resource',
                type: 'resource',
                value: resource,
                msg: INVALID_RESOURCE_MESSAGE,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(address),
            resource: resource,
            receiver_address: receiverAddress != null &&
                toHex(receiverAddress) !== toHex(address)
                ? toHex(receiverAddress)
                : undefined,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/unfreezebalance', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    withdrawBlockRewards(address = this.tronWeb.defaultAddress.hex, options = {}, callback) {
        if (!callback)
            return this.injectPromise(this.withdrawBlockRewards, address, options);
        if (this.validator.notValid([
            {
                name: 'origin',
                type: 'address',
                value: address,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(address),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/withdrawbalance', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    applyForSR(address = this.tronWeb.defaultAddress.hex, url, options = {}, callback) {
        if (!callback)
            return this.injectPromise(this.applyForSR, address, url, options);
        if (this.validator.notValid([
            {
                name: 'origin',
                type: 'address',
                value: address,
            },
            {
                name: 'url',
                type: 'url',
                value: url,
                msg: 'Invalid url provided',
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(address),
            url: fromUtf8(url),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/createwitness', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    vote(votes, voterAddress = this.tronWeb.defaultAddress.hex, options = {}, callback) {
        if (!callback)
            return this.injectPromise(this.vote, votes, voterAddress, options);
        if (this.validator.notValid([
            {
                name: 'voter',
                type: 'address',
                value: voterAddress,
            },
            {
                name: 'votes',
                type: 'notEmptyObject',
                value: votes,
            },
        ], callback))
            return;
        let invalid = false;
        const votesArr = Object.entries(votes).map(([srAddress, voteCount]) => {
            if (invalid)
                return;
            if (this.validator.notValid([
                {
                    name: 'SR',
                    type: 'address',
                    value: srAddress,
                },
                {
                    name: 'vote count',
                    type: 'integer',
                    gt: 0,
                    value: voteCount,
                    msg: 'Invalid vote count provided for SR: ' + srAddress,
                },
            ]))
                return (invalid = true);
            return {
                vote_address: toHex(srAddress),
                vote_count: parseInt(voteCount.toString()),
            };
        });
        // Casting, because we'll return immediately otherwise
        // It doesn't affect typechecking anyway
        if (invalid)
            return;
        const data = {
            owner_address: toHex(voterAddress),
            votes: votesArr,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/votewitnessaccount', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    createSmartContract(options, issuerAddress = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.createSmartContract, options, issuerAddress);
        const feeLimit = options.feeLimit || this.tronWeb.feeLimit;
        let userFeePercentage = options.userFeePercentage;
        if (typeof userFeePercentage !== 'number' && !userFeePercentage)
            userFeePercentage = 100;
        const originEnergyLimit = options.originEnergyLimit || 10000000;
        const callValue = options.callValue || 0;
        const tokenValue = options.tokenValue;
        const tokenId = options.tokenId || options.token_id;
        // eslint-disable-next-line prefer-const
        let { abi = '', bytecode, parameters = [], name = '' } = options;
        if (abi && utils_1.default.isString(abi))
            try {
                abi = JSON.parse(abi);
            }
            catch (_a) {
                return callback('Invalid options.abi provided');
            }
        if (utils_1.default.isString(abi))
            throw new Error('Impossible!');
        const abi_arr = 'entrys' in abi ? abi.entrys : abi;
        if (!utils_1.default.isArray(abi_arr))
            return callback('Invalid options.abi provided');
        const payable = abi_arr.some((func) => {
            return (func.type === 'constructor' &&
                'payable' === func.stateMutability.toLowerCase());
        });
        if (this.validator.notValid([
            {
                name: 'bytecode',
                type: 'hex',
                value: bytecode,
            },
            {
                name: 'feeLimit',
                type: 'integer',
                value: feeLimit,
                gt: 0,
            },
            {
                name: 'callValue',
                type: 'integer',
                value: callValue,
                gte: 0,
            },
            {
                name: 'userFeePercentage',
                type: 'integer',
                value: userFeePercentage,
                gte: 0,
                lte: 100,
            },
            {
                name: 'originEnergyLimit',
                type: 'integer',
                value: originEnergyLimit,
                gte: 0,
                lte: 10000000,
            },
            {
                name: 'parameters',
                type: 'array',
                value: parameters,
            },
            {
                name: 'issuer',
                type: 'address',
                value: issuerAddress,
            },
            {
                name: 'tokenValue',
                type: 'integer',
                value: tokenValue,
                gte: 0,
                optional: true,
            },
            {
                name: 'tokenId',
                type: 'integer',
                value: tokenId,
                gte: 0,
                optional: true,
            },
        ], callback))
            return;
        if (payable && callValue === 0 && tokenValue === 0)
            return callback('When contract is payable, options.callValue or options.tokenValue' +
                ' must be a positive integer');
        if (!payable && (callValue > 0 || (tokenValue && tokenValue > 0)))
            return callback('When contract is not payable, options.callValue' +
                ' and options.tokenValue must be 0');
        if (options.rawParameter && utils_1.default.isString(options.rawParameter)) {
            parameters = options.rawParameter.replace(/^(0x)/, '');
        }
        else if (options.funcABIV2) {
            parameters = (0, abi_1.encodeParamsV2ByABI)(options.funcABIV2, options.parametersV2).replace(/^(0x)/, '');
        }
        else {
            const constructorParams = abi_arr.find((it) => {
                return it.type === 'constructor';
            });
            if (typeof constructorParams !== 'undefined' && constructorParams) {
                const abiCoder = new ethersUtils_1.AbiCoder();
                const types = [];
                const values = [];
                const constructorParams2 = constructorParams.inputs;
                if (parameters.length !== constructorParams2.length)
                    return callback(`constructor needs ${constructorParams2.length}` +
                        ` but ${parameters.length} provided`);
                for (let i = 0; i < parameters.length; i++) {
                    let type = constructorParams2[i].type;
                    let value = parameters[i];
                    if (!type || !utils_1.default.isString(type) || !type.length)
                        return callback('Invalid parameter type provided: ' + type);
                    if (type === 'address')
                        value = toHex(value).replace(address_1.ADDRESS_PREFIX_REGEX, '0x');
                    else if (type.match(/^([^\x5b]*)(\x5b|$)/)[0] === 'address[')
                        value = value.map((v) => toHex(v).replace(address_1.ADDRESS_PREFIX_REGEX, '0x'));
                    else if (/trcToken/.test(type))
                        type = type.replace(/trcToken/, 'uint256');
                    types.push(type);
                    values.push(value);
                }
                try {
                    parameters = abiCoder
                        .encode(types, values)
                        .replace(/^(0x)/, '');
                }
                catch (ex) {
                    return callback(ex);
                }
            }
            else {
                parameters = '';
            }
        }
        const args = {
            owner_address: toHex(issuerAddress),
            fee_limit: parseInt(feeLimit.toString()),
            call_value: parseInt(callValue),
            consume_user_resource_percent: userFeePercentage,
            origin_energy_limit: originEnergyLimit,
            abi: JSON.stringify(abi_arr),
            bytecode,
            parameter: parameters,
            name,
            token_id: tokenId != null ? parseInt(tokenId.toString()) : undefined,
            call_token_value: tokenValue != null
                ? parseInt(tokenValue.toString())
                : undefined,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        // tokenValue and tokenId can cause errors if provided
        // when the trx10 proposal has not been approved yet.
        // So we set them only if they are passed to the method.
        this.tronWeb.fullNode
            .request('wallet/deploycontract', args, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    triggerSmartContract(contractAddress, functionSelector, options, parameters = [], issuerAddress = this.tronWeb.defaultAddress.hex, callback) {
        return this._triggerSmartContract(contractAddress, functionSelector, options, parameters, issuerAddress, callback);
    }
    triggerConstantContract(contractAddress, functionSelector, options, parameters = [], issuerAddress = this.tronWeb.defaultAddress.hex, callback) {
        options._isConstant = true;
        return this.triggerSmartContract(contractAddress, functionSelector, options, parameters, issuerAddress, callback);
    }
    triggerConfirmedConstantContract(contractAddress, functionSelector, options, parameters = [], issuerAddress = this.tronWeb.defaultAddress.hex, callback) {
        options._isConstant = true;
        options.confirmed = true;
        return this.triggerSmartContract(contractAddress, functionSelector, options, parameters, issuerAddress, callback);
    }
    estimateEnergy(...params) {
        params[2].estimateEnergy = true;
        return this._estimateEnergyCall(params[0], params[1], params[2], params[3], params[4], params[5]);
    }
    _triggerSmartContract(contractAddress, functionSelector, options, parameters = [], issuerAddress = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this._triggerSmartContract, contractAddress, functionSelector, options, parameters, issuerAddress);
        const { tokenValue, tokenId, callValue, feeLimit } = Object.assign({
            callValue: 0,
            feeLimit: this.tronWeb.feeLimit,
        }, options);
        if (this.validator.notValid([
            {
                name: 'feeLimit',
                type: 'integer',
                value: feeLimit,
                gt: 0,
            },
            {
                name: 'callValue',
                type: 'integer',
                value: callValue,
                gte: 0,
            },
            {
                name: 'parameters',
                type: 'array',
                value: parameters,
            },
            {
                name: 'contract',
                type: 'address',
                value: contractAddress,
            },
            {
                name: 'issuer',
                type: 'address',
                value: issuerAddress,
                optional: true,
            },
            {
                name: 'tokenValue',
                type: 'integer',
                value: tokenValue,
                gte: 0,
                optional: true,
            },
            {
                name: 'tokenId',
                type: 'integer',
                value: tokenId,
                gte: 0,
                optional: true,
            },
        ], callback))
            return;
        const args = {
            contract_address: toHex(contractAddress),
            owner_address: toHex(issuerAddress),
        };
        let param_str;
        if (functionSelector && utils_1.default.isString(functionSelector)) {
            functionSelector = functionSelector.replace('/s*/g', '');
            if (parameters.length) {
                const abiCoder = new ethersUtils_1.AbiCoder();
                let types = [];
                const values = [];
                for (let i = 0; i < parameters.length; i++) {
                    // eslint-disable-next-line prefer-const
                    let { type, value } = parameters[i];
                    if (!type || !utils_1.default.isString(type) || !type.length)
                        return callback('Invalid parameter type provided: ' + type);
                    if (type === 'address')
                        value = toHex(value).replace(address_1.ADDRESS_PREFIX_REGEX, '0x');
                    else if (type.match(/^([^\x5b]*)(\x5b|$)/)[0] === 'address[')
                        value = value.map((v) => toHex(v).replace(address_1.ADDRESS_PREFIX_REGEX, '0x'));
                    types.push(type);
                    values.push(value);
                }
                try {
                    // workaround for unsupported trcToken type
                    types = types.map((type) => {
                        if (/trcToken/.test(type))
                            type = type.replace(/trcToken/, 'uint256');
                        return type;
                    });
                    param_str = abiCoder
                        .encode(types, values)
                        .replace(/^(0x)/, '');
                }
                catch (ex) {
                    return callback(ex);
                }
            }
            else {
                param_str = '';
            }
            // work for abiv2 if passed the function abi in options
            if (options.funcABIV2)
                param_str = (0, abi_1.encodeParamsV2ByABI)(options.funcABIV2, options.parametersV2).replace(/^(0x)/, '');
            if (options.shieldedParameter &&
                utils_1.default.isString(options.shieldedParameter))
                param_str = options.shieldedParameter.replace(/^(0x)/, '');
            if (options.rawParameter && utils_1.default.isString(options.rawParameter))
                param_str = options.rawParameter.replace(/^(0x)/, '');
            args.function_selector = functionSelector;
            args.parameter = param_str;
        }
        args.call_value = parseInt(callValue);
        if (tokenValue != null)
            args.call_token_value = parseInt(tokenValue.toString());
        if (tokenId != null)
            args.token_id = parseInt(tokenId.toString());
        if (!(options._isConstant || options.estimateEnergy))
            args.fee_limit = parseInt(feeLimit.toString());
        if (options.permissionId)
            args.Permission_id = options.permissionId;
        let pathInfo = 'triggersmartcontract';
        if (options._isConstant) {
            pathInfo = 'triggerconstantcontract';
        }
        else if (options.estimateEnergy) {
            pathInfo = 'estimateenergy';
        }
        pathInfo = `wallet${options.confirmed ? 'solidity' : ''}/${pathInfo}`;
        this.tronWeb[options.confirmed ? 'solidityNode' : 'fullNode']
            // An error occurs here we need to fix it
            .request(pathInfo, args, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    _estimateEnergyCall(contractAddress, functionSelector, options, parameters, issuerAddress, callback) {
        if (!callback)
            return this.injectPromise(this._estimateEnergyCall, contractAddress, functionSelector, options, parameters, issuerAddress);
        const { tokenValue, tokenId, callValue, feeLimit } = Object.assign({
            callValue: 0,
            feeLimit: this.tronWeb.feeLimit,
        }, options);
        if (this.validator.notValid([
            {
                name: 'feeLimit',
                type: 'integer',
                value: feeLimit,
                gt: 0,
            },
            {
                name: 'callValue',
                type: 'integer',
                value: callValue,
                gte: 0,
            },
            {
                name: 'parameters',
                type: 'array',
                value: parameters,
            },
            {
                name: 'contract',
                type: 'address',
                value: contractAddress,
            },
            {
                name: 'issuer',
                type: 'address',
                value: issuerAddress,
                optional: true,
            },
            {
                name: 'tokenValue',
                type: 'integer',
                value: tokenValue,
                gte: 0,
                optional: true,
            },
            {
                name: 'tokenId',
                type: 'integer',
                value: tokenId,
                gte: 0,
                optional: true,
            },
        ], callback))
            return;
        const args = {
            // contract_address: toHex(contractAddress),
            // owner_address: toHex(issuerAddress),
            contract_address: contractAddress,
            owner_address: issuerAddress,
        };
        let param_str;
        if (functionSelector && utils_1.default.isString(functionSelector)) {
            functionSelector = functionSelector.replace('/s*/g', '');
            if (parameters.length) {
                const abiCoder = new ethersUtils_1.AbiCoder();
                let types = [];
                const values = [];
                for (let i = 0; i < parameters.length; i++) {
                    // eslint-disable-next-line prefer-const
                    let { type, value } = parameters[i];
                    if (!type || !utils_1.default.isString(type) || !type.length)
                        return callback('Invalid parameter type provided: ' + type);
                    if (type === 'address')
                        value = toHex(value).replace(address_1.ADDRESS_PREFIX_REGEX, '0x');
                    else if (type.match(/^([^\x5b]*)(\x5b|$)/)[0] === 'address[')
                        value = value.map((v) => toHex(v).replace(address_1.ADDRESS_PREFIX_REGEX, '0x'));
                    types.push(type);
                    values.push(value);
                }
                try {
                    // workaround for unsupported trcToken type
                    types = types.map((type) => {
                        if (/trcToken/.test(type))
                            type = type.replace(/trcToken/, 'uint256');
                        return type;
                    });
                    param_str = abiCoder
                        .encode(types, values)
                        .replace(/^(0x)/, '');
                }
                catch (ex) {
                    return callback(ex);
                }
            }
            else {
                param_str = '';
            }
            // work for abiv2 if passed the function abi in options
            if (options.funcABIV2)
                param_str = (0, abi_1.encodeParamsV2ByABI)(options.funcABIV2, options.parametersV2).replace(/^(0x)/, '');
            if (options.shieldedParameter &&
                utils_1.default.isString(options.shieldedParameter))
                param_str = options.shieldedParameter.replace(/^(0x)/, '');
            if (options.rawParameter && utils_1.default.isString(options.rawParameter))
                param_str = options.rawParameter.replace(/^(0x)/, '');
            args.function_selector = functionSelector;
            args.parameter = param_str;
            args.visible = true;
        }
        this.tronWeb[options.confirmed ? 'solidityNode' : 'fullNode']
            .request("wallet/estimateenergy", args, 'post').then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    clearABI(contractAddress, ownerAddress = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.clearABI, contractAddress, ownerAddress);
        if (!this.tronWeb.isAddress(contractAddress))
            return callback('Invalid contract address provided');
        if (!this.tronWeb.isAddress(ownerAddress))
            return callback('Invalid owner address provided');
        const data = {
            contract_address: toHex(contractAddress),
            owner_address: toHex(ownerAddress),
        };
        if (this.tronWeb.trx.cache.contracts[contractAddress])
            delete this.tronWeb.trx.cache.contracts[contractAddress];
        this.tronWeb.fullNode
            .request('wallet/clearabi', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    updateBrokerage(brokerage, ownerAddress = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.updateBrokerage, brokerage, ownerAddress);
        if (!utils_1.default.isNotNullOrUndefined(brokerage))
            return callback('Invalid brokerage provided');
        if (!utils_1.default.isInteger(brokerage) || brokerage < 0 || brokerage > 100)
            return callback('Brokerage must be an integer between 0 and 100');
        if (!this.tronWeb.isAddress(ownerAddress))
            return callback('Invalid owner address provided');
        const data = {
            brokerage: parseInt(brokerage.toString()),
            owner_address: toHex(ownerAddress),
        };
        this.tronWeb.fullNode
            .request('wallet/updateBrokerage', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    createToken(options, issuerAddress = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.createToken, options, issuerAddress);
        const { name, abbreviation, description, url, totalSupply, voteScore, precision, saleStart = Date.now(), saleEnd, 
        // How much TRX will `tokenRatio` cost?
        trxRatio = 1, 
        // How many tokens will `trxRatio` afford?
        tokenRatio = 1, 
        // The creator's "donated" bandwidth for use by token holders
        freeBandwidth = 0, 
        // Out of `totalFreeBandwidth`, the amount each token holder get
        freeBandwidthLimit = 0, frozenAmount = 0, frozenDuration = 0,
        // for now there is no default for the following values
         } = options;
        if (this.validator.notValid([
            {
                name: 'Supply amount',
                type: 'positive-integer',
                value: totalSupply,
            },
            {
                name: 'TRX ratio',
                type: 'positive-integer',
                value: trxRatio,
            },
            {
                name: 'Token ratio',
                type: 'positive-integer',
                value: tokenRatio,
            },
            {
                name: 'token abbreviation',
                type: 'not-empty-string',
                value: abbreviation,
            },
            {
                name: 'token name',
                type: 'not-empty-string',
                value: name,
            },
            {
                name: 'token description',
                type: 'not-empty-string',
                value: description,
            },
            {
                name: 'token url',
                type: 'url',
                value: url,
            },
            {
                name: 'issuer',
                type: 'address',
                value: issuerAddress,
            },
            {
                name: 'sale start timestamp',
                type: 'integer',
                value: saleStart,
                gte: Date.now(),
            },
            {
                name: 'sale end timestamp',
                type: 'integer',
                value: saleEnd,
                gt: parseInt(saleStart.toString()),
            },
            {
                name: 'Free bandwidth amount',
                type: 'integer',
                value: freeBandwidth,
                gte: 0,
            },
            {
                name: 'Free bandwidth limit',
                type: 'integer',
                value: freeBandwidthLimit,
                gte: 0,
            },
            {
                name: 'Frozen supply',
                type: 'integer',
                value: frozenAmount,
                gte: 0,
            },
            {
                name: 'Frozen duration',
                type: 'integer',
                value: frozenDuration,
                gte: 0,
            },
        ], callback))
            return;
        if (utils_1.default.isNotNullOrUndefined(voteScore) &&
            (!utils_1.default.isInteger(voteScore) || voteScore <= 0))
            return callback('voteScore must be a positive integer greater than 0');
        if (utils_1.default.isNotNullOrUndefined(precision) &&
            (!utils_1.default.isInteger(precision) || precision < 0 || precision > 6))
            return callback('precision must be a positive integer >= 0 and <= 6');
        const data = {
            owner_address: toHex(issuerAddress),
            name: fromUtf8(name),
            abbr: fromUtf8(abbreviation),
            description: fromUtf8(description),
            url: fromUtf8(url),
            total_supply: parseInt(totalSupply.toString()),
            trx_num: parseInt(trxRatio.toString()),
            num: parseInt(tokenRatio.toString()),
            start_time: parseInt(saleStart.toString()),
            end_time: parseInt(saleEnd.toString()),
            free_asset_net_limit: parseInt(freeBandwidth.toString()),
            public_free_asset_net_limit: parseInt(freeBandwidthLimit.toString()),
            frozen_supply: {
                frozen_amount: parseInt(frozenAmount.toString()),
                frozen_days: parseInt(frozenDuration.toString()),
            },
            // precision: undefined as undefined | number,
            // vote_score: undefined as undefined | number,
            // Permission_id: undefined as undefined | number,
        };
        // Can never happen, we validated before!
        // if (!(parseInt(frozenAmount) > 0)) delete data.frozen_supply;
        // TODO: refactor this to `else` of checking branch
        if (precision && !isNaN(parseInt(precision.toString())))
            data.precision = parseInt(precision.toString());
        if (voteScore && !isNaN(parseInt(voteScore.toString())))
            data.vote_score = parseInt(voteScore.toString());
        if (options && options.permissionId)
            data.Permission_id = options.permissionId;
        this.tronWeb.fullNode
            .request('wallet/createassetissue', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    updateAccount(accountName, address = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.updateAccount, accountName, address, options);
        if (this.validator.notValid([
            {
                name: 'Name',
                type: 'not-empty-string',
                value: accountName,
            },
            {
                name: 'origin',
                type: 'address',
                value: address,
            },
        ], callback))
            return;
        const data = {
            account_name: fromUtf8(accountName),
            owner_address: toHex(address),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/updateaccount', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    setAccountId(accountId, address = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.setAccountId, accountId, address);
        if (accountId &&
            utils_1.default.isString(accountId) &&
            accountId.startsWith('0x'))
            accountId = accountId.slice(2);
        if (this.validator.notValid([
            {
                name: 'accountId',
                type: 'hex',
                value: accountId,
            },
            {
                name: 'accountId',
                type: 'string',
                lte: 32,
                gte: 8,
                value: accountId,
            },
            {
                name: 'origin',
                type: 'address',
                value: address,
            },
        ], callback))
            return;
        this.tronWeb.fullNode
            .request('wallet/setaccountid', {
            account_id: accountId,
            owner_address: toHex(address),
        }, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    updateToken(options, issuerAddress = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.updateToken, options, issuerAddress);
        const { description, url, 
        // The creator's "donated" bandwidth for use by token holders
        freeBandwidth = 0, 
        // Out of `totalFreeBandwidth`, the amount each token holder get
        freeBandwidthLimit = 0, } = options;
        if (this.validator.notValid([
            {
                name: 'token description',
                type: 'not-empty-string',
                value: description,
            },
            {
                name: 'token url',
                type: 'url',
                value: url,
            },
            {
                name: 'issuer',
                type: 'address',
                value: issuerAddress,
            },
            {
                name: 'Free bandwidth amount',
                type: 'positive-integer',
                value: freeBandwidth,
            },
            {
                name: 'Free bandwidth limit',
                type: 'positive-integer',
                value: freeBandwidthLimit,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(issuerAddress),
            description: fromUtf8(description),
            url: fromUtf8(url),
            new_limit: parseInt(freeBandwidth.toString()),
            new_public_limit: parseInt(freeBandwidthLimit.toString()),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/updateasset', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    createProposal(parameters, issuerAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.createProposal, parameters, issuerAddress, options);
        if (this.validator.notValid([
            {
                name: 'issuer',
                type: 'address',
                value: issuerAddress,
            },
        ], callback))
            return;
        const invalid = 'Invalid proposal parameters provided';
        if (!parameters)
            return callback(invalid);
        if (!utils_1.default.isArray(parameters))
            parameters = [parameters];
        for (const parameter of parameters)
            if (!utils_1.default.isObject(parameter))
                return callback(invalid);
        const data = {
            owner_address: toHex(issuerAddress),
            parameters: parameters,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/proposalcreate', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    deleteProposal(proposalID, issuerAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.deleteProposal, proposalID, issuerAddress, options);
        if (this.validator.notValid([
            {
                name: 'issuer',
                type: 'address',
                value: issuerAddress,
            },
            {
                name: 'proposalID',
                type: 'integer',
                value: proposalID,
                gte: 0,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(issuerAddress),
            proposal_id: parseInt(proposalID.toString()),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/proposaldelete', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    voteProposal(proposalID, isApproval, voterAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.voteProposal, proposalID, isApproval, voterAddress, options);
        if (this.validator.notValid([
            {
                name: 'voter',
                type: 'address',
                value: voterAddress,
            },
            {
                name: 'proposalID',
                type: 'integer',
                value: proposalID,
                gte: 0,
            },
            {
                name: 'has approval',
                type: 'boolean',
                value: isApproval,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(voterAddress),
            proposal_id: parseInt(proposalID.toString()),
            is_add_approval: isApproval,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/proposalapprove', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    createTRXExchange(tokenName, tokenBalance, trxBalance, ownerAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.createTRXExchange, tokenName, tokenBalance, trxBalance, ownerAddress, options);
        if (this.validator.notValid([
            {
                name: 'owner',
                type: 'address',
                value: ownerAddress,
            },
            {
                name: 'token name',
                type: 'not-empty-string',
                value: tokenName,
            },
            {
                name: 'token balance',
                type: 'positive-integer',
                value: tokenBalance,
            },
            {
                name: 'trx balance',
                type: 'positive-integer',
                value: trxBalance,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(ownerAddress),
            first_token_id: fromUtf8(tokenName),
            first_token_balance: tokenBalance,
            second_token_id: '5f',
            second_token_balance: trxBalance,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/exchangecreate', data, 'post')
            .then((resources) => {
            callback(null, resources);
        })
            .catch((err) => callback(err));
    }
    createTokenExchange(firstTokenName, firstTokenBalance, secondTokenName, secondTokenBalance, ownerAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.createTokenExchange, firstTokenName, firstTokenBalance, secondTokenName, secondTokenBalance, ownerAddress, options);
        if (this.validator.notValid([
            {
                name: 'owner',
                type: 'address',
                value: ownerAddress,
            },
            {
                name: 'first token name',
                type: 'not-empty-string',
                value: firstTokenName,
            },
            {
                name: 'second token name',
                type: 'not-empty-string',
                value: secondTokenName,
            },
            {
                name: 'first token balance',
                type: 'positive-integer',
                value: firstTokenBalance,
            },
            {
                name: 'second token balance',
                type: 'positive-integer',
                value: secondTokenBalance,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(ownerAddress),
            first_token_id: fromUtf8(firstTokenName),
            first_token_balance: firstTokenBalance,
            second_token_id: fromUtf8(secondTokenName),
            second_token_balance: secondTokenBalance,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/exchangecreate', data, 'post')
            .then((resources) => {
            callback(null, resources);
        })
            .catch((err) => callback(err));
    }
    injectExchangeTokens(exchangeID, tokenName, tokenAmount = 0, ownerAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.injectExchangeTokens, exchangeID, tokenName, tokenAmount, ownerAddress, options);
        if (this.validator.notValid([
            {
                name: 'owner',
                type: 'address',
                value: ownerAddress,
            },
            {
                name: 'token name',
                type: 'not-empty-string',
                value: tokenName,
            },
            {
                name: 'token amount',
                type: 'integer',
                value: tokenAmount,
                gte: 1,
            },
            {
                name: 'exchangeID',
                type: 'integer',
                value: exchangeID,
                gte: 0,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(ownerAddress),
            exchange_id: parseInt(exchangeID.toString()),
            token_id: fromUtf8(tokenName),
            quant: parseInt(tokenAmount.toString()),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/exchangeinject', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    withdrawExchangeTokens(exchangeID, tokenName, tokenAmount = 0, ownerAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.withdrawExchangeTokens, exchangeID, tokenName, tokenAmount, ownerAddress, options);
        if (this.validator.notValid([
            {
                name: 'owner',
                type: 'address',
                value: ownerAddress,
            },
            {
                name: 'token name',
                type: 'not-empty-string',
                value: tokenName,
            },
            {
                name: 'token amount',
                type: 'integer',
                value: tokenAmount,
                gte: 1,
            },
            {
                name: 'exchangeID',
                type: 'integer',
                value: exchangeID,
                gte: 0,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(ownerAddress),
            exchange_id: parseInt(exchangeID.toString()),
            token_id: fromUtf8(tokenName),
            quant: parseInt(tokenAmount.toString()),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/exchangewithdraw', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    tradeExchangeTokens(exchangeID, tokenName, tokenAmountSold = 0, tokenAmountExpected = 0, ownerAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
        // if (utils.isFunction(ownerAddress)) {
        //     callback = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(ownerAddress)) {
        //     options = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // }
        if (!callback)
            return this.injectPromise(this.tradeExchangeTokens, exchangeID, tokenName, tokenAmountSold, tokenAmountExpected, ownerAddress, options);
        if (this.validator.notValid([
            {
                name: 'owner',
                type: 'address',
                value: ownerAddress,
            },
            {
                name: 'token name',
                type: 'not-empty-string',
                value: tokenName,
            },
            {
                name: 'tokenAmountSold',
                type: 'integer',
                value: tokenAmountSold,
                gte: 1,
            },
            {
                name: 'tokenAmountExpected',
                type: 'integer',
                value: tokenAmountExpected,
                gte: 1,
            },
            {
                name: 'exchangeID',
                type: 'integer',
                value: exchangeID,
                gte: 0,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(ownerAddress),
            exchange_id: parseInt(exchangeID.toString()),
            token_id: this.tronWeb.fromAscii(tokenName),
            quant: parseInt(tokenAmountSold.toString()),
            expected: parseInt(tokenAmountExpected.toString()),
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/exchangetransaction', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    updateSetting(contractAddress, userFeePercentage, ownerAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.updateSetting, contractAddress, userFeePercentage, ownerAddress, options);
        if (this.validator.notValid([
            {
                name: 'owner',
                type: 'address',
                value: ownerAddress,
            },
            {
                name: 'contract',
                type: 'address',
                value: contractAddress,
            },
            {
                name: 'userFeePercentage',
                type: 'integer',
                value: userFeePercentage,
                gte: 0,
                lte: 100,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(ownerAddress),
            contract_address: toHex(contractAddress),
            consume_user_resource_percent: userFeePercentage,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/updatesetting', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    updateEnergyLimit(contractAddress, originEnergyLimit, ownerAddress = this.tronWeb.defaultAddress.hex, options, callback) {
        if (!callback)
            return this.injectPromise(this.updateEnergyLimit, contractAddress, originEnergyLimit, ownerAddress, options);
        if (this.validator.notValid([
            {
                name: 'owner',
                type: 'address',
                value: ownerAddress,
            },
            {
                name: 'contract',
                type: 'address',
                value: contractAddress,
            },
            {
                name: 'originEnergyLimit',
                type: 'integer',
                value: originEnergyLimit,
                gte: 0,
                lte: 10000000,
            },
        ], callback))
            return;
        const data = {
            owner_address: toHex(ownerAddress),
            contract_address: toHex(contractAddress),
            origin_energy_limit: originEnergyLimit,
            Permission_id: options && options.permissionId
                ? options.permissionId
                : undefined,
        };
        this.tronWeb.fullNode
            .request('wallet/updateenergylimit', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    checkPermissions(permissions, type) {
        if (permissions) {
            if (permissions.type !== type ||
                !permissions.permission_name ||
                !utils_1.default.isString(permissions.permission_name) ||
                !utils_1.default.isInteger(permissions.threshold) ||
                permissions.threshold < 1 ||
                !permissions.keys)
                return false;
            for (const key of permissions.keys)
                if (!this.tronWeb.isAddress(key.address) ||
                    !utils_1.default.isInteger(key.weight) ||
                    key.weight > permissions.threshold ||
                    key.weight < 1 ||
                    (type === 2 && !permissions.operations))
                    return false;
        }
        return true;
    }
    updateAccountPermissions(ownerAddress = this.tronWeb.defaultAddress.hex, ownerPermissions, witnessPermissions, activesPermissions, callback) {
        if (!callback)
            return this.injectPromise(this.updateAccountPermissions, ownerAddress, ownerPermissions, witnessPermissions, activesPermissions);
        if (!this.tronWeb.isAddress(ownerAddress))
            return callback('Invalid ownerAddress provided');
        if (!this.checkPermissions(ownerPermissions, 0))
            return callback('Invalid ownerPermissions provided');
        if (!this.checkPermissions(witnessPermissions, 1))
            return callback('Invalid witnessPermissions provided');
        if (!Array.isArray(activesPermissions))
            activesPermissions = [activesPermissions];
        for (const activesPermission of activesPermissions)
            if (!this.checkPermissions(activesPermission, 2))
                return callback('Invalid activesPermissions provided');
        const data = {
            owner_address: ownerAddress,
            owner: undefined,
            witness: undefined,
            actives: [],
        };
        if (ownerPermissions)
            data.owner = ownerPermissions;
        if (witnessPermissions)
            data.witness = witnessPermissions;
        if (activesPermissions)
            data.actives = activesPermissions;
        this.tronWeb.fullNode
            .request('wallet/accountpermissionupdate', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }
    newTxID(transaction, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.newTxID, transaction);
            this.tronWeb.fullNode
                .request('wallet/getsignweight', transaction, 'post')
                .then((newTransaction) => {
                var _a;
                const inner = (_a = newTransaction.transaction) === null || _a === void 0 ? void 0 : _a.transaction;
                if (inner && typeof transaction.visible === 'boolean')
                    inner.visible = transaction.visible;
                callback(null, inner);
            })
                .catch(() => callback('Error generating a new transaction id.'));
        });
    }
    alterTransaction(transaction, 
    // eslint-disable-next-line @typescript-eslint/ban-types
    options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.alterTransaction, transaction, options);
            if (transaction.signature)
                return callback('You can not extend the expiration of a signed transaction.');
            if ('data' in options && options.data) {
                const { data } = options;
                let sData = options.dataFormat !== 'hex'
                    ? this.tronWeb.toHex(data)
                    : data;
                if (!utils_1.default.isString(sData))
                    throw new TypeError('Invalid data provided');
                sData = sData.replace(/^0x/, '');
                if (sData.length === 0)
                    return callback('Invalid data provided');
                transaction.raw_data.data = sData;
                options.data = sData;
            }
            if (options.extension) {
                options.extension = parseInt((options.extension * 1000).toString());
                if (isNaN(options.extension) ||
                    transaction.raw_data.expiration + options.extension <=
                        Date.now() + 3000)
                    return callback('Invalid extension provided');
                transaction.raw_data.expiration += options.extension;
            }
            this.newTxID(transaction, callback);
        });
    }
    extendExpiration(transaction, extension, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.extendExpiration, transaction, extension);
            this.alterTransaction(transaction, { extension }, callback);
        });
    }
    addUpdateData(transaction, data, dataFormat = 'utf8', callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.addUpdateData, transaction, data, dataFormat);
            this.alterTransaction(transaction, { data, dataFormat }, callback);
        });
    }
}
exports.default = TransactionBuilder;
//# sourceMappingURL=transactionBuilder.js.map