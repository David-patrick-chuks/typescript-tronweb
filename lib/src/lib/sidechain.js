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
const injectpromise_1 = __importDefault(require("injectpromise"));
const paramValidator_1 = __importDefault(require("../paramValidator"));
const INVALID_TX_MESSAGE = 'Invalid transaction provided';
class SideChain {
    constructor(sideOptions, TronWebCls, mainchain, privateKey) {
        this.depositTrc721 = (id, depositFee, feeLimit, contractAddress, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) => __awaiter(this, void 0, void 0, function* () {
            const functionSelector = 'depositTRC721';
            return this.depositTrc(functionSelector, id, depositFee, feeLimit, contractAddress, options, privateKey, callback);
        });
        this.mappingTrc721 = (trxHash, mappingFee, feeLimit, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) => __awaiter(this, void 0, void 0, function* () {
            const functionSelector = 'mappingTRC721';
            return this.mappingTrc(trxHash, mappingFee, feeLimit, functionSelector, options, privateKey, callback);
        });
        this.retryDeposit = (nonce, retryFee, feeLimit, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) => __awaiter(this, void 0, void 0, function* () {
            const functionSelector = 'retryDeposit';
            return this.depositTrc(functionSelector, nonce, retryFee, feeLimit, this.mainGatewayAddress, options, privateKey, callback);
        });
        this.retryMapping = (nonce, retryFee, feeLimit, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) => __awaiter(this, void 0, void 0, function* () {
            const functionSelector = 'retryMapping';
            return this.depositTrc(functionSelector, nonce, retryFee, feeLimit, this.mainGatewayAddress, options, privateKey, callback);
        });
        this.mainchain = mainchain;
        const { mainGatewayAddress, sideGatewayAddress, sideChainId } = sideOptions;
        if ('fullHost' in sideOptions)
            this.sidechain = new TronWebCls(sideOptions.fullHost, sideOptions.fullHost, sideOptions.fullHost, privateKey);
        else
            this.sidechain = new TronWebCls(sideOptions.fullNode, sideOptions.solidityNode, sideOptions.eventServer, privateKey);
        this.isAddress = this.mainchain.isAddress;
        this.utils = this.mainchain.utils;
        this.setMainGatewayAddress(mainGatewayAddress);
        this.setSideGatewayAddress(sideGatewayAddress);
        this.setChainId(sideChainId);
        this.injectPromise = (0, injectpromise_1.default)(this);
        this.validator = new paramValidator_1.default(this.sidechain);
        const self = this;
        // @ts-ignore
        this.sidechain.trx.sign = (...args) => {
            // @ts-ignore
            return self.sign(...args);
        };
        // @ts-ignore
        this.sidechain.trx.multiSign = (...args) => {
            // @ts-ignore
            return self.multiSign(...args);
        };
    }
    // TODO: this and two next must be setters
    setMainGatewayAddress(mainGatewayAddress) {
        if (!this.isAddress(mainGatewayAddress))
            throw new Error('Invalid main gateway address provided');
        this.mainGatewayAddress = mainGatewayAddress;
    }
    setSideGatewayAddress(sideGatewayAddress) {
        if (!this.isAddress(sideGatewayAddress))
            throw new Error('Invalid side gateway address provided');
        this.sideGatewayAddress = sideGatewayAddress;
    }
    setChainId(sideChainId) {
        if (!this.utils.isString(sideChainId) || !sideChainId)
            throw new Error('Invalid side chainId provided');
        this.chainId = sideChainId;
    }
    signTransaction(priKeyBytes, transaction) {
        if (typeof priKeyBytes === 'string')
            priKeyBytes = this.utils.code.hexStr2byteArray(priKeyBytes);
        const chainIdByteArr = this.utils.code.hexStr2byteArray(this.chainId);
        const _byteArr = this.utils.code.hexStr2byteArray(transaction.txID);
        // We're doing this once only, so performance effect is low
        const byteArr = new Uint8Array([..._byteArr, ...chainIdByteArr]);
        const byteArrHash = this.sidechain.utils.ethersUtils.sha256(byteArr);
        // eslint-disable-next-line new-cap
        const signature = this.utils.crypto.ECKeySign(this.utils.code.hexStr2byteArray(byteArrHash.replace(/^0x/, '')), priKeyBytes);
        if (Array.isArray(transaction.signature)) {
            if (!transaction.signature.includes(signature))
                transaction.signature.push(signature);
        }
        else {
            transaction.signature = [signature];
        }
        return transaction;
    }
    multiSign(transaction, privateKey = this.sidechain.defaultPrivateKey, permissionId, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.multiSign, transaction, privateKey, permissionId);
            if (!this.utils.isObject(transaction) ||
                !transaction.raw_data ||
                !transaction.raw_data.contract)
                return callback(INVALID_TX_MESSAGE);
            if (!transaction.raw_data.contract[0].Permission_id &&
                permissionId &&
                permissionId > 0) {
                // set permission id
                transaction.raw_data.contract[0].Permission_id = permissionId;
                // check if private key insides permission list
                const address = this.sidechain.address
                    .toHex(this.sidechain.address.fromPrivateKey(privateKey))
                    .toLowerCase();
                const signWeight = yield this.sidechain.trx.getSignWeight(transaction, permissionId);
                if (signWeight.result.code === 'PERMISSION_ERROR')
                    return callback(signWeight.result.message);
                let foundKey = false;
                if (signWeight.permission)
                    signWeight.permission.keys.map((key) => {
                        if (key.address === address)
                            foundKey = true;
                    });
                if (!foundKey)
                    return callback(privateKey + ' has no permission to sign');
                if (signWeight.approved_list &&
                    signWeight.approved_list.indexOf(address) !== -1)
                    return callback(privateKey + ' already sign transaction');
                // reset transaction
                if (signWeight.transaction && signWeight.transaction.transaction) {
                    transaction = signWeight.transaction.transaction;
                    transaction.raw_data.contract[0].Permission_id = permissionId;
                }
                else {
                    return callback(INVALID_TX_MESSAGE);
                }
            }
            // sign
            try {
                return callback(null, this.signTransaction(privateKey, transaction));
            }
            catch (ex) {
                callback(ex);
            }
        });
    }
    sign(transaction, privateKey = this.sidechain.defaultPrivateKey, useTronHeader = true, multisig = false, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.sign, transaction, privateKey, useTronHeader, multisig);
            // Message signing
            if (this.utils.isString(transaction)) {
                if (!this.utils.isHex(transaction))
                    return callback('Expected hex message input');
                try {
                    const signatureHex = this.sidechain.trx.signString(transaction, privateKey, useTronHeader);
                    return callback(null, signatureHex);
                }
                catch (ex) {
                    callback(ex);
                }
                return;
            }
            if (!this.utils.isObject(transaction))
                return callback(INVALID_TX_MESSAGE);
            if (!multisig && transaction.signature)
                return callback('Transaction is already signed');
            try {
                if (!multisig) {
                    const address = this.sidechain.address
                        .toHex(this.sidechain.address.fromPrivateKey(privateKey))
                        .toLowerCase();
                    if (address !==
                        this.sidechain.address.toHex(transaction.raw_data.contract[0].parameter.value
                            .owner_address))
                        return callback('Private key does not match address in transaction');
                }
                return callback(null, this.signTransaction(privateKey, transaction));
            }
            catch (ex) {
                callback(ex);
            }
        });
    }
    depositTrx(callValue, depositFee, feeLimit, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.depositTrx, callValue, depositFee, feeLimit, options, privateKey);
            if (this.validator.notValid([
                {
                    name: 'callValue',
                    type: 'integer',
                    value: callValue,
                    gte: 0,
                },
                {
                    name: 'depositFee',
                    type: 'integer',
                    value: depositFee,
                    gte: 0,
                },
                {
                    name: 'feeLimit',
                    type: 'integer',
                    value: feeLimit,
                    gte: 0,
                },
            ], callback))
                return;
            options = Object.assign({ callValue: Number(callValue) + Number(depositFee), feeLimit }, options);
            try {
                const contractInstance = yield this.mainchain
                    .contract()
                    .at(this.mainGatewayAddress);
                const result = yield contractInstance
                    .depositTRX()
                    .send(options, privateKey);
                return callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    depositTrc10(tokenId, tokenValue, depositFee, feeLimit, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.depositTrc10, tokenId, tokenValue, depositFee, feeLimit, options, privateKey);
            if (this.validator.notValid([
                {
                    name: 'tokenValue',
                    type: 'integer',
                    value: tokenValue,
                    gte: 0,
                },
                {
                    name: 'depositFee',
                    type: 'integer',
                    value: depositFee,
                    gte: 0,
                },
                {
                    name: 'feeLimit',
                    type: 'integer',
                    value: feeLimit,
                    gte: 0,
                },
                {
                    name: 'tokenId',
                    type: 'integer',
                    value: tokenId,
                    gte: 0,
                },
            ], callback))
                return;
            options = Object.assign(Object.assign({ tokenId,
                tokenValue,
                feeLimit }, options), { callValue: depositFee });
            try {
                const contractInstance = yield this.mainchain
                    .contract()
                    .at(this.mainGatewayAddress);
                const result = yield contractInstance
                    .depositTRC10(tokenId, tokenValue)
                    .send(options, privateKey);
                callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    depositTrc(functionSelector, num, fee, feeLimit, contractAddress, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.depositTrc, functionSelector, num, fee, feeLimit, contractAddress, options, privateKey);
            if (this.validator.notValid([
                {
                    name: 'functionSelector',
                    type: 'not-empty-string',
                    value: functionSelector,
                },
                {
                    name: 'num',
                    type: 'integer',
                    value: num,
                    gte: 0,
                },
                {
                    name: 'fee',
                    type: 'integer',
                    value: fee,
                    gte: 0,
                },
                {
                    name: 'feeLimit',
                    type: 'integer',
                    value: feeLimit,
                    gte: 0,
                },
                {
                    name: 'contractAddress',
                    type: 'address',
                    value: contractAddress,
                },
            ], callback))
                return;
            options = Object.assign(Object.assign({ feeLimit }, options), { callValue: fee, tokenId: '', tokenValue: 0 });
            try {
                let result = null;
                if (functionSelector === 'approve') {
                    const approveInstance = yield this.mainchain
                        .contract()
                        .at(contractAddress);
                    result = yield approveInstance
                        .approve(this.mainGatewayAddress, num)
                        .send(options, privateKey);
                }
                else {
                    const contractInstance = yield this.mainchain
                        .contract()
                        .at(this.mainGatewayAddress);
                    switch (functionSelector) {
                        case 'depositTRC20':
                        case 'depositTRC721':
                            result = yield contractInstance[functionSelector](contractAddress, num).send(options, privateKey);
                            break;
                        case 'retryDeposit':
                        case 'retryMapping':
                            result = yield contractInstance[functionSelector](num).send(options, privateKey);
                            break;
                        default:
                            break;
                    }
                }
                callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    approveTrc20(num, feeLimit, contractAddress, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const functionSelector = 'approve';
            return this.depositTrc(functionSelector, num, 0, feeLimit, contractAddress, options, privateKey, callback);
        });
    }
    approveTrc721(id, feeLimit, contractAddress, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const functionSelector = 'approve';
            return this.depositTrc(functionSelector, id, 0, feeLimit, contractAddress, options, privateKey, callback);
        });
    }
    depositTrc20(num, depositFee, feeLimit, contractAddress, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const functionSelector = 'depositTRC20';
            return this.depositTrc(functionSelector, num, depositFee, feeLimit, contractAddress, options, privateKey, callback);
        });
    }
    mappingTrc(trxHash, mappingFee, feeLimit, functionSelector, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.mappingTrc, trxHash, mappingFee, feeLimit, functionSelector, options, privateKey);
            if (this.validator.notValid([
                {
                    name: 'trxHash',
                    type: 'not-empty-string',
                    value: trxHash,
                },
                {
                    name: 'mappingFee',
                    type: 'integer',
                    value: mappingFee,
                    gte: 0,
                },
                {
                    name: 'feeLimit',
                    type: 'integer',
                    value: feeLimit,
                    gte: 0,
                },
            ], callback))
                return;
            trxHash = trxHash.startsWith('0x') ? trxHash : '0x' + trxHash;
            options = Object.assign(Object.assign({ feeLimit }, options), { callValue: mappingFee });
            try {
                const contractInstance = yield this.mainchain
                    .contract()
                    .at(this.mainGatewayAddress);
                let result = null;
                if (functionSelector === 'mappingTRC20')
                    result = yield contractInstance
                        .mappingTRC20(trxHash)
                        .send(options, privateKey);
                else if (functionSelector === 'mappingTRC721')
                    result = yield contractInstance
                        .mappingTRC721(trxHash)
                        .send(options, privateKey);
                else
                    callback(new Error('type must be trc20 or trc721'));
                callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    mappingTrc20(trxHash, mappingFee, feeLimit, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const functionSelector = 'mappingTRC20';
            return this.mappingTrc(trxHash, mappingFee, feeLimit, functionSelector, options, privateKey, callback);
        });
    }
    withdrawTrx(callValue, withdrawFee, feeLimit, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.withdrawTrx, callValue, withdrawFee, feeLimit, options, privateKey);
            if (this.validator.notValid([
                {
                    name: 'callValue',
                    type: 'integer',
                    value: callValue,
                    gte: 0,
                },
                {
                    name: 'withdrawFee',
                    type: 'integer',
                    value: withdrawFee,
                    gte: 0,
                },
                {
                    name: 'feeLimit',
                    type: 'integer',
                    value: feeLimit,
                    gte: 0,
                },
            ], callback))
                return;
            options = Object.assign({ callValue: Number(callValue) + Number(withdrawFee), feeLimit }, options);
            try {
                const contractInstance = yield this.sidechain
                    .contract()
                    .at(this.sideGatewayAddress);
                const result = yield contractInstance
                    .withdrawTRX()
                    .send(options, privateKey);
                return callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    withdrawTrc10(tokenId, tokenValue, withdrawFee, feeLimit, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.withdrawTrc10, tokenId, tokenValue, withdrawFee, feeLimit, options, privateKey);
            if (this.validator.notValid([
                {
                    name: 'tokenId',
                    type: 'integer',
                    value: tokenId,
                    gte: 0,
                },
                {
                    name: 'tokenValue',
                    type: 'integer',
                    value: tokenValue,
                    gte: 0,
                },
                {
                    name: 'withdrawFee',
                    type: 'integer',
                    value: withdrawFee,
                    gte: 0,
                },
                {
                    name: 'feeLimit',
                    type: 'integer',
                    value: feeLimit,
                    gte: 0,
                },
            ], callback))
                return;
            options = Object.assign({ tokenValue,
                tokenId, callValue: withdrawFee, feeLimit }, options);
            try {
                const contractInstance = yield this.sidechain
                    .contract()
                    .at(this.sideGatewayAddress);
                const result = yield contractInstance
                    .withdrawTRC10(tokenId, tokenValue)
                    .send(options, privateKey);
                return callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    withdrawTrc(functionSelector, numOrId, withdrawFee, feeLimit, contractAddress, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.withdrawTrc, functionSelector, numOrId, withdrawFee, feeLimit, contractAddress, options, privateKey);
            if (this.validator.notValid([
                {
                    name: 'functionSelector',
                    type: 'not-empty-string',
                    value: functionSelector,
                },
                {
                    name: 'numOrId',
                    type: 'integer',
                    value: numOrId,
                    gte: 0,
                },
                {
                    name: 'withdrawFee',
                    type: 'integer',
                    value: withdrawFee,
                    gte: 0,
                },
                {
                    name: 'feeLimit',
                    type: 'integer',
                    value: feeLimit,
                    gte: 0,
                },
                {
                    name: 'contractAddress',
                    type: 'address',
                    value: contractAddress,
                },
            ], callback))
                return;
            options = Object.assign(Object.assign({ feeLimit }, options), { callValue: withdrawFee });
            const contract = this.sidechain.contract([
                {
                    name: functionSelector.split('(')[0],
                    type: 'function',
                    stateMutability: 'nonpayable',
                    inputs: [{ type: 'uint256', name: '' }],
                    outputs: [],
                },
            ], contractAddress);
            const method = contract.methods[functionSelector];
            return (yield method(numOrId).send(options, privateKey, callback));
        });
    }
    withdrawTrc20(num, withdrawFee, feeLimit, contractAddress, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.withdrawTrc('withdrawal(uint256)', num, withdrawFee, feeLimit, contractAddress, options, privateKey, callback);
        });
    }
    withdrawTrc721(id, withdrawFee, feeLimit, contractAddress, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.withdrawTrc('withdrawal(uint256)', id, withdrawFee, feeLimit, contractAddress, options, privateKey, callback);
        });
    }
    injectFund(num, feeLimit, options = 'UNUSED (LEGACY?) ARGUMENT', privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.injectFund, num, feeLimit, options, privateKey);
            if (this.validator.notValid([
                {
                    name: 'num',
                    type: 'integer',
                    value: num,
                    gte: 0,
                },
                {
                    name: 'feeLimit',
                    type: 'integer',
                    value: feeLimit,
                    gte: 0,
                },
            ], callback))
                return;
            try {
                const address = this.sidechain.address.fromPrivateKey(privateKey);
                const hexAddress = this.sidechain.address.toHex(address);
                const transaction = yield this.sidechain.fullNode.request('/wallet/fundinject', {
                    owner_address: hexAddress,
                    amount: num,
                }, 'post');
                const signedTransaction = yield this.sidechain.trx.sign(transaction, privateKey);
                if (!signedTransaction.signature) {
                    if (!privateKey)
                        return callback('Transaction was not signed properly');
                    return callback('Invalid private key provided');
                }
                const broadcast = yield this.sidechain.trx.sendRawTransaction(signedTransaction);
                if (broadcast.code) {
                    const err = {
                        error: broadcast.code,
                        message: broadcast.code,
                    };
                    if (broadcast.message)
                        err.message = this.mainchain.toUtf8(broadcast.message);
                    return callback(err);
                }
                return callback(null, signedTransaction.txID);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    retryWithdraw(nonce, retryFee, feeLimit, options = {}, privateKey = this.mainchain.defaultPrivateKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const functionSelector = 'retryWithdraw(uint256)';
            return this.withdrawTrc(functionSelector, nonce, retryFee, feeLimit, this.sideGatewayAddress, options, privateKey, callback);
        });
    }
}
exports.default = SideChain;
//# sourceMappingURL=sidechain.js.map