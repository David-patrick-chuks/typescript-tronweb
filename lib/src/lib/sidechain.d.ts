/// <reference types="node" />
import BigNumber from 'bignumber.js';
import injectpromise from 'injectpromise';
import TronWeb from '..';
import Validator from '../paramValidator';
import type _CallbackT from '../utils/typing';
import type { IMethodSendOptions } from './contract';
import { HttpProvider } from './providers';
import type { ITransaction } from './transactionBuilder';
import type { ITransactionInfo, MakeSigned } from './trx';
export declare type IChainOptions = {
    mainGatewayAddress: string;
    sideGatewayAddress: string;
    sideChainId: string;
} & ({
    fullHost: string;
} | {
    fullNode: HttpProvider | string;
    solidityNode: HttpProvider | string;
    eventServer?: HttpProvider | string;
});
export default class SideChain<T extends TronWeb> {
    mainchain: T;
    sidechain: TronWeb;
    isAddress: TronWeb['isAddress'];
    utils: TronWeb['utils'];
    injectPromise: injectpromise;
    validator: Validator;
    mainGatewayAddress: string;
    sideGatewayAddress: string;
    chainId: string;
    constructor(sideOptions: IChainOptions, TronWebCls: typeof TronWeb, mainchain: T, privateKey: string);
    setMainGatewayAddress(mainGatewayAddress: any): void;
    setSideGatewayAddress(sideGatewayAddress: any): void;
    setChainId(sideChainId: any): void;
    signTransaction<T extends ITransaction>(priKeyBytes: string | Uint8Array | Buffer | number[], transaction: T): MakeSigned<T>;
    multiSign(transaction: ITransaction, privateKey?: string, permissionId?: number, callback?: undefined): Promise<MakeSigned<ITransaction>>;
    multiSign(transaction: ITransaction, privateKey: string | undefined, permissionId: number | undefined | null, callback?: _CallbackT<MakeSigned<ITransaction>>): Promise<void>;
    sign<T extends string | ITransaction>(transaction: T, privateKey?: string, useTronHeader?: boolean, multisig?: boolean, callback?: undefined): Promise<MakeSigned<T>>;
    sign<T extends string | ITransaction>(transaction: T, privateKey: string, useTronHeader: boolean, multisig: boolean, callback: _CallbackT<MakeSigned<T>>): Promise<void>;
    /**
     * deposit asset to sidechain
     */
    depositTrx(callValue: number, depositFee: number, feeLimit: number, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    depositTrx(callValue: number, depositFee: number, feeLimit: number, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    depositTrx(callValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    depositTrx(callValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    depositTrx(callValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    depositTrx(callValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    depositTrx(callValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    depositTrx(callValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    depositTrx(callValue: number, depositFee: number, feeLimit: number, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    depositTrc10(tokenId: number, tokenValue: number, depositFee: number, feeLimit: number, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    depositTrc10(tokenId: number, tokenValue: number, depositFee: number, feeLimit: number, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    depositTrc10(tokenId: number, tokenValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    depositTrc10(tokenId: number, tokenValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    depositTrc10(tokenId: number, tokenValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    depositTrc10(tokenId: number, tokenValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    depositTrc10(tokenId: number, tokenValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    depositTrc10(tokenId: number, tokenValue: number, depositFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    depositTrc10(tokenId: number, tokenValue: number, depositFee: number, feeLimit: number, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    depositTrc(functionSelector: string, num: number, fee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    depositTrc(functionSelector: string, num: number, fee: number, feeLimit: number, contractAddress: string, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    depositTrc(functionSelector: string, num: number, fee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    depositTrc(functionSelector: string, num: number, fee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    depositTrc(functionSelector: string, num: number, fee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    depositTrc(functionSelector: string, num: number, fee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    depositTrc(functionSelector: string, num: number, fee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    depositTrc(functionSelector: string, num: number, fee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    depositTrc(functionSelector: string, num: number, fee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    approveTrc20(num: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    approveTrc20(num: number, feeLimit: number, contractAddress: string, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    approveTrc20(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    approveTrc20(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    approveTrc20(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    approveTrc20(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    approveTrc20(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    approveTrc20(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    approveTrc20(num: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    approveTrc721(num: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    approveTrc721(num: number, feeLimit: number, contractAddress: string, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    approveTrc721(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    approveTrc721(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    approveTrc721(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    approveTrc721(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    approveTrc721(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    approveTrc721(num: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    approveTrc721(num: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    depositTrc20(num: number, depositFee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    depositTrc20(num: number, depositFee: number, feeLimit: number, contractAddress: string, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    depositTrc20(num: number, depositFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    depositTrc20(num: number, depositFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    depositTrc20(num: number, depositFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    depositTrc20(num: number, depositFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    depositTrc20(num: number, depositFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    depositTrc20(num: number, depositFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    depositTrc20(num: number, depositFee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    depositTrc721: this['depositTrc20'];
    /**
     * mapping asset TRC20 or TRC721 to DAppChain
     */
    mappingTrc(trxHash: string, mappingFee: number, feeLimit: number, functionSelector: string, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    mappingTrc(trxHash: string, mappingFee: number, feeLimit: number, functionSelector: string, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    mappingTrc(trxHash: string, mappingFee: number, feeLimit: number, functionSelector: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    mappingTrc(trxHash: string, mappingFee: number, feeLimit: number, functionSelector: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    mappingTrc(trxHash: string, mappingFee: number, feeLimit: number, functionSelector: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    mappingTrc(trxHash: string, mappingFee: number, feeLimit: number, functionSelector: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    mappingTrc(trxHash: string, mappingFee: number, feeLimit: number, functionSelector: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    mappingTrc(trxHash: string, mappingFee: number, feeLimit: number, functionSelector: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    mappingTrc(trxHash: string, mappingFee: number, feeLimit: number, functionSelector: string, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    mappingTrc20(trxHash: string, mappingFee: number, feeLimit: number, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    mappingTrc20(trxHash: string, mappingFee: number, feeLimit: number, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    mappingTrc20(trxHash: string, mappingFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    mappingTrc20(trxHash: string, mappingFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    mappingTrc20(trxHash: string, mappingFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    mappingTrc20(trxHash: string, mappingFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    mappingTrc20(trxHash: string, mappingFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    mappingTrc20(trxHash: string, mappingFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    mappingTrc20(trxHash: string, mappingFee: number, feeLimit: number, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    mappingTrc721: this['mappingTrc20'];
    /**
     * withdraw trx from sidechain to mainchain
     */
    withdrawTrx(callValue: number, withdrawFee: number, feeLimit: number, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    withdrawTrx(callValue: number, withdrawFee: number, feeLimit: number, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    withdrawTrx(callValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    withdrawTrx(callValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    withdrawTrx(callValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    withdrawTrx(callValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    withdrawTrx(callValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    withdrawTrx(callValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    withdrawTrx(callValue: number, withdrawFee: number, feeLimit: number, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    withdrawTrc10(tokenId: number, tokenValue: number, withdrawFee: number, feeLimit: number, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    withdrawTrc10(tokenId: number, tokenValue: number, withdrawFee: number, feeLimit: number, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    withdrawTrc10(tokenId: number, tokenValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    withdrawTrc10(tokenId: number, tokenValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    withdrawTrc10(tokenId: number, tokenValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    withdrawTrc10(tokenId: number, tokenValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    withdrawTrc10(tokenId: number, tokenValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    withdrawTrc10(tokenId: number, tokenValue: number, withdrawFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    withdrawTrc10(tokenId: number, tokenValue: number, withdrawFee: number, feeLimit: number, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    withdrawTrc(functionSelector: string, numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    withdrawTrc(functionSelector: string, numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    withdrawTrc(functionSelector: string, numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    withdrawTrc(functionSelector: string, numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    withdrawTrc(functionSelector: string, numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    withdrawTrc(functionSelector: string, numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    withdrawTrc(functionSelector: string, numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    withdrawTrc(functionSelector: string, numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    withdrawTrc(functionSelector: string, numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    withdrawTrc20(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    withdrawTrc20(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    withdrawTrc20(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    withdrawTrc20(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    withdrawTrc20(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    withdrawTrc20(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    withdrawTrc20(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    withdrawTrc20(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    withdrawTrc20(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    withdrawTrc721(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    withdrawTrc721(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    withdrawTrc721(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    withdrawTrc721(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    withdrawTrc721(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    withdrawTrc721(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    withdrawTrc721(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    withdrawTrc721(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    withdrawTrc721(numOrId: number, withdrawFee: number, feeLimit: number, contractAddress: string, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    injectFund(num: number, feeLimit: number, options?: unknown, privateKey?: string, callback?: undefined): Promise<string>;
    injectFund(num: number, feeLimit: number, options: unknown, privateKey: string, callback: _CallbackT<string>): Promise<void>;
    retryWithdraw(nonce: number, retryFee: number, feeLimit: number, options?: IMethodSendOptions & {
        shouldPollResponse?: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    retryWithdraw(nonce: number, retryFee: number, feeLimit: number, options: undefined | (IMethodSendOptions & {
        shouldPollResponse: false;
    }), privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    retryWithdraw(nonce: number, retryFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    retryWithdraw(nonce: number, retryFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    retryWithdraw(nonce: number, retryFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, BigNumber]>;
    retryWithdraw(nonce: number, retryFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, BigNumber]>): Promise<void>;
    retryWithdraw(nonce: number, retryFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey?: string, callback?: undefined): Promise<BigNumber>;
    retryWithdraw(nonce: number, retryFee: number, feeLimit: number, options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse?: false;
        keepTxID?: false;
    }, privateKey: string | undefined, callback: _CallbackT<BigNumber>): Promise<void>;
    retryWithdraw(nonce: number, retryFee: number, feeLimit: number, options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<BigNumber>): Promise<BigNumber>;
    retryDeposit: this['retryWithdraw'];
    retryMapping: this['retryWithdraw'];
}
//# sourceMappingURL=sidechain.d.ts.map