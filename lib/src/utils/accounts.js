"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccountWithMnemonic = exports.generateRandom = exports.generateAccount = void 0;
const address_1 = require("./address");
const bytes_1 = require("./bytes");
const crypto_1 = require("./crypto");
const ethersUtils_1 = require("./ethersUtils");
const index_1 = __importDefault(require("./index"));
const INVALID_TRON_PATH_ERROR_MSG = 'Invalid tron path provided';
function generateAccount() {
    const priKeyBytes = (0, crypto_1.genPriKey)();
    const pubKeyBytes = (0, crypto_1.getPubKeyFromPriKey)(priKeyBytes);
    const addressBytes = (0, crypto_1.getAddressFromPriKey)(priKeyBytes);
    const privateKey = (0, bytes_1.byteArray2hexStr)(priKeyBytes);
    const publicKey = (0, bytes_1.byteArray2hexStr)(pubKeyBytes);
    return {
        privateKey,
        publicKey,
        address: {
            base58: (0, crypto_1.getBase58CheckAddress)(addressBytes),
            hex: (0, bytes_1.byteArray2hexStr)(addressBytes),
        },
    };
}
exports.generateAccount = generateAccount;
function generateRandom(options) {
    if (!index_1.default.isObject(options))
        options = {};
    if (!options.path)
        options.path = address_1.TRON_BIP39_PATH_INDEX_0;
    if (!String(options.path).match(/^m\/44'\/195'/))
        throw new Error(INVALID_TRON_PATH_ERROR_MSG);
    const account = ethersUtils_1.ethersWallet.createRandom(options);
    return {
        mnemonic: account.mnemonic,
        privateKey: account.privateKey,
        publicKey: account.publicKey,
        address: (0, crypto_1.pkToAddress)(account.privateKey.replace(/^0x/, '')),
    };
}
exports.generateRandom = generateRandom;
function generateAccountWithMnemonic(mnemonic, path, wordlist = 'en') {
    if (!path)
        path = address_1.TRON_BIP39_PATH_INDEX_0;
    if (!String(path).match(/^m\/44'\/195'/))
        throw new Error(INVALID_TRON_PATH_ERROR_MSG);
    // FIXME: remove, if merged https://github.com/ethers-io/ethers.js/pull/3440
    // @ts-ignore
    const account = ethersUtils_1.ethersWallet.fromMnemonic(mnemonic, path, wordlist);
    return {
        mnemonic: account.mnemonic,
        privateKey: account.privateKey,
        publicKey: account.publicKey,
        address: (0, crypto_1.pkToAddress)(account.privateKey.replace(/^0x/, '')),
    };
}
exports.generateAccountWithMnemonic = generateAccountWithMnemonic;
//# sourceMappingURL=accounts.js.map