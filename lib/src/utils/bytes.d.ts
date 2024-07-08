/// <reference types="node" />
export declare type SomeBytes = Uint8Array | Buffer | number[];
export declare function byte2hexStr(byte: number): string;
export declare function bytesToString(arr: SomeBytes | string): string;
export declare function hextoString(hex: string): string;
export declare function byteArray2hexStr(byteArray: SomeBytes): string;
export declare function base64DecodeFromString(string64: string): Uint8Array;
export declare function base64EncodeToString(bytes: SomeBytes): string;
//# sourceMappingURL=bytes.d.ts.map