import el from 'elliptic';

import type {ISignedTransaction, ITransaction} from '../lib/transactionBuilder';
import {ADDRESS_PREFIX, ADDRESS_PREFIX_BYTE, ADDRESS_SIZE} from './address';
import {decode58, encode58} from './base58';
import {byte2hexStr, byteArray2hexStr} from './bytes';
import type {SomeBytes} from './bytes';
import {
    base64DecodeFromString,
    base64EncodeToString,
    hexStr2byteArray,
} from './code';
import {SigningKey, sha256 as ethSha256, keccak256, recoverAddress, joinSignature, arrayify, splitSignature} from './ethersUtils';
import {TypedDataEncoder} from './typedData';
import type {IDomain} from './typedData';

const {ec: EC} = el;

// import {TransactionExtention as ITransactionExtention} from '../proto/api/api'

export {byteArray2hexStr} from './bytes';

export type TypedDataTypes = Record<string, {name: string; type: string}[]>;

export function getBase58CheckAddress(
    addressBytes: SomeBytes | Buffer | number[],
) {
    const hash = sha256(sha256(addressBytes));
    let checkSum = hash.slice(0, 4);
    checkSum = new Uint8Array([...addressBytes, ...checkSum]);

    return encode58(checkSum);
}

export function decodeBase58Address(base58String: string) {
    const error_msg = 'Invalid address provided';

    if (typeof base58String !== 'string' || base58String.length <= 4)
        throw new Error(error_msg);

    let address = decode58(base58String);

    if (base58String.length <= 4) throw new Error(error_msg);

    const checkSum = address.slice(-4);

    address = address.slice(0, -4);

    const hash = sha256(sha256(address));
    const checkSum1 = hash.slice(0, 4);

    if (checkSum.join() === checkSum1.join()) return address;

    throw new Error(error_msg);
}

export function signTransaction(
    priKeyBytes: string | SomeBytes,
    transaction: ITransaction,
): ISignedTransaction {
    if (typeof priKeyBytes === 'string')
        priKeyBytes = hexStr2byteArray(priKeyBytes);

    const txID = transaction.txID;
    const signature = getECKeySig(hexStr2byteArray(txID), priKeyBytes);

    if (Array.isArray(transaction.signature)) {
        if (!transaction.signature.includes(signature))
            transaction.signature.push(signature);
    } else {
        transaction.signature = [signature];
    }
    return transaction as ISignedTransaction;
}

export function ecRecover(signedData, signature) {
    signedData = '0x' + signedData.replace(/^0x/, '');
    signature = '0x' + signature.replace(/^0x/, '');

    const recovered = recoverAddress(arrayify(signedData), splitSignature(signature));
    const tronAddress = ADDRESS_PREFIX + recovered.substring(2);
    return tronAddress;
}

export function arrayToBase64String(a: SomeBytes) {
    return btoa(String.fromCharCode(...a));
}

export function signBytes(privateKey: string | SomeBytes, contents: SomeBytes) {
    if (typeof privateKey === 'string')
        privateKey = hexStr2byteArray(privateKey);

    const hashBytes = sha256(contents);
    return getECKeySig(hashBytes, privateKey);
}

