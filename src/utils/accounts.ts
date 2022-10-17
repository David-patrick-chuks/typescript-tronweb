import { byteArray2hexStr } from './bytes';
import {
    getBase58CheckAddress,
    genPriKey,
    getAddressFromPriKey,
    getPubKeyFromPriKey,
    pkToAddress,
} from './crypto';
import { ethersWallet, Wordlist, Mnemonic } from './ethersUtils';
import { TRON_BIP39_PATH_INDEX_0 } from './address';
import utils from './index';

const INVALID_TRON_PATH_ERROR_MSG = 'Invalid tron path provided';

export interface IAccountBase {
    privateKey: string;
    publicKey: string;
}
export type IAccountWithMnemonic = IAccountBase & {
    mnemonic: Mnemonic;
    address: string;
};

export function generateAccount(): IAccountBase & {
    address: { base58: string; hex: string };
} {
    const priKeyBytes = genPriKey();
    const pubKeyBytes = getPubKeyFromPriKey(priKeyBytes);
    const addressBytes = getAddressFromPriKey(priKeyBytes);

    const privateKey = byteArray2hexStr(priKeyBytes);
    const publicKey = byteArray2hexStr(pubKeyBytes);

    return {
        privateKey,
        publicKey,
        address: {
            base58: getBase58CheckAddress(addressBytes),
            hex: byteArray2hexStr(addressBytes),
        },
    };
}

export function generateRandom(options?: {
    path?: string;
}): IAccountWithMnemonic {
    if (!utils.isObject(options)) options = {};
    if (!options.path) options.path = TRON_BIP39_PATH_INDEX_0;

    // FIXME: no escape neeed here and below for singlequote
    if (!String(options.path).match(/^m\/44\'\/195\'/))
        throw new Error(INVALID_TRON_PATH_ERROR_MSG);

    const account = ethersWallet.createRandom(options);

    const result = {
        mnemonic: account.mnemonic,
        privateKey: account.privateKey,
        publicKey: account.publicKey,
        address: pkToAddress(account.privateKey.replace(/^0x/, '')),
    };

    return result;
}

export function generateAccountWithMnemonic(
    mnemonic: string,
    path: string,
    wordlist: string | Wordlist = 'en'
): IAccountWithMnemonic {
    if (!path) path = TRON_BIP39_PATH_INDEX_0;

    if (!String(path).match(/^m\/44\'\/195\'/))
        throw new Error(INVALID_TRON_PATH_ERROR_MSG);

    // FIXME: remove, if merged https://github.com/ethers-io/ethers.js/pull/3440
    // @ts-ignore
    const account = ethersWallet.fromMnemonic(mnemonic, path, wordlist);

    return {
        mnemonic: account.mnemonic,
        privateKey: account.privateKey,
        publicKey: account.publicKey,
        address: pkToAddress(account.privateKey.replace(/^0x/, '')),
    };
}
