/// <reference types="node" />
import type { ISignedTransaction, ITransaction } from '../lib/transactionBuilder';
import type { SomeBytes } from './bytes';
import type { IDomain } from './typedData';
export { byteArray2hexStr } from './bytes';
export declare type TypedDataTypes = Record<string, {
    name: string;
    type: string;
}[]>;
export declare function getBase58CheckAddress(addressBytes: SomeBytes | Buffer | number[]): string;
export declare function decodeBase58Address(base58String: string): Uint8Array;
export declare function signTransaction(priKeyBytes: string | SomeBytes, transaction: ITransaction): ISignedTransaction;
export declare function arrayToBase64String(a: SomeBytes): string;
export declare function signBytes(privateKey: string | SomeBytes, contents: SomeBytes): string;
export declare function _signTypedData(domain: IDomain, types: TypedDataTypes, value: Record<string, unknown>, privateKey: string): string;
export declare function getRowBytesFromTransactionBase64(base64Data: string): void;
export declare function genPriKey(): Uint8Array;
export declare function computeAddress(pubBytes: SomeBytes): Uint8Array;
export declare function getAddressFromPriKey(priKeyBytes: SomeBytes): Uint8Array;
export declare function decode58Check(addressStr: string): Uint8Array | null;
export declare function isAddressValid(base58Str: string): boolean;
export declare function getBase58CheckAddressFromPriKeyBase64String(priKeyBase64String: string): string;
export declare function getHexStrAddressFromPriKeyBase64String(priKeyBase64String: string): string;
export declare function getAddressFromPriKeyBase64String(priKeyBase64String: string): string;
export declare function getPubKeyFromPriKey(priKeyBytes: SomeBytes): Uint8Array;
export declare function getECKeySig(hashBytes: SomeBytes, priKeyBytes: SomeBytes): string;
export declare const ECKeySign: typeof getECKeySig;
export declare function sha256(msgBytes: SomeBytes): Uint8Array;
export declare const SHA256: typeof sha256;
export declare function passwordToAddress(password: string): string;
export declare function pkToAddress(privateKey: string, strict?: boolean): string;
//# sourceMappingURL=crypto.d.ts.map