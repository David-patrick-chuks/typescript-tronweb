import type { BytesLike } from '@ethersproject/bytes';
import { utils } from 'ethers';
export { Wallet as ethersWallet } from 'ethers';
export type { Wordlist } from 'ethers';
export type { Bytes, BytesLike } from '@ethersproject/bytes';
export type { Mnemonic } from '@ethersproject/hdnode';
declare const keccak256: typeof utils.keccak256, sha256: typeof utils.sha256, toUtf8Bytes: typeof utils.toUtf8Bytes, toUtf8String: typeof utils.toUtf8String, recoverAddress: typeof utils.recoverAddress, SigningKey_: typeof utils.SigningKey, AbiCoder: typeof utils.AbiCoder, Interface: typeof utils.Interface, FormatTypes: {
    [name: string]: string;
}, arrayify: typeof utils.arrayify, splitSignature: typeof utils.splitSignature, joinSignature: typeof utils.joinSignature, concat: typeof utils.concat, id: typeof utils.id, isValidMnemonic: typeof utils.isValidMnemonic;
/**
 * Allow passing less precise values to constructor, because they work
 */
export declare class SigningKey extends SigningKey_ {
    constructor(privateKey: BytesLike | {
        value: string;
        toHexString: () => string;
    });
}
export { keccak256, sha256, toUtf8Bytes, toUtf8String, recoverAddress, AbiCoder, Interface, FormatTypes, splitSignature, joinSignature, arrayify, concat, id, isValidMnemonic, };
//# sourceMappingURL=ethersUtils.d.ts.map