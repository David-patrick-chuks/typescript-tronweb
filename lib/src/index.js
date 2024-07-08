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
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const injectpromise_1 = __importDefault(require("injectpromise"));
const semver_1 = __importDefault(require("semver"));
const version_js_1 = require("../version.js");
const contract_1 = __importDefault(require("./lib/contract"));
const event_1 = __importDefault(require("./lib/event"));
const plugin_1 = __importDefault(require("./lib/plugin"));
const providers_1 = __importDefault(require("./lib/providers"));
const providers_2 = require("./lib/providers");
const sidechain_1 = __importDefault(require("./lib/sidechain"));
const transactionBuilder_1 = __importDefault(require("./lib/transactionBuilder"));
const trx_1 = __importDefault(require("./lib/trx"));
const utils_1 = __importDefault(require("./utils"));
const address_1 = require("./utils/address");
const ethersUtils_1 = require("./utils/ethersUtils");
const DEFAULT_VERSION = '3.5.0';
const FEE_LIMIT = 150000000;
class TronWeb extends eventemitter3_1.default {
    constructor(options, 
    // for retro-compatibility:
    solidityNode, eventServer, sideOptions, privateKey) {
        super();
        this.version = version_js_1.version;
        this.providers = providers_1.default;
        this.utils = utils_1.default;
        this.BigNumber = bignumber_js_1.default;
        this.fullnodeVersion = DEFAULT_VERSION;
        this.feeLimit = FEE_LIMIT;
        let fullNode;
        let headers;
        let eventHeaders;
        if (typeof options === 'object' &&
            ('fullNode' in options || 'fullHost' in options) &&
            ('fullNode' in options ? options.fullNode : options.fullHost)) {
            fullNode =
                'fullNode' in options ? options.fullNode : options.fullHost;
            // shift
            sideOptions = solidityNode;
            solidityNode =
                'solidityNode' in options
                    ? options.solidityNode
                    : options.fullHost;
            eventServer =
                'eventServer' in options
                    ? options.eventServer
                    : options.fullHost;
            headers = options.headers || false;
            eventHeaders = options.eventHeaders || headers;
            privateKey = options.privateKey;
        }
        else {
            fullNode = options;
        }
        if (utils_1.default.isString(fullNode))
            fullNode = new providers_2.HttpProvider(fullNode);
        if (utils_1.default.isString(solidityNode))
            solidityNode = new providers_2.HttpProvider(solidityNode);
        if (utils_1.default.isString(eventServer))
            eventServer = new providers_2.HttpProvider(eventServer);
        this.event = new event_1.default(this);
        this.transactionBuilder = new transactionBuilder_1.default(this);
        this.trx = new trx_1.default(this);
        this.plugin = new plugin_1.default(this, options);
        this.setFullNode(fullNode);
        this.setSolidityNode(solidityNode);
        this.setEventServer(eventServer);
        // This allows undefined, but allowing it in class body raises 100+ errors
        this.defaultBlock = undefined;
        this.defaultPrivateKey = undefined;
        this.defaultAddress = {
            hex: undefined,
            base58: undefined,
        };
        // for sidechain
        if (sideOptions &&
            typeof sideOptions === 'object' &&
            ('fullNode' in sideOptions
                ? sideOptions.fullNode
                : sideOptions.fullHost))
            this.sidechain = new sidechain_1.default(sideOptions, TronWeb, this, 
            // WTF? Was options.privateKey, which makes even less sense
            // @ts-ignore
            privateKey);
        else if (typeof sideOptions !== 'string' && sideOptions != null)
            throw new TypeError('Wrong options combination provided');
        else if (sideOptions != null)
            privateKey = privateKey || sideOptions;
        if (privateKey)
            this.setPrivateKey(privateKey);
        this.injectPromise = (0, injectpromise_1.default)(this);
        if (headers)
            this.setFullNodeHeader(headers);
        if (eventHeaders)
            this.setEventHeader(eventHeaders);
    }
    getFullnodeVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const nodeInfo = yield this.trx.getNodeInfo();
                this.fullnodeVersion = nodeInfo.configNodeInfo.codeVersion;
                if (this.fullnodeVersion.split('.').length === 2)
                    this.fullnodeVersion += '.0';
            }
            catch (err) {
                this.fullnodeVersion = DEFAULT_VERSION;
            }
        });
    }
    setDefaultBlock(blockID) {
        if ([undefined, 'latest', 'earliest', 0].includes(blockID)) {
            // This allows undefined, but allowing it in class body raises 100+ errors
            // @ts-ignore
            this.defaultBlock = blockID;
            return;
        }
        if (!utils_1.default.isInteger(blockID) || !blockID)
            throw new Error('Invalid block ID provided');
        this.defaultBlock = Math.abs(blockID);
    }
    setPrivateKey(privateKey) {
        try {
            const addr = this.address.fromPrivateKey(privateKey);
            if (addr)
                this.setAddress(addr);
            else
                throw new Error();
        }
        catch (_a) {
            throw new Error('Invalid private key provided');
        }
        this.defaultPrivateKey = privateKey;
        this.emit('privateKeyChanged', privateKey);
    }
    setAddress(address) {
        if (!this.isAddress(address))
            throw new Error('Invalid address provided');
        const hex = this.address.toHex(address);
        const base58 = this.address.fromHex(address);
        if (this.defaultPrivateKey &&
            this.address.fromPrivateKey(this.defaultPrivateKey) !== base58)
            // This allows undefined, but allowing it in class body raises 100+ errors
            // @ts-ignore
            this.defaultPrivateKey = undefined;
        this.defaultAddress = {
            hex,
            base58,
        };
        this.emit('addressChanged', { hex, base58 });
    }
    fullnodeSatisfies(version) {
        return semver_1.default.satisfies(this.fullnodeVersion, version);
    }
    isValidProvider(provider) {
        return Object.values(providers_1.default).some((knownProvider) => provider instanceof knownProvider);
    }
    setFullNode(fullNode) {
        if (utils_1.default.isString(fullNode))
            fullNode = new providers_2.HttpProvider(fullNode);
        if (!this.isValidProvider(fullNode))
            throw new Error('Invalid full node provided');
        this.fullNode = fullNode;
        this.fullNode.setStatusPage('wallet/getnowblock');
        this.getFullnodeVersion();
    }
    setSolidityNode(solidityNode) {
        if (utils_1.default.isString(solidityNode))
            solidityNode = new providers_2.HttpProvider(solidityNode);
        if (!this.isValidProvider(solidityNode))
            throw new Error('Invalid solidity node provided');
        this.solidityNode = solidityNode;
        this.solidityNode.setStatusPage('walletsolidity/getnowblock');
    }
    setEventServer(eventServer, healthcheck = 'healthcheck') {
        this.event.setServer(eventServer, healthcheck);
    }
    setHeader(headers = {}) {
        const fullNode = new providers_2.HttpProvider(this.fullNode.host, 30000, undefined, undefined, headers);
        const solidityNode = new providers_2.HttpProvider(this.solidityNode.host, 30000, undefined, undefined, headers);
        const eventServer = new providers_2.HttpProvider(this.eventServer.host, 30000, undefined, undefined, headers);
        this.setFullNode(fullNode);
        this.setSolidityNode(solidityNode);
        this.setEventServer(eventServer);
    }
    setFullNodeHeader(headers = {}) {
        const fullNode = new providers_2.HttpProvider(this.fullNode.host, 30000, undefined, undefined, headers);
        const solidityNode = new providers_2.HttpProvider(this.solidityNode.host, 30000, undefined, undefined, headers);
        this.setFullNode(fullNode);
        this.setSolidityNode(solidityNode);
    }
    setEventHeader(headers = {}) {
        const eventServer = new providers_2.HttpProvider(this.eventServer.host, 30000, undefined, undefined, headers);
        this.setEventServer(eventServer);
    }
    currentProviders() {
        return {
            fullNode: this.fullNode,
            solidityNode: this.solidityNode,
            eventServer: this.eventServer,
        };
    }
    currentProvider() {
        return this.currentProviders();
    }
    getEventResult(contractAddress, options = {}, callback) {
        // getEventResult(...params) {
        // if (typeof params[1] !== 'object') {
        //     params[1] = {
        //         sinceTimestamp: params[1] || 0,
        //         eventName: params[2] || false,
        //         blockNumber: params[3] || false,
        //         size: params[4] || 20,
        //         page: params[5] || 1,
        //     };
        //     params.splice(2, 4);
        //     // callback:
        //     if (!utils.isFunction(params[2])) {
        //         if (utils.isFunction(params[1].page)) {
        //             params[2] = params[1].page;
        //             params[1].page = 1;
        //         } else if (utils.isFunction(params[1].size)) {
        //             params[2] = params[1].size;
        //             params[1].size = 20;
        //             params[1].page = 1;
        //         }
        //     }
        // }
        return this.event.getEventsByContractAddress(contractAddress, options, callback);
    }
    getEventByTransactionID(transactionID, options = {}, callback) {
        return this.event.getEventsByTransactionID(transactionID, options, callback);
    }
    contract(abi = [], address) {
        return new contract_1.default(this, abi, address);
    }
    static get address() {
        return {
            fromHex(address) {
                if (!utils_1.default.isHex(address))
                    return address;
                return utils_1.default.crypto.getBase58CheckAddress(utils_1.default.code.hexStr2byteArray(address.replace(/^0x/, address_1.ADDRESS_PREFIX)));
            },
            toHex(address) {
                if (utils_1.default.isHex(address))
                    return address.toLowerCase().replace(/^0x/, address_1.ADDRESS_PREFIX);
                return utils_1.default.code
                    .byteArray2hexStr(utils_1.default.crypto.decodeBase58Address(address))
                    .toLowerCase();
            },
            fromPrivateKey(privateKey, strict = false) {
                try {
                    return utils_1.default.crypto.pkToAddress(privateKey, strict);
                }
                catch (_a) {
                    throw new Error('Invalid private key!');
                }
            },
        };
    }
    get address() {
        return TronWeb.address;
    }
    static sha3(string, prefix = true) {
        return ((prefix ? '0x' : '') +
            (0, ethersUtils_1.keccak256)(Buffer.from(string, 'utf-8')).toString().substring(2));
    }
    sha3(string, prefix = true) {
        return TronWeb.sha3(string, prefix);
    }
    static toHex(val) {
        if (utils_1.default.isBoolean(val))
            return TronWeb.fromDecimal(+val);
        if (utils_1.default.isBigNumber(val))
            return TronWeb.fromDecimal(val);
        if (typeof val === 'object')
            return TronWeb.fromUtf8(JSON.stringify(val));
        if (utils_1.default.isString(val)) {
            if (/^(-|)0x/.test(val))
                return val;
            // `val` is really a string, and below is legacy code abusing isFinite.
            // @ts-ignore
            if (!isFinite(val) || /^\s*$/.test(val))
                return TronWeb.fromUtf8(val);
        }
        const result = TronWeb.fromDecimal(val);
        if (result === '0xNaN')
            throw new Error('The passed value is not convertible to a hex string');
        else
            return result;
    }
    toHex(val) {
        return TronWeb.toHex(val);
    }
    static toUtf8(hex) {
        if (utils_1.default.isHex(hex)) {
            hex = hex.replace(/^0x/, '');
            return Buffer.from(hex, 'hex').toString('utf8');
        }
        else {
            throw new Error('The passed value is not a valid hex string');
        }
    }
    toUtf8(hex) {
        return TronWeb.toUtf8(hex);
    }
    static fromUtf8(string) {
        if (!utils_1.default.isString(string))
            throw new Error('The passed value is not a valid utf-8 string');
        return '0x' + Buffer.from(string, 'utf8').toString('hex');
    }
    fromUtf8(string) {
        return TronWeb.fromUtf8(string);
    }
    static toAscii(hex) {
        if (utils_1.default.isHex(hex)) {
            let str = '';
            // FIXME: it's very bad
            let i = hex.substring(0, 2) === '0x' ? 2 : 0;
            for (; i < hex.length; i += 2) {
                const code = parseInt(hex.substr(i, 2), 16);
                str += String.fromCharCode(code);
            }
            return str;
        }
        else {
            throw new Error('The passed value is not a valid hex string');
        }
    }
    toAscii(hex) {
        return TronWeb.toAscii(hex);
    }
    static fromAscii(string, padding = 0) {
        if (!utils_1.default.isString(string))
            throw new Error('The passed value is not a valid utf-8 string');
        return ('0x' +
            Buffer.from(string, 'ascii').toString('hex').padEnd(padding, '0'));
    }
    fromAscii(string, padding = 0) {
        return TronWeb.fromAscii(string, padding);
    }
    static toDecimal(value) {
        return TronWeb.toBigNumber(value).toNumber();
    }
    toDecimal(value) {
        return TronWeb.toDecimal(value);
    }
    static fromDecimal(value) {
        const number = TronWeb.toBigNumber(value);
        const result = number.toString(16);
        return number.isLessThan(0) ? '-0x' + result.substr(1) : '0x' + result;
    }
    fromDecimal(value) {
        return TronWeb.fromDecimal(value);
    }
    static fromSun(sun) {
        const trx = TronWeb.toBigNumber(sun).div(1000000);
        return utils_1.default.isBigNumber(sun) ? trx : trx.toString(10);
    }
    fromSun(sun) {
        return TronWeb.fromSun(sun);
    }
    static toSun(trx) {
        const sun = TronWeb.toBigNumber(trx).times(1000000);
        return utils_1.default.isBigNumber(trx) ? sun : sun.toString(10);
    }
    toSun(trx) {
        return TronWeb.toSun(trx);
    }
    static toBigNumber(amount = 0) {
        if (utils_1.default.isBigNumber(amount))
            return amount;
        if (utils_1.default.isString(amount) && /^(-|)0x/.test(amount))
            return new bignumber_js_1.default(amount.replace('0x', ''), 16);
        return new bignumber_js_1.default(amount.toString(10), 10);
    }
    toBigNumber(amount = 0) {
        return TronWeb.toBigNumber(amount);
    }
    static isAddress(address) {
        if (!utils_1.default.isString(address))
            return false;
        // Convert HEX to Base58
        if (address.length === 42)
            try {
                return TronWeb.isAddress(utils_1.default.crypto.getBase58CheckAddress(
                // it throws an error if the address starts with 0x
                utils_1.default.code.hexStr2byteArray(address)));
            }
            catch (err) {
                return false;
            }
        try {
            return utils_1.default.crypto.isAddressValid(address);
        }
        catch (err) {
            return false;
        }
    }
    isAddress(address) {
        return TronWeb.isAddress(address);
    }
    static createAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            return utils_1.default.accounts.generateAccount();
        });
    }
    createAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            return TronWeb.createAccount();
        });
    }
    static createRandom(options = {}) {
        return utils_1.default.accounts.generateRandom(options);
    }
    createRandom(options = {}) {
        return TronWeb.createRandom(options);
    }
    static fromMnemonic(mnemonic, path = address_1.TRON_BIP39_PATH_INDEX_0, wordlist = 'en') {
        return utils_1.default.accounts.generateAccountWithMnemonic(mnemonic, path, wordlist);
    }
    fromMnemonic(mnemonic, path = address_1.TRON_BIP39_PATH_INDEX_0, wordlist = 'en') {
        return TronWeb.fromMnemonic(mnemonic, path, wordlist);
    }
    isConnected(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback)
                return this.injectPromise(this.isConnected);
            return callback(null, {
                fullNode: yield this.fullNode.isConnected(),
                solidityNode: yield this.solidityNode.isConnected(),
                eventServer: this.eventServer && (yield this.eventServer.isConnected()),
            });
        });
    }
}
exports.default = TronWeb;
TronWeb.providers = providers_1.default;
TronWeb.BigNumber = bignumber_js_1.default;
TronWeb.TransactionBuilder = transactionBuilder_1.default;
TronWeb.Trx = trx_1.default;
TronWeb.Contract = contract_1.default;
TronWeb.Plugin = plugin_1.default;
TronWeb.Event = event_1.default;
TronWeb.version = version_js_1.version;
TronWeb.utils = utils_1.default;
//# sourceMappingURL=index.js.map