"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStringType = exports.isNumber = exports.strToDate = exports.hexStr2byteArray = exports.isHexChar = exports.hexChar2byte = exports.base64EncodeToString = exports.base64DecodeFromString = exports.byteArray2hexStr = exports.hextoString = exports.bytesToString = exports.byte2hexStr = exports.stringToBytes = exports.arrayEquals = exports.bin2String = void 0;
const bytes_1 = require("./bytes");
Object.defineProperty(exports, "base64DecodeFromString", { enumerable: true, get: function () { return bytes_1.base64DecodeFromString; } });
Object.defineProperty(exports, "base64EncodeToString", { enumerable: true, get: function () { return bytes_1.base64EncodeToString; } });
Object.defineProperty(exports, "byte2hexStr", { enumerable: true, get: function () { return bytes_1.byte2hexStr; } });
Object.defineProperty(exports, "byteArray2hexStr", { enumerable: true, get: function () { return bytes_1.byteArray2hexStr; } });
Object.defineProperty(exports, "bytesToString", { enumerable: true, get: function () { return bytes_1.bytesToString; } });
Object.defineProperty(exports, "hextoString", { enumerable: true, get: function () { return bytes_1.hextoString; } });
exports.bin2String = bytes_1.bytesToString;
function arrayEquals(array1, array2, strict = false) {
    if (array1.length !== array2.length)
        return false;
    let i;
    for (i = 0; i < array1.length; i++)
        if (strict) {
            if (array1[i] !== array2[i])
                return false;
        }
        else if (JSON.stringify(array1[i]) !== JSON.stringify(array2[i])) {
            return false;
        }
    return true;
}
exports.arrayEquals = arrayEquals;
function stringToBytes(str) {
    if (typeof str !== 'string')
        throw new Error('The passed string is not a string');
    const bytes = [];
    const len = str.length;
    let c;
    for (let i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if (c >= 0x010000 && c <= 0x10ffff) {
            bytes.push(((c >> 18) & 0x07) | 0xf0);
            bytes.push(((c >> 12) & 0x3f) | 0x80);
            bytes.push(((c >> 6) & 0x3f) | 0x80);
            bytes.push((c & 0x3f) | 0x80);
        }
        else if (c >= 0x000800 && c <= 0x00ffff) {
            bytes.push(((c >> 12) & 0x0f) | 0xe0);
            bytes.push(((c >> 6) & 0x3f) | 0x80);
            bytes.push((c & 0x3f) | 0x80);
        }
        else if (c >= 0x000080 && c <= 0x0007ff) {
            bytes.push(((c >> 6) & 0x1f) | 0xc0);
            bytes.push((c & 0x3f) | 0x80);
        }
        else {
            bytes.push(c & 0xff);
        }
    }
    return new Uint8Array(bytes);
}
exports.stringToBytes = stringToBytes;
function hexChar2byte(c) {
    let d;
    if (c >= 'A' && c <= 'F')
        d = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    else if (c >= 'a' && c <= 'f')
        d = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
    else if (c >= '0' && c <= '9')
        d = c.charCodeAt(0) - '0'.charCodeAt(0);
    if (typeof d === 'number')
        return d;
    else
        throw new Error('The passed hex char is not a valid hex char');
}
exports.hexChar2byte = hexChar2byte;
function isHexChar(c) {
    return ((c >= 'A' && c <= 'F') ||
        (c >= 'a' && c <= 'f') ||
        (c >= '0' && c <= '9'));
}
exports.isHexChar = isHexChar;
/**
 * Convert a hex string to a byte array.
 * @param strict: if strict and the length of str is odd, pad it left with one zero
 */
function hexStr2byteArray(str, strict = false) {
    if (typeof str !== 'string')
        throw new Error('The passed string is not a string');
    if (strict && str.length % 2)
        str = `0${str}`;
    const byteArray = new Uint8Array(str.length / 2);
    let d = 0;
    let j = 0;
    let k = 0;
    for (const c of str)
        if (isHexChar(c)) {
            d <<= 4;
            d += hexChar2byte(c);
            j++;
            if (j % 2 === 0) {
                byteArray[k++] = d;
                d = 0;
            }
        }
        else {
            throw new Error('The passed hex char is not a valid hex string');
        }
    return byteArray;
}
exports.hexStr2byteArray = hexStr2byteArray;
/**
 * Convert string of form `yyyy-MM-DD HH-mm-ss` to `Date`
 */
function strToDate(str) {
    if (!/^\d{4}-\d{2}-\d{2}( \d{2}-\d{2}-\d{2}|)/.test(str))
        throw new Error('The passed date string is not valid');
    const tempStrs = str.split(' ');
    const dateStrs = tempStrs[0].split('-');
    const year = parseInt(dateStrs[0], 10);
    const month = parseInt(dateStrs[1], 10) - 1;
    const day = parseInt(dateStrs[2], 10);
    if (tempStrs.length > 1) {
        const timeStrs = tempStrs[1].split('-');
        const hour = parseInt(timeStrs[0], 10);
        const minute = parseInt(timeStrs[1], 10);
        const second = parseInt(timeStrs[2], 10);
        return new Date(year, month, day, hour, minute, second);
    }
    return new Date(year, month, day);
}
exports.strToDate = strToDate;
function isNumber(c) {
    return c >= '0' && c <= '9';
}
exports.isNumber = isNumber;
/**
 * return 1: address  --- 20Bytes HexString
 * return 2: blockNumber ------ Decimal number
 * return 3: assetName ------ String
 * return other: error
 */
function getStringType(str) {
    if (null == str)
        return -1;
    if (typeof str != 'string')
        return -1;
    if (!str || str.length === 0 || str === '')
        return -1;
    let i = 0;
    // TODO Should we return 1 if someone passes a full, 42-chars long address?
    // if (str.length == 42 && /^41/.test(str)) {
    //     for (; i < 40; i++) {
    //         var c = str.charAt(i+2);
    //
    //         if (!isHexChar(c))
    //             break;
    //     }
    // } else
    if (str.length === 40)
        for (; i < 40; i++)
            if (!isHexChar(str.charAt(i)))
                break;
    if (i === 40)
        return 1; //40 Hex, Address
    for (i = 0; i < str.length; i++)
        if (!isNumber(str.charAt(i)))
            break;
    if (i === str.length)
        return 2; // All Decimal number, BlockNumber
    // At least one visible character
    for (i = 0; i < str.length; i++)
        if (str.charAt(i) > ' ')
            return 3;
    return -1;
}
exports.getStringType = getStringType;
//# sourceMappingURL=code.js.map