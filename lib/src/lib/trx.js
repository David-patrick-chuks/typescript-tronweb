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
exports.ResourceT = void 0;
const __1 = __importDefault(require(".."));
const _base_1 = require("../../src/utils/_base");
const paramValidator_1 = __importDefault(require("../paramValidator"));
const utils_1 = __importDefault(require("../utils"));
const address_1 = require("../utils/address");
const ethersUtils_1 = require("../utils/ethersUtils");
var common_1 = require("../proto/core/contract/common");
Object.defineProperty(exports, "ResourceT", { enumerable: true, get: function () { return common_1.ResourceCode; } });
const TRX_MESSAGE_HEADER = '\x19TRON Signed Message:\n32';
// it should be: '\x15TRON Signed Message:\n32';
const ETH_MESSAGE_HEADER = '\x19Ethereum Signed Message:\n32';
function toHex(value) {
    return __1.default.address.toHex(value);
}
const INVALID_ADDRESS_MSG = 'Invalid address provided';
const INVALID_TOKEN_ID_MSG = 'Invalid token ID provided';
const TOKEN_DOES_NOT_EXIST_MSG = 'Token does not exist';
const INVALID_TRANSACTION_MSG = 'Invalid transaction provided';
const INVALID_AMOUNT_MSG = 'Invalid amount provided';
const NEED_PK_OR_ADDRESS_MSG = 'Function requires either a private key or address to be set';
class Trx extends _base_1.WithTronwebAndInjectpromise {
    constructor(tronWeb) {
        super(tronWeb);
        this.signMessage = this.sign.bind(this);
        this.sendAsset = this.sendToken.bind(this);
        this.send = this.sendTransaction.bind(this);
        this.sendTrx = this.sendTransaction.bind(this);
        this.broadcast = this.sendRawTransaction.bind(this);
        this.broadcastHex = this.sendHexTransaction.bind(this);
        this.signTransaction = this.sign.bind(this);
        this.getUnconfirmedTransactionInfo = this.getUnconfirmedTransaction.bind(this);
        this.cache = {
            contracts: {},
        };
        this.validator = new paramValidator_1.default(tronWeb);
    }
    _parseToken(token) {
        return Object.assign(Object.assign({}, token), { name: this.tronWeb.toUtf8(token.name), abbr: token.abbr && this.tronWeb.toUtf8(token.abbr), description: token.description && this.tronWeb.toUtf8(token.description), url: token.url && this.tronWeb.toUtf8(token.url) });
    }
    getCurrentBlock(callback) {
        if (!callback)
            return this.injectPromise(this.getCurrentBlock);
        this.tronWeb.fullNode
            .request('wallet/getnowblock')
            .then((block) => {
            callback(null, block);
        })
            .catch((err) => callback(err));
    }
    getConfirmedCurrentBlock(callback) {
        if (!callback)
            return this.injectPromise(this.getConfirmedCurrentBlock);
        this.tronWeb.solidityNode
            .request('walletsolidity/getnowblock')
            .then((block) => {
            callback(null, block);
        })
            .catch((err) => callback(err));
    }
    getBlock(block = this.tronWeb.defaultBlock, callback) {
        if (!callback)
            return this.injectPromise(this.getBlock, block);
        if (block === null)
            return callback('No block identifier provided');
        if (block === 'earliest')
            block = 0;
        if (block === 'latest')
            return this.getCurrentBlock(callback);
        // TODO: can we drop this weird isNaN for string?..
        // if (isNaN(block as any as number) && utils.isHex(block))
        if (utils_1.default.isHex(block))
            return this.getBlockByHash(block, callback);
        this.getBlockByNumber(block, callback);
    }
    getBlockByHash(blockHash, callback) {
        if (!callback)
            return this.injectPromise(this.getBlockByHash, blockHash);
        this.tronWeb.fullNode
            .request('wallet/getblockbyid', {
            value: blockHash,
        }, 'post')
            .then((block) => {
            if (!Object.keys(block).length)
                return callback('Block not found');
            callback(null, block);
        })
            .catch((err) => callback(err));
    }
    getBlockByNumber(blockID, callback) {
        if (!callback)
            return this.injectPromise(this.getBlockByNumber, blockID);
        if (!utils_1.default.isInteger(blockID) || blockID < 0)
            return callback('Invalid block number provided');
        this.tronWeb.fullNode
            .request('wallet/getblockbynum', { num: parseInt(blockID.toString()) }, 'post')
            .then((block) => {
            if (!Object.keys(block).length)
                return callback('Block not found');
            callback(null, block);
        })
            .catch((err) => callback(err));
    }
    getBlockTransactionCount(block = this.tronWeb.defaultBlock, callback) {
        if (!callback)
            return this.injectPromise(this.getBlockTransactionCount, block);
        this.getBlock(block)
            .then(({ transactions = [] }) => {
            callback(null, transactions.length);
        })
            .catch((err) => callback(err));
    }
    getTransactionFromBlock(block = this.tronWeb.defaultBlock, index, callback) {
        if (!callback)
            return this.injectPromise(this.getTransactionFromBlock, block, index);
        this.getBlock(block)
            .then(({ transactions }) => {
            if (!transactions)
                callback('Transaction not found in block');
            else if (typeof index === 'number')
                if (index >= 0 && index < transactions.length)
                    callback(null, transactions[index]);
                else
                    callback('Invalid transaction index provided');
            else
                callback(null, transactions);
        })
            .catch((err) => callback(err));
    }
    getTransaction(transactionID, callback) {
        if (!callback)
            return this.injectPromise(this.getTransaction, transactionID);
        this.tronWeb.fullNode
            .request('wallet/gettransactionbyid', { value: transactionID }, 'post')
            .then((transaction) => {
            if (!Object.keys(transaction).length)
                return callback('Transaction not found');
            callback(null, transaction);
        })
            .catch((err) => callback(err));
    }
    getConfirmedTransaction(transactionID, callback) {
        if (!callback)
            return this.injectPromise(this.getConfirmedTransaction, transactionID);
        this.tronWeb.solidityNode
            .request('walletsolidity/gettransactionbyid', { value: transactionID }, 'post')
            .then((transaction) => {
            if (!Object.keys(transaction).length)
                return callback('Transaction not found');
            callback(null, transaction);
        })
            .catch((err) => callback(err));
    }
    getUnconfirmedTransaction(transactionID, callback) {
        return this._getTransactionInfoById(transactionID, { confirmed: false }, callback);
    }
    getTransactionInfo(transactionID, callback) {
        return this._getTransactionInfoById(transactionID, { confirmed: true }, callback);
    }
    _getTransactionInfoById(transactionID, options, callback) {
        if (!callback)
            return this.injectPromise(this._getTransactionInfoById, transactionID, options);
        if (options.confirmed)
            this.tronWeb.solidityNode
                .request('wallet/gettransactioninfobyid', { value: transactionID }, 'post')
                .then((transaction) => {
                callback(null, transaction);
            })
                .catch((err) => callback(err));
        else
            this.tronWeb.fullNode
                .request('walletsolidity/gettransactioninfobyid', { value: transactionID }, 'post')
                .then((transaction) => {
                callback(null, transaction);
            })
                .catch((err) => callback(err));
    }
    getTransactionsToAddress(address = this.tronWeb.defaultAddress.hex, limit = 30, offset = 0, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getTransactionsRelated(address, 'to', limit, offset, callback);
        });
    }
    getTransactionsFromAddress(address = this.tronWeb.defaultAddress.hex, limit = 30, offset = 0, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getTransactionsRelated(address, 'from', limit, offset, callback);
        });
    }
    getTransactionsRelated(address = this.tronWeb.defaultAddress.hex, direction = 'all', limit = 30, offset = 0, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.getTransactionsRelated, address, direction, limit, offset);
            if (!['to', 'from', 'all'].includes(direction))
                return callback('Invalid direction provided: Expected "to", "from" or "all"');
            if (direction === 'all')
                try {
                    const [from, to] = yield Promise.all([
                        this.getTransactionsRelated(address, 'from', limit, offset),
                        this.getTransactionsRelated(address, 'to', limit, offset),
                    ]);
                    return callback(null, [
                        ...from.map((tx) => ((tx.direction = 'from'), tx)),
                        ...to.map((tx) => ((tx.direction = 'to'), tx)),
                    ].sort((a, b) => {
                        return b.raw_data.timestamp - a.raw_data.timestamp;
                    }));
                }
                catch (ex) {
                    return callback(ex);
                }
            if (!this.tronWeb.isAddress(address))
                return callback(INVALID_ADDRESS_MSG);
            if (!utils_1.default.isInteger(limit) || limit < 0 || (offset && limit < 1))
                return callback('Invalid limit provided');
            if (!utils_1.default.isInteger(offset) || offset < 0)
                return callback('Invalid offset provided');
            address = this.tronWeb.address.toHex(address);
            this.tronWeb.solidityNode
                .request(`walletextension/gettransactions${direction}this`, {
                account: {
                    address,
                },
                offset,
                limit,
            }, 'post')
                .then(({ transaction }) => {
                callback(null, transaction);
            })
                .catch((err) => callback(err));
        });
    }
    getAccount(address = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.getAccount, address);
        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);
        address = this.tronWeb.address.toHex(address);
        this.tronWeb.solidityNode
            .request('walletsolidity/getaccount', { address }, 'post')
            .then((account) => {
            callback(null, account);
        })
            .catch((err) => callback(err));
    }
    getAccountById(id, callback) {
        if (!callback)
            return this.injectPromise(this.getAccountById, id);
        this.getAccountInfoById(id, { confirmed: true }, callback);
    }
    getAccountInfoById(id, options, callback) {
        if (this.validator.notValid([
            {
                name: 'accountId',
                type: 'hex',
                value: id,
            },
            {
                name: 'accountId',
                type: 'string',
                lte: 32,
                gte: 8,
                value: id,
            },
        ], callback))
            return;
        if (id.startsWith('0x'))
            id = id.slice(2);
        if (options && options.confirmed)
            this.tronWeb.solidityNode
                .request('walletsolidity/getaccountbyid', { account_id: id }, 'post')
                .then((account) => {
                callback(null, account);
            })
                .catch((err) => callback(err));
        else
            this.tronWeb.fullNode
                .request('wallet/getaccountbyid', { account_id: id }, 'post')
                .then((account) => {
                callback(null, account);
            })
                .catch((err) => callback(err));
    }
    getBalance(address = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.getBalance, address);
        this.getAccount(address)
            .then(({ balance = 0 }) => {
            callback(null, balance);
        })
            .catch((err) => callback(err));
    }
    getUnconfirmedAccount(address = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.getUnconfirmedAccount, address);
        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);
        address = this.tronWeb.address.toHex(address);
        this.tronWeb.fullNode
            .request('wallet/getaccount', { address }, 'post')
            .then((account) => {
            callback(null, account);
        })
            .catch((err) => callback(err));
    }
    getUnconfirmedAccountById(id, callback) {
        if (!callback)
            return this.injectPromise(this.getUnconfirmedAccountById, id);
        this.getAccountInfoById(id, { confirmed: false }, callback);
    }
    getUnconfirmedBalance(address = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.getUnconfirmedBalance, address);
        this.getUnconfirmedAccount(address)
            .then(({ balance = 0 }) => {
            callback(null, balance);
        })
            .catch((err) => callback(err));
    }
    getBandwidth(address = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.getBandwidth, address);
        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);
        address = this.tronWeb.address.toHex(address);
        this.tronWeb.fullNode
            .request('wallet/getaccountnet', { address }, 'post')
            .then(({ freeNetUsed = 0, freeNetLimit = 0, NetUsed = 0, NetLimit = 0, }) => {
            callback(null, freeNetLimit - freeNetUsed + (NetLimit - NetUsed));
        })
            .catch((err) => callback(err));
    }
    getTokensIssuedByAddress(address = this.tronWeb.defaultAddress.hex, callback) {
        if (!callback)
            return this.injectPromise(this.getTokensIssuedByAddress, address);
        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);
        address = this.tronWeb.address.toHex(address);
        this.tronWeb.fullNode
            .request('wallet/getassetissuebyaccount', { address }, 'post')
            .then(({ assetIssue }) => {
            if (!assetIssue)
                return callback(null, {});
            const tokens = assetIssue
                .map((token) => this._parseToken(token))
                .reduce((tokens, token) => {
                return (tokens[token.name] = token), tokens;
            }, {});
            callback(null, tokens);
        })
            .catch((err) => callback(err));
    }
    getTokenFromID(tokenID, callback) {
        if (!callback)
            return this.injectPromise(this.getTokenFromID, tokenID);
        if (utils_1.default.isInteger(tokenID))
            tokenID = tokenID.toString();
        if (!utils_1.default.isString(tokenID) || !tokenID.length)
            return callback(INVALID_TOKEN_ID_MSG);
        this.tronWeb.fullNode
            .request('wallet/getassetissuebyname', { value: this.tronWeb.fromUtf8(tokenID) }, 'post')
            .then((token) => {
            if (!token.name)
                return callback(TOKEN_DOES_NOT_EXIST_MSG);
            callback(null, this._parseToken(token));
        })
            .catch((err) => callback(err));
    }
    listNodes(callback) {
        if (!callback)
            return this.injectPromise(this.listNodes);
        this.tronWeb.fullNode
            .request('wallet/listnodes')
            .then(({ nodes = [] }) => {
            callback(null, nodes.map(({ address: a }) => `${this.tronWeb.toUtf8(a.host)}:${a.port}`));
        })
            .catch((err) => callback(err));
    }
    getBlockRange(start = 0, end = 30, callback) {
        if (!callback)
            return this.injectPromise(this.getBlockRange, start, end);
        if (!utils_1.default.isInteger(start) || start < 0)
            return callback('Invalid start of range provided');
        if (!utils_1.default.isInteger(end) || end <= start)
            return callback('Invalid end of range provided');
        this.tronWeb.fullNode
            .request('wallet/getblockbylimitnext', {
            startNum: parseInt(start.toString()),
            endNum: parseInt(end.toString()) + 1,
        }, 'post')
            .then(({ block = [] }) => {
            callback(null, block);
        })
            .catch((err) => callback(err));
    }
    listSuperRepresentatives(callback) {
        if (!callback)
            return this.injectPromise(this.listSuperRepresentatives);
        this.tronWeb.fullNode
            .request('wallet/listwitnesses')
            .then(({ witnesses = [] }) => {
            callback(null, witnesses);
        })
            .catch((err) => callback(err));
    }
    listTokens(limit = 0, offset = 0, callback) {
        if (!callback)
            return this.injectPromise(this.listTokens, limit, offset);
        if (!utils_1.default.isInteger(limit) || limit < 0 || (offset && limit < 1))
            return callback('Invalid limit provided');
        if (!utils_1.default.isInteger(offset) || offset < 0)
            return callback('Invalid offset provided');
        if (!limit)
            return this.tronWeb.fullNode
                .request('wallet/getassetissuelist')
                .then(({ assetIssue = [] }) => {
                callback(null, assetIssue.map((token) => this._parseToken(token)));
            })
                .catch((err) => callback(err));
        this.tronWeb.fullNode
            .request('wallet/getpaginatedassetissuelist', {
            offset: parseInt(offset.toString()),
            limit: parseInt(limit.toString()),
        }, 'post')
            .then(({ assetIssue = [] }) => {
            callback(null, assetIssue.map((token) => this._parseToken(token)));
        })
            .catch((err) => callback(err));
    }
    timeUntilNextVoteCycle(callback) {
        if (!callback)
            return this.injectPromise(this.timeUntilNextVoteCycle);
        this.tronWeb.fullNode
            .request('wallet/getnextmaintenancetime')
            .then(({ num = -1 }) => {
            if (num === -1)
                return callback('Failed to get time until next vote cycle');
            callback(null, Math.floor(num / 1000));
        })
            .catch((err) => callback(err));
    }
    getContract(contractAddress, callback) {
        if (!callback)
            return this.injectPromise(this.getContract, contractAddress);
        if (!this.tronWeb.isAddress(contractAddress))
            return callback('Invalid contract address provided');
        if (this.cache.contracts[contractAddress]) {
            callback(null, this.cache.contracts[contractAddress]);
            return undefined;
        }
        contractAddress = this.tronWeb.address.toHex(contractAddress);
        this.tronWeb.fullNode
            .request('wallet/getcontract', { value: contractAddress })
            .then((contract) => {
            if ('Error' in contract)
                return callback('Contract does not exist');
            this.cache.contracts[contractAddress] = contract;
            callback(null, contract);
        })
            .catch((err) => callback(err));
    }
    verifyMessage(message, signature, address = this.tronWeb.defaultAddress.base58, useTronHeader = true, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.verifyMessage, message, signature, address, useTronHeader);
            if (!utils_1.default.isHex(message))
                return callback('Expected hex message input');
            if (Trx.verifySignature(message, address, signature, useTronHeader))
                return callback(null, true);
            callback('Signature does not match');
        });
    }
    static verifySignature(message, address, signature, useTronHeader = true) {
        message = message.replace(/^0x/, '');
        signature = signature.replace(/^0x/, '');
        const messageBytes = [
            ...(0, ethersUtils_1.toUtf8Bytes)(useTronHeader ? TRX_MESSAGE_HEADER : ETH_MESSAGE_HEADER),
            ...utils_1.default.code.hexStr2byteArray(message),
        ];
        const messageDigest = (0, ethersUtils_1.keccak256)(messageBytes);
        const recovered = (0, ethersUtils_1.recoverAddress)(messageDigest, {
            recoveryParam: signature.substring(128, 130) === '1c' ? 1 : 0,
            r: '0x' + signature.substring(0, 64),
            s: '0x' + signature.substring(64, 128),
        });
        const tronAddress = address_1.ADDRESS_PREFIX + recovered.substr(2);
        const base58Address = __1.default.address.fromHex(tronAddress);
        return base58Address === __1.default.address.fromHex(address);
    }
    verifyMessageV2(message, signature, options, callback) {
        if (utils_1.default.isFunction(options))
            return this.verifyMessageV2(message, signature, undefined, options);
        if (!callback)
            return this.injectPromise(this.verifyMessageV2, message, signature, options);
        try {
            const base58Address = Trx.verifyMessageV2(message, signature);
            callback(null, base58Address);
        }
        catch (ex) {
            callback(ex);
        }
    }
    static verifyMessageV2(message, signature) {
        return utils_1.default.message.verifyMessage(message, signature);
    }
    verifyTypedData(domain, types, value, signature, address = this.tronWeb.defaultAddress.base58, callback) {
        if (!callback)
            return this.injectPromise(this.verifyTypedData, domain, types, value, signature, address);
        if (Trx.verifyTypedData(domain, types, value, signature, address))
            return callback(null, true);
        callback('Signature does not match');
    }
    static verifyTypedData(domain, types, value, signature, address) {
        signature = signature.replace(/^0x/, '');
        const messageDigest = utils_1.default._TypedDataEncoder.hash(domain, types, value);
        const recovered = (0, ethersUtils_1.recoverAddress)(messageDigest, {
            recoveryParam: signature.substring(128, 130) === '1c' ? 1 : 0,
            r: '0x' + signature.substring(0, 64),
            s: '0x' + signature.substring(64, 128),
        });
        const tronAddress = address_1.ADDRESS_PREFIX + recovered.substr(2);
        const base58Address = __1.default.address.fromHex(tronAddress);
        return base58Address === __1.default.address.fromHex(address);
    }
    sign(transaction, privateKey = this.tronWeb.defaultAddress.hex, useTronHeader = false, multisig = false, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.sign, transaction, privateKey, useTronHeader, multisig);
            // Message signing
            if (utils_1.default.isString(transaction)) {
                if (!utils_1.default.isHex(transaction))
                    return callback('Expected hex message input');
                try {
                    const signatureHex = Trx.signString(transaction, privateKey, useTronHeader);
                    return callback(null, signatureHex);
                }
                catch (ex) {
                    callback(ex);
                }
            }
            if (!utils_1.default.isObject(transaction))
                return callback(INVALID_TRANSACTION_MSG);
            if (!multisig && transaction.signature)
                return callback('Transaction is already signed');
            try {
                if (!multisig) {
                    const address = this.tronWeb.address
                        .toHex(this.tronWeb.address.fromPrivateKey(privateKey))
                        .toLowerCase();
                    if (address !==
                        this.tronWeb.address.toHex(transaction.raw_data.contract[0].parameter.value
                            .owner_address))
                        return callback('Private key does not match address in transaction');
                }
                return callback(null, utils_1.default.crypto.signTransaction(privateKey, transaction));
            }
            catch (ex) {
                callback(ex);
            }
        });
    }
    static signString(message, privateKey, useTronHeader = true) {
        message = message.replace(/^0x/, '');
        const value = {
            toHexString: function () {
                return '0x' + privateKey;
            },
            value: privateKey,
        };
        const signingKey = new ethersUtils_1.SigningKey(value);
        const messageBytes = [
            ...(0, ethersUtils_1.toUtf8Bytes)(useTronHeader ? TRX_MESSAGE_HEADER : ETH_MESSAGE_HEADER),
            ...utils_1.default.code.hexStr2byteArray(message),
        ];
        const messageDigest = (0, ethersUtils_1.keccak256)(messageBytes);
        const signature = signingKey.signDigest(messageDigest);
        return [
            '0x',
            signature.r.substring(2),
            signature.s.substring(2),
            Number(signature.v).toString(16),
        ].join('');
    }
    signString(message, privateKey, useTronHeader = true) {
        return Trx.signString(message, privateKey, useTronHeader);
    }
    signMessageV2(message, privateKey = this.tronWeb.defaultPrivateKey, options, callback) {
        if (!callback)
            return this.injectPromise(this.signMessageV2, message, privateKey);
        try {
            const signatureHex = Trx.signMessageV2(message, privateKey);
            return callback(null, signatureHex);
        }
        catch (ex) {
            callback(ex);
        }
    }
    static signMessageV2(message, privateKey) {
        return utils_1.default.message.signMessage(message, privateKey);
    }
    _signTypedData(domain, types, value, privateKey = this.tronWeb
        .defaultPrivateKey, callback) {
        if (utils_1.default.isFunction(privateKey))
            return this._signTypedData(domain, types, value, this.tronWeb.defaultPrivateKey, privateKey);
        if (!callback)
            return this.injectPromise(this._signTypedData, domain, types, value, privateKey);
        try {
            const signatureHex = Trx._signTypedData(domain, types, value, privateKey);
            return callback(null, signatureHex);
        }
        catch (ex) {
            callback(ex);
        }
    }
    static _signTypedData(domain, types, value, privateKey) {
        return utils_1.default.crypto._signTypedData(domain, types, value, privateKey);
    }
    multiSign(transaction, privateKey = this.tronWeb.defaultPrivateKey, permissionId = 0, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.multiSign, transaction, privateKey, permissionId);
            if (!utils_1.default.isObject(transaction) ||
                !transaction.raw_data ||
                !transaction.raw_data.contract)
                return callback(INVALID_TRANSACTION_MSG);
            // If owner permission or permission id exists in transaction, do sign directly
            // If no permission id inside transaction or user passes permission id,
            // use old way to reset permission id
            if (!transaction.raw_data.contract[0].Permission_id &&
                permissionId > 0) {
                // set permission id
                transaction.raw_data.contract[0].Permission_id = permissionId;
                // check if private key insides permission list
                const address = this.tronWeb.address
                    .toHex(this.tronWeb.address.fromPrivateKey(privateKey))
                    .toLowerCase();
                const signWeight = yield this.getSignWeight(transaction, permissionId);
                let foundKey = false;
                signWeight.permission &&
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
                    if (permissionId > 0)
                        transaction.raw_data.contract[0].Permission_id =
                            permissionId;
                }
                else {
                    return callback(INVALID_TRANSACTION_MSG);
                }
            }
            // sign
            try {
                return callback(null, utils_1.default.crypto.signTransaction(privateKey, transaction));
            }
            catch (ex) {
                callback(ex);
            }
        });
    }
    getApprovedList(transaction, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.getApprovedList, transaction);
            if (!utils_1.default.isObject(transaction))
                return callback(INVALID_TRANSACTION_MSG);
            this.tronWeb.fullNode
                .request('wallet/getapprovedlist', transaction, 'post')
                .then((result) => {
                callback(null, result);
            })
                .catch((err) => callback(err));
        });
    }
    getSignWeight(transaction, permissionId, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.getSignWeight, transaction, permissionId);
            if (!utils_1.default.isObject(transaction) ||
                !transaction.raw_data ||
                !transaction.raw_data.contract)
                return callback(INVALID_TRANSACTION_MSG);
            if (utils_1.default.isInteger(permissionId))
                transaction.raw_data.contract[0].Permission_id = parseInt(permissionId.toString());
            else if (typeof transaction.raw_data.contract[0].Permission_id !== 'number')
                transaction.raw_data.contract[0].Permission_id = 0;
            if (!utils_1.default.isObject(transaction))
                return callback(INVALID_TRANSACTION_MSG);
            this.tronWeb.fullNode
                .request('wallet/getsignweight', transaction, 'post')
                .then((result) => {
                callback(null, result);
            })
                .catch((err) => callback(err));
        });
    }
    sendRawTransaction(signedTransaction, options, callback) {
        if (!callback)
            return this.injectPromise(this.sendRawTransaction, signedTransaction, options);
        if (!utils_1.default.isObject(signedTransaction))
            return callback(INVALID_TRANSACTION_MSG);
        if (!signedTransaction.signature ||
            !utils_1.default.isArray(signedTransaction.signature))
            return callback('Transaction is not signed');
        this.tronWeb.fullNode
            .request('wallet/broadcasttransaction', signedTransaction, 'post')
            .then((result) => {
            const r = result;
            if (r.result)
                r.transaction = signedTransaction;
            callback(null, r);
        })
            .catch((err) => callback(err));
    }
    sendHexTransaction(signedHexTransaction, options, callback) {
        if (!callback)
            return this.injectPromise(this.sendHexTransaction, signedHexTransaction, options);
        if (!utils_1.default.isHex(signedHexTransaction))
            return callback('Invalid hex transaction provided');
        const params = {
            transaction: signedHexTransaction,
        };
        this.tronWeb.fullNode
            .request('wallet/broadcasthex', params, 'post')
            .then((result) => {
            if (result.result) {
                result.transaction = JSON.parse(result.transaction);
                result.hexTransaction = signedHexTransaction;
            }
            callback(null, result);
        })
            .catch((err) => callback(err));
    }
    sendTransaction(to, amount, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options === 'string')
                options = { privateKey: options };
            if (!callback)
                return this.injectPromise(this.sendTransaction, to, amount, options);
            if (!this.tronWeb.isAddress(to))
                return callback('Invalid recipient provided');
            if (!utils_1.default.isInteger(amount) || amount <= 0)
                return callback(INVALID_AMOUNT_MSG);
            options = Object.assign({ privateKey: this.tronWeb.defaultPrivateKey, address: this.tronWeb.defaultAddress.hex }, options);
            if (!options.privateKey && !options.address)
                return callback(NEED_PK_OR_ADDRESS_MSG);
            try {
                const address = (options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address);
                const transaction = yield this.tronWeb.transactionBuilder.sendTrx(to, amount, address);
                const signedTransaction = yield this.sign(transaction, options.privateKey || undefined);
                const result = yield this.sendRawTransaction(signedTransaction);
                return callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    sendToken(to, amount, tokenID, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options === 'string')
                options = { privateKey: options };
            if (!callback)
                return this.injectPromise(this.sendToken, to, amount, tokenID, options);
            if (!this.tronWeb.isAddress(to))
                return callback('Invalid recipient provided');
            if (!utils_1.default.isInteger(amount) || amount <= 0)
                return callback(INVALID_AMOUNT_MSG);
            if (utils_1.default.isInteger(tokenID))
                tokenID = tokenID.toString();
            if (!utils_1.default.isString(tokenID))
                return callback(INVALID_TOKEN_ID_MSG);
            options = Object.assign({ privateKey: this.tronWeb.defaultPrivateKey, address: this.tronWeb.defaultAddress.hex }, options);
            if (!options.privateKey && !options.address)
                return callback(NEED_PK_OR_ADDRESS_MSG);
            try {
                const address = (options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address);
                const transaction = yield this.tronWeb.transactionBuilder.sendToken(to, amount, tokenID, address);
                const signedTransaction = yield this.sign(transaction, options.privateKey || undefined);
                const result = yield this.sendRawTransaction(signedTransaction);
                return callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    freezeBalance(amount, duration = 3, resource = 'BANDWIDTH', options = {}, receiverAddress, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options === 'string')
                options = { privateKey: options };
            if (!callback)
                return this.injectPromise(this.freezeBalance, amount, duration, resource, options, receiverAddress);
            if (!['BANDWIDTH', 'ENERGY'].includes(resource))
                return callback('Invalid resource provided: Expected "BANDWIDTH" or "ENERGY"');
            if (!utils_1.default.isInteger(amount) || amount <= 0)
                return callback(INVALID_AMOUNT_MSG);
            if (!utils_1.default.isInteger(duration) || duration < 3)
                return callback('Invalid duration provided, minimum of 3 days');
            options = Object.assign({ privateKey: this.tronWeb.defaultPrivateKey, address: this.tronWeb.defaultAddress.hex }, options);
            if (!options.privateKey && !options.address)
                return callback(NEED_PK_OR_ADDRESS_MSG);
            try {
                const address = (options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address);
                const freezeBalance = yield this.tronWeb.transactionBuilder.freezeBalance(amount, duration, resource, address, receiverAddress);
                const signedTransaction = yield this.sign(freezeBalance, options.privateKey || undefined);
                const result = yield this.sendRawTransaction(signedTransaction);
                return callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    unfreezeBalance(resource = 'BANDWIDTH', options = {}, receiverAddress, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options === 'string')
                options = { privateKey: options };
            if (!callback)
                return this.injectPromise(this.unfreezeBalance, resource, options, receiverAddress);
            if (!['BANDWIDTH', 'ENERGY'].includes(resource))
                return callback('Invalid resource provided: Expected "BANDWIDTH" or "ENERGY"');
            options = Object.assign({ privateKey: this.tronWeb.defaultPrivateKey, address: this.tronWeb.defaultAddress.hex }, options);
            if (!options.privateKey && !options.address)
                return callback(NEED_PK_OR_ADDRESS_MSG);
            try {
                const address = (options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address);
                const unfreezeBalance = yield this.tronWeb.transactionBuilder.unfreezeBalance(resource, address, receiverAddress);
                const signedTransaction = yield this.sign(unfreezeBalance, options.privateKey || undefined);
                const result = yield this.sendRawTransaction(signedTransaction);
                return callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    updateAccount(accountName, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options === 'string')
                options = { privateKey: options };
            if (!callback)
                return this.injectPromise(this.updateAccount, accountName, options);
            if (!utils_1.default.isString(accountName) || !accountName.length)
                return callback('Name must be a string');
            options = Object.assign({ privateKey: this.tronWeb.defaultPrivateKey, address: this.tronWeb.defaultAddress.hex }, options);
            if (!options.privateKey && !options.address)
                return callback(NEED_PK_OR_ADDRESS_MSG);
            try {
                const address = (options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address);
                const updateAccount = yield this.tronWeb.transactionBuilder.updateAccount(accountName, address);
                const signedTransaction = yield this.sign(updateAccount, options.privateKey || undefined);
                const result = yield this.sendRawTransaction(signedTransaction);
                return callback(null, result);
            }
            catch (ex) {
                return callback(ex);
            }
        });
    }
    getProposal(proposalID, callback) {
        if (!callback)
            return this.injectPromise(this.getProposal, proposalID);
        if (!utils_1.default.isInteger(proposalID) || proposalID < 0)
            return callback('Invalid proposalID provided');
        this.tronWeb.fullNode
            .request('wallet/getproposalbyid', { id: parseInt(proposalID.toString()) }, 'post')
            .then((proposal) => {
            callback(null, proposal);
        })
            .catch((err) => callback(err));
    }
    listProposals(callback) {
        if (!callback)
            return this.injectPromise(this.listProposals);
        this.tronWeb.fullNode
            .request('wallet/listproposals', {}, 'post')
            .then(({ proposals = [] }) => {
            callback(null, proposals);
        })
            .catch((err) => callback(err));
    }
    getChainParameters(callback) {
        if (!callback)
            return this.injectPromise(this.getChainParameters);
        this.tronWeb.fullNode
            .request('wallet/getchainparameters', {}, 'post')
            .then(({ chainParameter = [] }) => {
            callback(null, chainParameter);
        })
            .catch((err) => callback(err));
    }
    getAccountResources(address, callback) {
        if (!callback)
            return this.injectPromise(this.getAccountResources, address);
        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);
        this.tronWeb.fullNode
            .request('wallet/getaccountresource', { address: this.tronWeb.address.toHex(address) }, 'post')
            .then((resources) => {
            callback(null, resources);
        })
            .catch((err) => callback(err));
    }
    getExchangeByID(exchangeID, callback) {
        if (!callback)
            return this.injectPromise(this.getExchangeByID, exchangeID);
        if (!utils_1.default.isInteger(exchangeID) || exchangeID < 0)
            return callback('Invalid exchangeID provided');
        this.tronWeb.fullNode
            .request('wallet/getexchangebyid', { id: exchangeID }, 'post')
            .then((exchange) => {
            callback(null, exchange);
        })
            .catch((err) => callback(err));
    }
    listExchanges(callback) {
        if (!callback)
            return this.injectPromise(this.listExchanges);
        this.tronWeb.fullNode
            .request('wallet/listexchanges', {}, 'post')
            .then(({ exchanges = [] }) => {
            callback(null, exchanges);
        })
            .catch((err) => callback(err));
    }
    listExchangesPaginated(limit = 0, offset = 0, callback) {
        if (!callback)
            return this.injectPromise(this.listExchangesPaginated, limit, offset);
        this.tronWeb.fullNode
            .request('wallet/getpaginatedexchangelist', { limit, offset }, 'post')
            .then(({ exchanges = [] }) => {
            callback(null, exchanges);
        })
            .catch((err) => callback(err));
    }
    getNodeInfo(callback) {
        if (!callback)
            return this.injectPromise(this.getNodeInfo);
        this.tronWeb.fullNode
            .request('wallet/getnodeinfo', {}, 'post')
            .then((info) => {
            callback(null, info);
        })
            .catch((err) => callback(err));
    }
    getTokenListByName(tokenID, callback) {
        if (!callback)
            return this.injectPromise(this.getTokenListByName, tokenID);
        if (utils_1.default.isInteger(tokenID))
            tokenID = tokenID.toString();
        if (!utils_1.default.isString(tokenID) || !tokenID.length)
            return callback(INVALID_TOKEN_ID_MSG);
        this.tronWeb.fullNode
            .request('wallet/getassetissuelistbyname', { value: this.tronWeb.fromUtf8(tokenID) }, 'post')
            .then((token) => {
            if (Array.isArray(token.assetIssue))
                return callback(null, token.assetIssue.map((t) => this._parseToken(t)));
            else if (!('name' in token) || !token.name)
                return callback(TOKEN_DOES_NOT_EXIST_MSG);
            // TODO: borrowed from old impl. This should never happen
            else
                return callback(null, [this._parseToken(token)]);
        })
            .catch((err) => callback(err));
    }
    getTokenByID(tokenID, callback) {
        if (!callback)
            return this.injectPromise(this.getTokenByID, tokenID);
        if (utils_1.default.isInteger(tokenID))
            tokenID = tokenID.toString();
        if (!utils_1.default.isString(tokenID) || !tokenID.length)
            return callback(INVALID_TOKEN_ID_MSG);
        this.tronWeb.fullNode
            .request('wallet/getassetissuebyid', { value: tokenID }, 'post')
            .then((token) => {
            if (!token.name)
                return callback(TOKEN_DOES_NOT_EXIST_MSG);
            callback(null, this._parseToken(token));
        })
            .catch((err) => callback(err));
    }
    getReward(address, options = {}, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            options.confirmed = true;
            return this._getReward(address, options, callback);
        });
    }
    getUnconfirmedReward(address, options = {}, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            options.confirmed = false;
            return this._getReward(address, options, callback);
        });
    }
    getBrokerage(address, options = {}, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            options.confirmed = true;
            return this._getBrokerage(address, options, callback);
        });
    }
    getUnconfirmedBrokerage(address, options = {}, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            options.confirmed = false;
            return this._getBrokerage(address, options, callback);
        });
    }
    _getReward(address = this.tronWeb.defaultAddress.hex, options = {}, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this._getReward, address, options);
            if (!utils_1.default.isString(address))
                return callback('Invalid address.');
            if (this.validator.notValid([
                {
                    name: 'origin',
                    type: 'address',
                    value: address,
                },
            ], callback))
                return;
            const data = { address: toHex(address) };
            (options.confirmed
                ? this.tronWeb.solidityNode.request('walletsolidity/getReward', data, 'post')
                : this.tronWeb.fullNode.request('wallet/getReward', data, 'post'))
                .then((result = {}) => {
                if (typeof result.reward === 'undefined')
                    return callback('Not found.');
                callback(null, result.reward);
            })
                .catch((err) => callback(err));
        });
    }
    _getBrokerage(address = this.tronWeb.defaultAddress.hex, options = {}, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this._getBrokerage, address, options);
            if (!utils_1.default.isString(address))
                return callback(`Invalid address: ${address}.`);
            if (this.validator.notValid([
                {
                    name: 'origin',
                    type: 'address',
                    value: address,
                },
            ], callback))
                return;
            const data = { address: toHex(address) };
            (options.confirmed
                ? this.tronWeb.solidityNode.request('walletsolidity/getBrokerage', data, 'post')
                : this.tronWeb.fullNode.request('wallet/getBrokerage', data, 'post'))
                .then((result) => {
                if (typeof result.brokerage === 'undefined')
                    return callback('Not found.');
                callback(null, result.brokerage);
            })
                .catch((err) => callback(err));
        });
    }
}
exports.default = Trx;
//# sourceMappingURL=trx.js.map