export function _signTypedData(
    domain: IDomain,
    types: TypedDataTypes,
    value: Record<string, unknown>,
    privateKey: string,
) {
    const key = {
        toHexString: function () {
            return '0x' + privateKey;
        },
        value: privateKey,
    };
    const signingKey = new SigningKey(key);

    const messageDigest = TypedDataEncoder.hash(domain, types, value);
    const signature = signingKey.signDigest(messageDigest);
    return [
        '0x',
        signature.r.substring(2),
        signature.s.substring(2),
        Number(signature.v).toString(16),
    ].join('');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getRowBytesFromTransactionBase64(base64Data: string) {
    throw new Error('Sorry, this function is not supported.');
    // TODO: what the hell is it? Is it needed? Current impl does not work.
    // const bytesDecode = base64DecodeFromString(base64Data);
    // const transaction =
    //     proto.protocol.Transaction.deserializeBinary(bytesDecode);
    // const raw = transaction.getRawData();

    // return raw.serializeBinary();
}

export function genPriKey() {
    const ec = new EC('secp256k1');
    const key = ec.genKeyPair();
    const priKey = key.getPrivate();

    let priKeyHex = priKey.toString('hex');

    while (priKeyHex.length < 64) priKeyHex = `0${priKeyHex}`;

    return hexStr2byteArray(priKeyHex);
}

export function computeAddress(pubBytes: SomeBytes) {
    if (pubBytes.length === 65) pubBytes = pubBytes.slice(1);

    const hash = keccak256(pubBytes).toString().substring(2);
    const addressHex = ADDRESS_PREFIX + hash.substring(24);

    return hexStr2byteArray(addressHex);
}

export function getAddressFromPriKey(priKeyBytes: SomeBytes) {
    const pubBytes = getPubKeyFromPriKey(priKeyBytes);
    return computeAddress(pubBytes);
}

export function decode58Check(addressStr: string) {
    const decodeCheck = decode58(addressStr);

    if (decodeCheck.length <= 4) return null;
    const checkSum = decodeCheck.slice(-4);

    const decodeData = decodeCheck.slice(0, decodeCheck.length - 4);
    const hash = sha256(sha256(decodeData));

    if (hash.slice(0, 4).join() === checkSum.join()) return decodeData;

    return null;
}

export function isAddressValid(base58Str: string) {
    if (typeof base58Str !== 'string') return false;

    if (base58Str.length !== ADDRESS_SIZE) return false;

    let address = decode58(base58Str);

    if (address.length !== 25) return false;

    if (address[0] !== ADDRESS_PREFIX_BYTE) return false;

    const checkSum = address.slice(21);
    address = address.slice(0, 21);

    const checkSum1 = sha256(sha256(address)).slice(0, 4);
    return checkSum.join() === checkSum1.join();
}

export function getBase58CheckAddressFromPriKeyBase64String(
    priKeyBase64String: string,
) {
    const priKeyBytes = base64DecodeFromString(priKeyBase64String);
    const pubBytes = getPubKeyFromPriKey(priKeyBytes);
    const addressBytes = computeAddress(pubBytes);

    return getBase58CheckAddress(addressBytes);
}

export function getHexStrAddressFromPriKeyBase64String(
    priKeyBase64String: string,
) {
    const priKeyBytes = base64DecodeFromString(priKeyBase64String);
    const pubBytes = getPubKeyFromPriKey(priKeyBytes);
    const addressBytes = computeAddress(pubBytes);
    return byteArray2hexStr(addressBytes);
}

export function getAddressFromPriKeyBase64String(priKeyBase64String: string) {
    const priKeyBytes = base64DecodeFromString(priKeyBase64String);
    const pubBytes = getPubKeyFromPriKey(priKeyBytes);
    const addressBytes = computeAddress(pubBytes);
    return base64EncodeToString(addressBytes);
}

export function getPubKeyFromPriKey(priKeyBytes: SomeBytes) {
    const ec = new EC('secp256k1');
    const key = ec.keyFromPrivate(priKeyBytes, 'bytes');
    const pubkey = key.getPublic();

    const xHex = pubkey.x.toString('hex').padStart(64, '0');
    const yHex = pubkey.y.toString('hex').padStart(64, '0');

    const pubkeyHex = `04${xHex}${yHex}`;
    return hexStr2byteArray(pubkeyHex);
}

export function getECKeySig(hashBytes: SomeBytes, priKeyBytes: SomeBytes) {
    const ec = new EC('secp256k1');
    const key = ec.keyFromPrivate(priKeyBytes, 'bytes');
    const signature = key.sign(hashBytes);

    const rHex = signature.r.toString('hex').padStart(64, '0');
    const sHex = signature.s.toString('hex').padStart(64, '0');
    const idHex = byte2hexStr(signature.recoveryParam);
    return rHex + sHex + idHex;
}
export const ECKeySign = getECKeySig; // backwards-compatible alias

export function sha256(msgBytes: SomeBytes) {
    const msgHex = byteArray2hexStr(msgBytes);
    const hashHex = ethSha256('0x' + msgHex).replace(/^0x/, '');
    return hexStr2byteArray(hashHex);
}

export const SHA256 = sha256; // backwards-compatible alias

export function passwordToAddress(password: string) {
    const com_priKeyBytes = base64DecodeFromString(password);
    const com_addressBytes = getAddressFromPriKey(com_priKeyBytes);

    return getBase58CheckAddress(com_addressBytes);
}

export function pkToAddress(privateKey: string, strict = false) {
    const com_priKeyBytes = hexStr2byteArray(privateKey, strict);
    const com_addressBytes = getAddressFromPriKey(com_priKeyBytes);

    return getBase58CheckAddress(com_addressBytes);
}
