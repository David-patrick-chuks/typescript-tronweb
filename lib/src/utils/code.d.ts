import { base64DecodeFromString, base64EncodeToString, byte2hexStr, byteArray2hexStr, bytesToString, hextoString } from './bytes';
export declare const bin2String: typeof bytesToString;
export declare function arrayEquals(array1: {
    length: number;
    [key: number]: unknown;
}, array2: {
    length: number;
    [key: number]: unknown;
}, strict?: boolean): boolean;
export declare function stringToBytes(str: string): Uint8Array;
export { byte2hexStr, bytesToString, hextoString, byteArray2hexStr, base64DecodeFromString, base64EncodeToString, };
export declare function hexChar2byte(c: string): number;
export declare function isHexChar(c: string): boolean;
/**
 * Convert a hex string to a byte array.
 * @param strict: if strict and the length of str is odd, pad it left with one zero
 */
export declare function hexStr2byteArray(str: string, strict?: boolean): Uint8Array;
/**
 * Convert string of form `yyyy-MM-DD HH-mm-ss` to `Date`
 */
export declare function strToDate(str: string): Date;
export declare function isNumber(c: string | number): boolean;
/**
 * return 1: address  --- 20Bytes HexString
 * return 2: blockNumber ------ Decimal number
 * return 3: assetName ------ String
 * return other: error
 */
export declare function getStringType(str: string): 1 | 2 | 3 | -1;
//# sourceMappingURL=code.d.ts.map