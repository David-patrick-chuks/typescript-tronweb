/// <reference types="node" />
import TronWeb from '../..';
import { WithTronwebAndInjectpromise } from '../../../src/utils/_base';
import type { SmartContract_ABI_Entry_StateMutabilityType as IAbiStateMutability } from '../../proto/core/contract/smart_contract';
import type _CallbackT from '../../utils/typing';
import type { IEvent } from '../event';
import type { ContractOptions } from '../transactionBuilder';
import Method from './method';
export type { IMethodSendOptions } from './method';
export interface IAbiItem {
    name: string;
    type: string;
    components?: IAbiItem[];
    internalType?: string;
}
export interface IEventAbiItem extends IAbiItem {
    indexed: boolean;
}
export interface IFuncAbi {
    name: string;
    type: 'function' | 'constructor' | 'receive' | 'fallback';
    stateMutability: IAbiStateMutability;
    inputs: IAbiItem[];
    outputs: IAbiItem[];
    constant?: boolean;
    payable?: boolean;
}
export interface IEventAbi {
    name: string;
    type: 'event';
    inputs: IEventAbiItem[];
    anonymous: boolean;
}
export interface IErrorAbi {
    name: string;
    type: 'error';
    inputs: IEventAbiItem[];
}
export declare type IAbi = IFuncAbi | IEventAbi | IErrorAbi;
export interface ContractEventOptions {
    sinceTimestamp?: number;
    since?: any;
    fromTimestamp?: number;
    eventName?: string;
    blockNumber?: number;
    size?: number;
    page?: number;
    onlyConfirmed?: any;
    onlyUnconfirmed?: any;
    previousLastEventFingerprint?: any;
    previousFingerprint?: any;
    fingerprint?: any;
    rawResponse?: boolean;
    sort?: string;
    filters?: unknown | unknown[];
    resourceNode?: string;
}
declare class _Contract extends WithTronwebAndInjectpromise {
    address: string | null;
    abi: IAbi[];
    eventListener: NodeJS.Timer | null | undefined;
    eventCallback: ((event: IEvent) => void) | null | undefined;
    bytecode: unknown;
    deployed: boolean;
    lastBlock: unknown;
    methods: Record<string, MethodCallT>;
    methodInstances: Record<string, Method>;
    props: string[];
    constructor(tronWeb: TronWeb, abi?: IAbi[], address?: string);
    _getEvents(options?: ContractEventOptions): Promise<IEvent[]>;
    _startEventListener(options?: ContractEventOptions, callback?: (event: IEvent) => void): Promise<void>;
    _stopEventListener(): void;
    hasProperty(property: string): boolean;
    loadAbi(abi: IAbi[]): void;
    decodeInput(data: string): {
        name: string;
        params: import("@ethersproject/abi").Result;
    };
    new(options: ContractOptions, privateKey: string, callback?: unknown): Promise<this>;
    new(options: ContractOptions, privateKey: string, callback: _CallbackT<this>): Promise<void>;
    at(contractAddress: string, callback?: unknown): Promise<this>;
    at(contractAddress: string, callback: _CallbackT<this>): Promise<void>;
    events(options: ContractEventOptions | undefined, callback: _CallbackT<any>): {
        start(startCallback: (err?: unknown) => unknown): any;
        stop(): void;
    };
}
declare type MethodCallT = Method['onMethod'];
declare type ContractT = _Contract & {
    [key: string]: MethodCallT;
};
declare const _ContractI: {
    new (tronWeb: TronWeb, abi: IAbi[], address?: string): ContractT;
};
export default class Contract extends _ContractI {
}
//# sourceMappingURL=index.d.ts.map