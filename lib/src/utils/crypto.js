"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pkToAddress = exports.passwordToAddress = exports.SHA256 = exports.sha256 = exports.ECKeySign = exports.getECKeySig = exports.getPubKeyFromPriKey = exports.getAddressFromPriKeyBase64String = exports.getHexStrAddressFromPriKeyBase64String = exports.getBase58CheckAddressFromPriKeyBase64String = exports.isAddressValid = exports.decode58Check = exports.getAddressFromPriKey = exports.computeAddress = exports.genPriKey = exports.getRowBytesFromTransactionBase64 = exports._signTypedData = exports.signBytes = exports.arrayToBase64String = exports.ecRecover = exports.signTransaction = exports.decodeBase58Address = exports.getBase58CheckAddress = exports.byteArray2hexStr = void 0;
const elliptic_1 = __importDefault(require("elliptic"));
const address_1 = require("./address");
const base58_1 = require("./base58");
const bytes_1 = require("./bytes");
const code_1 = require("./code");
const ethersUtils_1 = require("./ethersUtils");
const typedData_1 = require("./typedData");
const { ec: EC } = elliptic_1.default;
// import {TransactionExtention as ITransactionExtention} from '../proto/api/api'
var bytes_2 = require("./bytes");
Object.defineProperty(exports, "byteArray2hexStr", { enumerable: true, get: function () { return bytes_2.byteArray2hexStr; } });
function getBase58CheckAddress(addressBytes) {
    const hash = sha256(sha256(addressBytes));
    let checkSum = hash.slice(0, 4);
    checkSum = new Uint8Array([...addressBytes, ...checkSum]);
    return (0, base58_1.encode58)(checkSum);
}
exports.getBase58CheckAddress = getBase58CheckAddress;
function decodeBase58Address(base58String) {
    const error_msg = 'Invalid address provided';
    if (typeof base58String !== 'string' || base58String.length <= 4)
        throw new Error(error_msg);
    let address = (0, base58_1.decode58)(base58String);
    if (base58String.length <= 4)
        throw new Error(error_msg);
    const checkSum = address.slice(-4);
    address = address.slice(0, -4);
    const hash = sha256(sha256(address));
    const checkSum1 = hash.slice(0, 4);
    if (checkSum.join() === checkSum1.join())
        return address;
    throw new Error(error_msg);
}
exports.decodeBase58Address = decodeBase58Address;
function signTransaction(priKeyBytes, transaction) {
    if (typeof priKeyBytes === 'string')
        priKeyBytes = (0, code_1.hexStr2byteArray)(priKeyBytes);
    const txID = transaction.txID;
    const signature = getECKeySig((0, code_1.hexStr2byteArray)(txID), priKeyBytes);
    if (Array.isArray(transaction.signature)) {
        if (!transaction.signature.includes(signature))
            transaction.signature.push(signature);
    }
    else {
        transaction.signature = [signature];
    }
    return transaction;
}
exports.signTransaction = signTransaction;
function ecRecover(signedData, signature) {
    signedData = '0x' + signedData.replace(/^0x/, '');
    signature = '0x' + signature.replace(/^0x/, '');
    const recovered = (0, ethersUtils_1.recoverAddress)((0, ethersUtils_1.arrayify)(signedData), (0, ethersUtils_1.splitSignature)(signature));
    const tronAddress = address_1.ADDRESS_PREFIX + recovered.substring(2);
    return tronAddress;
}
exports.ecRecover = ecRecover;
function arrayToBase64String(a) {
    return btoa(String.fromCharCode(...a));
}
exports.arrayToBase64String = arrayToBase64String;
function signBytes(privateKey, contents) {
    if (typeof privateKey === 'string')
        privateKey = (0, code_1.hexStr2byteArray)(privateKey);
    const hashBytes = sha256(contents);
    return getECKeySig(hashBytes, privateKey);
}
exports.signBytes = signBytes;
function _signTypedData(domain, types, value, privateKey) {
    const key = {
        toHexString: function () {
            return '0x' + privateKey;
        },
        value: privateKey,
    };
    const signingKey = new ethersUtils_1.SigningKey(key);
    const messageDigest = typedData_1.TypedDataEncoder.hash(domain, types, value);
    const signature = signingKey.signDigest(messageDigest);
    return [
        '0x',
        signature.r.substring(2),
        signature.s.substring(2),
        Number(signature.v).toString(16),
    ].join('');
}
exports._signTypedData = _signTypedData;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRowBytesFromTransactionBase64(base64Data) {
    throw new Error('Sorry, this function is not supported.');
    // TODO: what the hell is it? Is it needed? Current impl does not work.
    // const bytesDecode = base64DecodeFromString(base64Data);
    // const transaction =
    //     proto.protocol.Transaction.deserializeBinary(bytesDecode);
    // const raw = transaction.getRawData();
    // return raw.serializeBinary();
}
exports.getRowBytesFromTransactionBase64 = getRowBytesFromTransactionBase64;
function genPriKey() {
    const ec = new EC('secp256k1');
    const key = ec.genKeyPair();
    const priKey = key.getPrivate();
    let priKeyHex = priKey.toString('hex');
    while (priKeyHex.length < 64)
        priKeyHex = `0${priKeyHex}`;
    return (0, code_1.hexStr2byteArray)(priKeyHex);
}
exports.genPriKey = genPriKey;
function computeAddress(pubBytes) {
    if (pubBytes.length === 65)
        pubBytes = pubBytes.slice(1);
    const hash = (0, ethersUtils_1.keccak256)(pubBytes).toString().substring(2);
    const addressHex = address_1.ADDRESS_PREFIX + hash.substring(24);
    return (0, code_1.hexStr2byteArray)(addressHex);
}
exports.computeAddress = computeAddress;
function getAddressFromPriKey(priKeyBytes) {
    const pubBytes = getPubKeyFromPriKey(priKeyBytes);
    return computeAddress(pubBytes);
}
exports.getAddressFromPriKey = getAddressFromPriKey;
function decode58Check(addressStr) {
    const decodeCheck = (0, base58_1.decode58)(addressStr);
    if (decodeCheck.length <= 4)
        return null;
    const checkSum = decodeCheck.slice(-4);
    const decodeData = decodeCheck.slice(0, decodeCheck.length - 4);
    const hash = sha256(sha256(decodeData));
    if (hash.slice(0, 4).join() === checkSum.join())
        return decodeData;
    return null;
}
exports.decode58Check = decode58Check;
function isAddressValid(base58Str) {
    if (typeof base58Str !== 'string')
        return false;
    if (base58Str.length !== address_1.ADDRESS_SIZE)
        return false;
    let address = (0, base58_1.decode58)(base58Str);
    if (address.length !== 25)
        return false;
    if (address[0] !== address_1.ADDRESS_PREFIX_BYTE)
        return false;
    const checkSum = address.slice(21);
    address = address.slice(0, 21);
    const checkSum1 = sha256(sha256(address)).slice(0, 4);
    return checkSum.join() === checkSum1.join();
}
exports.isAddressValid = isAddressValid;
function getBase58CheckAddressFromPriKeyBase64String(priKeyBase64String) {
    const priKeyBytes = (0, code_1.base64DecodeFromString)(priKeyBase64String);
    const pubBytes = getPubKeyFromPriKey(priKeyBytes);
    const addressBytes = computeAddress(pubBytes);
    return getBase58CheckAddress(addressBytes);
}
exports.getBase58CheckAddressFromPriKeyBase64String = getBase58CheckAddressFromPriKeyBase64String;
function getHexStrAddressFromPriKeyBase64String(priKeyBase64String) {
    const priKeyBytes = (0, code_1.base64DecodeFromString)(priKeyBase64String);
    const pubBytes = getPubKeyFromPriKey(priKeyBytes);
    const addressBytes = computeAddress(pubBytes);
    return (0, bytes_1.byteArray2hexStr)(addressBytes);
}
exports.getHexStrAddressFromPriKeyBase64String = getHexStrAddressFromPriKeyBase64String;
function getAddressFromPriKeyBase64String(priKeyBase64String) {
    const priKeyBytes = (0, code_1.base64DecodeFromString)(priKeyBase64String);
    const pubBytes = getPubKeyFromPriKey(priKeyBytes);
    const addressBytes = computeAddress(pubBytes);
    return (0, code_1.base64EncodeToString)(addressBytes);
}
exports.getAddressFromPriKeyBase64String = getAddressFromPriKeyBase64String;
function getPubKeyFromPriKey(priKeyBytes) {
    const ec = new EC('secp256k1');
    const key = ec.keyFromPrivate(priKeyBytes, 'bytes');
    const pubkey = key.getPublic();
    const xHex = pubkey.x.toString('hex').padStart(64, '0');
    const yHex = pubkey.y.toString('hex').padStart(64, '0');
    const pubkeyHex = `04${xHex}${yHex}`;
    return (0, code_1.hexStr2byteArray)(pubkeyHex);
}
exports.getPubKeyFromPriKey = getPubKeyFromPriKey;
function getECKeySig(hashBytes, priKeyBytes) {
    const ec = new EC('secp256k1');
    const key = ec.keyFromPrivate(priKeyBytes, 'bytes');
    const signature = key.sign(hashBytes);
    const rHex = signature.r.toString('hex').padStart(64, '0');
    const sHex = signature.s.toString('hex').padStart(64, '0');
    const idHex = (0, bytes_1.byte2hexStr)(signature.recoveryParam);
    return rHex + sHex + idHex;
}
exports.getECKeySig = getECKeySig;
exports.ECKeySign = getECKeySig; // backwards-compatible alias
function sha256(msgBytes) {
    const msgHex = (0, bytes_1.byteArray2hexStr)(msgBytes);
    const hashHex = (0, ethersUtils_1.sha256)('0x' + msgHex).replace(/^0x/, '');
    return (0, code_1.hexStr2byteArray)(hashHex);
}
exports.sha256 = sha256;
exports.SHA256 = sha256; // backwards-compatible alias
function passwordToAddress(password) {
    const com_priKeyBytes = (0, code_1.base64DecodeFromString)(password);
    const com_addressBytes = getAddressFromPriKey(com_priKeyBytes);
    return getBase58CheckAddress(com_addressBytes);
}
exports.passwordToAddress = passwordToAddress;
function pkToAddress(privateKey, strict = false) {
    const com_priKeyBytes = (0, code_1.hexStr2byteArray)(privateKey, strict);
    const com_addressBytes = getAddressFromPriKey(com_priKeyBytes);
    return getBase58CheckAddress(com_addressBytes);
}
exports.pkToAddress = pkToAddress;
//# sourceMappingURL=crypto.js.map