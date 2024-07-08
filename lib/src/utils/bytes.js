"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.base64EncodeToString = exports.base64DecodeFromString = exports.byteArray2hexStr = exports.hextoString = exports.bytesToString = exports.byte2hexStr = void 0;
const base64_1 = require("./base64");
function byte2hexStr(byte) {
    if (typeof byte !== 'number')
        throw new Error('Input must be a number');
    if (byte < 0 || byte > 255)
        throw new Error('Input must be a byte');
    const hexByteMap = '0123456789ABCDEF';
    return hexByteMap.charAt(byte >> 4) + hexByteMap.charAt(byte & 0x0f);
}
exports.byte2hexStr = byte2hexStr;
function bytesToString(arr) {
    if (typeof arr === 'string')
        return arr;
    let str = '';
    for (let i = 0; i < arr.length; i++) {
        const one = arr[i].toString(2);
        const v = one.match(/^1+?(?=0)/);
        if (v && one.length === 8) {
            const bytesLength = v[0].length;
            let store = arr[i].toString(2).slice(7 - bytesLength);
            for (let st = 1; st < bytesLength; st++)
                store += arr[st + i].toString(2).slice(2);
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        }
        else {
            str += String.fromCharCode(arr[i]);
        }
    }
    return str;
}
exports.bytesToString = bytesToString;
function hextoString(hex) {
    const arr = hex.replace(/^0x/, '').split('');
    let out = '';
    for (let i = 0; i < arr.length / 2; i++) {
        const tmp = `0x${arr[i * 2]}${arr[i * 2 + 1]}`;
        out += String.fromCharCode(parseInt(tmp, 16));
    }
    return out;
}
exports.hextoString = hextoString;
function byteArray2hexStr(byteArray) {
    let str = '';
    for (const b of byteArray)
        str += byte2hexStr(b);
    return str;
}
exports.byteArray2hexStr = byteArray2hexStr;
function base64DecodeFromString(string64) {
    return new base64_1.Base64().decodeToByteArray(string64);
}
exports.base64DecodeFromString = base64DecodeFromString;
function base64EncodeToString(bytes) {
    const b = new base64_1.Base64();
    return b.encodeIgnoreUtf8(bytes);
}
exports.base64EncodeToString = base64EncodeToString;
//# sourceMappingURL=bytes.js.map