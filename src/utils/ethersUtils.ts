import { utils, BytesLike } from 'ethers';
export { Wallet as ethersWallet, Wordlist, Bytes, BytesLike } from 'ethers';
export { Mnemonic } from '@ethersproject/hdnode';

const {
    keccak256,
    sha256,
    toUtf8Bytes,
    toUtf8String,
    recoverAddress,
    SigningKey: SigningKey_,
    AbiCoder,
    Interface,
    FormatTypes,
    arrayify,
    splitSignature,
    joinSignature,
    concat,
    id,
    isValidMnemonic,
} = utils;

/**
 * Allow passing less precise values to constructor, because they work
 */
export class SigningKey extends SigningKey_ {
    constructor(
        privateKey: BytesLike | { value: string; toHexString: () => string },
    ) {
        super(privateKey as BytesLike);
    }
}

export {
    keccak256,
    sha256,
    toUtf8Bytes,
    toUtf8String,
    recoverAddress,
    AbiCoder,
    Interface,
    FormatTypes,
    splitSignature,
    joinSignature,
    arrayify,
    concat,
    id,
    isValidMnemonic,
};
