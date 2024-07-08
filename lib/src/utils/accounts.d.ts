import type { Mnemonic, Wordlist } from './ethersUtils';
export interface IAccountBase {
    privateKey: string;
    publicKey: string;
}
export interface IAccountWithMnemonic extends IAccountBase {
    mnemonic: Mnemonic;
    address: string;
}
export interface IAccount extends IAccountBase {
    address: {
        base58: string;
        hex: string;
    };
}
export declare function generateAccount(): IAccount;
export declare function generateRandom(options?: {
    path?: string;
}): IAccountWithMnemonic;
export declare function generateAccountWithMnemonic(mnemonic: string, path?: string | null, wordlist?: string | Wordlist): IAccountWithMnemonic;
//# sourceMappingURL=accounts.d.ts.map