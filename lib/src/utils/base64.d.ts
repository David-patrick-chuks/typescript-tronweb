import type { SomeBytes } from './bytes';
export declare class Base64 {
    private _keyStr;
    encode(input: string): string;
    encodeIgnoreUtf8(inputBytes: SomeBytes): string;
    decode(input: string): string;
    decodeToByteArray(input: string): Uint8Array;
    private _out2ByteArray;
    private _utf8_encode;
    private _utf8_decode;
}
//# sourceMappingURL=base64.d.ts.map