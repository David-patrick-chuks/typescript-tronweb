import {ADDRESS_PREFIX} from './address';
import {hexStr2byteArray} from './code';
import {
    byteArray2hexStr,
    decodeBase58Address,
    getBase58CheckAddress,
} from './crypto';

export function hexStringToBase58(sHexString: string): string {
    if (sHexString.length < 2 || (sHexString.length & 1) !== 0) return '';

    const bytes = hexStr2byteArray(sHexString);
    return getBase58CheckAddress(bytes);
}

export function base58ToHexString(sBase58: string): string {
    const bytes = decodeBase58Address(sBase58);
    return byteArray2hexStr(bytes);
}

export function hexStringToUtf8(hex: string): string {
    const arr = hex.split('');
    let out = '';

    for (let i = 0; i < arr.length / 2; i++) {
        const tmp = `0x${arr[i * 2]}${arr[i * 2 + 1]}`;
        out += String.fromCharCode(parseInt(tmp, 16));
    }

    return out;
}

export function stringUtf8tHex(str: string): string {
    let val = '';
    for (let i = 0; i < str.length; i++) val += str.charCodeAt(i).toString(16);
    return val;
}

export function address2HexString(sHexAddress: string): string {
    if (sHexAddress.length === 42 && sHexAddress.indexOf(ADDRESS_PREFIX) === 0)
        return sHexAddress;

    return base58ToHexString(sHexAddress);
}

export const hexString2Address = hexStringToBase58;
export const hexString2Utf8 = hexStringToUtf8;
export const stringUtf8toHex = stringUtf8tHex;
