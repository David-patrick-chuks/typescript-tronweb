import {Base64} from './base64';

export type SomeBytes = Uint8Array | Buffer | number[];

export function byte2hexStr(byte: number) {
    if (typeof byte !== 'number') throw new Error('Input must be a number');
    if (byte < 0 || byte > 255) throw new Error('Input must be a byte');

    const hexByteMap = '0123456789ABCDEF';
    return hexByteMap.charAt(byte >> 4) + hexByteMap.charAt(byte & 0x0f);
}

export function bytesToString(arr: SomeBytes | string) {
    if (typeof arr === 'string') return arr;

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
        } else {
            str += String.fromCharCode(arr[i]);
        }
    }

    return str;
}

export function hextoString(hex: string) {
    const arr = hex.replace(/^0x/, '').split('');
    let out = '';

    for (let i = 0; i < arr.length / 2; i++) {
        const tmp = `0x${arr[i * 2]}${arr[i * 2 + 1]}`;
        out += String.fromCharCode(parseInt(tmp, 16));
    }

    return out;
}

export function byteArray2hexStr(byteArray: SomeBytes) {
    let str = '';

    for (const b of byteArray) str += byte2hexStr(b);

    return str;
}

export function base64DecodeFromString(string64: string) {
    return new Base64().decodeToByteArray(string64);
}

export function base64EncodeToString(bytes: SomeBytes) {
    const b = new Base64();
    return b.encodeIgnoreUtf8(bytes);
}
