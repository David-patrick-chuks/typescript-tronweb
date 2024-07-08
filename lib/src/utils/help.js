"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringUtf8toHex = exports.hexString2Utf8 = exports.hexString2Address = exports.address2HexString = exports.stringUtf8tHex = exports.hexStringToUtf8 = exports.base58ToHexString = exports.hexStringToBase58 = void 0;
const address_1 = require("./address");
const code_1 = require("./code");
const crypto_1 = require("./crypto");
function hexStringToBase58(sHexString) {
    if (sHexString.length < 2 || (sHexString.length & 1) !== 0)
        return '';
    const bytes = (0, code_1.hexStr2byteArray)(sHexString);
    return (0, crypto_1.getBase58CheckAddress)(bytes);
}
exports.hexStringToBase58 = hexStringToBase58;
function base58ToHexString(sBase58) {
    const bytes = (0, crypto_1.decodeBase58Address)(sBase58);
    return (0, crypto_1.byteArray2hexStr)(bytes);
}
exports.base58ToHexString = base58ToHexString;
function hexStringToUtf8(hex) {
    const arr = hex.split('');
    let out = '';
    for (let i = 0; i < arr.length / 2; i++) {
        const tmp = `0x${arr[i * 2]}${arr[i * 2 + 1]}`;
        out += String.fromCharCode(parseInt(tmp, 16));
    }
    return out;
}
exports.hexStringToUtf8 = hexStringToUtf8;
function stringUtf8tHex(str) {
    let val = '';
    for (let i = 0; i < str.length; i++)
        val += str.charCodeAt(i).toString(16);
    return val;
}
exports.stringUtf8tHex = stringUtf8tHex;
function address2HexString(sHexAddress) {
    if (sHexAddress.length === 42 && sHexAddress.indexOf(address_1.ADDRESS_PREFIX) === 0)
        return sHexAddress;
    return base58ToHexString(sHexAddress);
}
exports.address2HexString = address2HexString;
exports.hexString2Address = hexStringToBase58;
exports.hexString2Utf8 = hexStringToUtf8;
exports.stringUtf8toHex = stringUtf8tHex;
//# sourceMappingURL=help.js.map