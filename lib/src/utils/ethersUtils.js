"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMnemonic = exports.id = exports.concat = exports.arrayify = exports.joinSignature = exports.splitSignature = exports.FormatTypes = exports.Interface = exports.AbiCoder = exports.recoverAddress = exports.toUtf8String = exports.toUtf8Bytes = exports.sha256 = exports.keccak256 = exports.SigningKey = exports.ethersWallet = void 0;
const ethers_1 = require("ethers");
var ethers_2 = require("ethers");
Object.defineProperty(exports, "ethersWallet", { enumerable: true, get: function () { return ethers_2.Wallet; } });
const { keccak256, sha256, toUtf8Bytes, toUtf8String, recoverAddress, SigningKey: SigningKey_, AbiCoder, Interface, FormatTypes, arrayify, splitSignature, joinSignature, concat, id, isValidMnemonic, } = ethers_1.utils;
exports.keccak256 = keccak256;
exports.sha256 = sha256;
exports.toUtf8Bytes = toUtf8Bytes;
exports.toUtf8String = toUtf8String;
exports.recoverAddress = recoverAddress;
exports.AbiCoder = AbiCoder;
exports.Interface = Interface;
exports.FormatTypes = FormatTypes;
exports.arrayify = arrayify;
exports.splitSignature = splitSignature;
exports.joinSignature = joinSignature;
exports.concat = concat;
exports.id = id;
exports.isValidMnemonic = isValidMnemonic;
/**
 * Allow passing less precise values to constructor, because they work
 */
class SigningKey extends SigningKey_ {
    constructor(privateKey) {
        super(privateKey);
    }
}
exports.SigningKey = SigningKey;
//# sourceMappingURL=ethersUtils.js.map