import Contract from '.';
import type { IAbiItem, IFuncAbi } from '.';
import type { ContractEventOptions } from '.';
import { WithTronwebAndInjectpromise } from '../../utils/_base';
import type _CallbackT from '../../utils/typing';
import type { ContractOptions, ITriggerContractOptions } from '../transactionBuilder';
import type { ITransactionInfo } from '../trx';
export interface IMethodSendOptions extends Partial<ContractOptions> {
    from?: string;
    shouldPollResponse?: boolean;
    maxRetries?: number;
    pollingInterval?: number;
    rawResponse?: boolean;
    keepTxID?: boolean;
}
export interface IOnMethod {
    call(options?: ITriggerContractOptions, callback?: undefined): Promise<any>;
    call(options: ITriggerContractOptions | undefined, callback: _CallbackT<any>): Promise<void>;
    send(options: IMethodSendOptions & {
        shouldPollResponse: false;
    }, privateKey?: string, callback?: undefined): Promise<string>;
    send(options: IMethodSendOptions & {
        shouldPollResponse: false;
    }, privateKey: string | undefined, callback: _CallbackT<string>): Promise<void>;
    send(options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey?: string, callback?: undefined): Promise<ITransactionInfo>;
    send(options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: true;
    }, privateKey: string | undefined, callback: _CallbackT<ITransactionInfo>): Promise<void>;
    send(options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: false;
        keepTxID: true;
    }, privateKey?: string, callback?: undefined): Promise<[string, any]>;
    send(options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: false;
        keepTxID: true;
    }, privateKey: string | undefined, callback: _CallbackT<[string, any]>): Promise<void>;
    send(options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: false;
        keepTxID: false;
    }, privateKey?: string, callback?: undefined): Promise<any>;
    send(options: IMethodSendOptions & {
        shouldPollResponse: true;
        rawResponse: false;
        keepTxID: false;
    }, privateKey: string | undefined, callback: _CallbackT<any>): Promise<void>;
    send(options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<any>): Promise<any>;
    watch(options: ContractEventOptions, callback: _CallbackT<any>): Promise<{
        start: () => void;
        stop: () => void;
    }>;
}
export default class Method extends WithTronwebAndInjectpromise {
    contract: Contract;
    abi: IFuncAbi;
    name: string;
    inputs: IAbiItem[];
    outputs: IAbiItem[];
    functionSelector: string;
    signature: string;
    defaultOptions: {
        feeLimit: number;
        callValue: number;
        userFeePercentage: number;
        shouldPollResponse: boolean;
    };
    constructor(contract: Contract, abi: IFuncAbi);
    decodeInput(data: any): import("@ethersproject/abi").Result;
    onMethod(...args: any[]): IOnMethod;
    _call(types: string[], args: unknown[], options?: ITriggerContractOptions, callback?: _CallbackT<any>): Promise<any>;
    _send(types: string[], args: unknown[], options?: IMethodSendOptions, privateKey?: string, callback?: _CallbackT<any>): Promise<any>;
    _watch(options: Partial<ContractEventOptions> | undefined, callback: _CallbackT<any>): Promise<void | {
        start: () => void;
        stop: () => void;
    }>;
}
//# sourceMappingURL=method.d.ts.map