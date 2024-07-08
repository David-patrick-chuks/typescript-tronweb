import BigNumber from 'bignumber.js';
import EventEmitter from 'eventemitter3';
import injectpromise from 'injectpromise';
import Contract from './lib/contract';
import type { ContractEventOptions, IAbi } from './lib/contract';
import Event from './lib/event';
import type { IEvent, IEventResponse } from './lib/event';
import Plugin from './lib/plugin';
import { HttpProvider } from './lib/providers';
import SideChain from './lib/sidechain';
import type { IChainOptions } from './lib/sidechain';
import TransactionBuilder from './lib/transactionBuilder';
import Trx from './lib/trx';
import type { BlockT } from './lib/trx';
import type _CallbackT from './utils/typing';
export declare type ITronWebOptions = {
    headers?: Record<string, string>;
    eventHeaders?: Record<string, string>;
    privateKey?: string;
    disablePlugins?: string[];
} & ({
    fullHost: string;
} | {
    fullNode: HttpProvider | string;
    solidityNode: HttpProvider | string;
    eventServer: HttpProvider | string;
});
export default class TronWeb extends EventEmitter {
    static providers: {
        HttpProvider: typeof HttpProvider;
    };
    static BigNumber: typeof BigNumber;
    static TransactionBuilder: typeof TransactionBuilder;
    static Trx: typeof Trx;
    static Contract: typeof Contract;
    static Plugin: typeof Plugin;
    static Event: typeof Event;
    static version: string;
    static utils: {
        code: typeof import("./utils/code.js");
        accounts: typeof import("./utils/accounts.js");
        base58: typeof import("./utils/base58.js");
        bytes: typeof import("./utils/bytes.js");
        crypto: typeof import("./utils/crypto.js");
        abi: typeof import("./utils/abi.js");
        message: typeof import("./utils/message.js");
        _TypedDataEncoder: typeof import("./utils/typedData.js").TypedDataEncoder;
        ethersUtils: typeof import("./utils/ethersUtils");
        isValidURL(url: any): url is string;
        isObject<T extends object>(obj: unknown): obj is T;
        isArray(array: any): array is unknown[];
        isJson(string: any): boolean;
        isBoolean(bool: any): bool is boolean;
        isBigNumber(number: any): number is BigNumber;
        isString(string: any): string is string;
        isFunction(obj: any): obj is Function;
        isHex(string: any): string is string;
        isInteger(number: any): number is number;
        hasProperty(obj: any, property: string): boolean;
        hasProperties(obj: any, ...properties: string[]): boolean;
        mapEvent(event: IEventResponse): IEvent;
        parseEvent(event: IEvent, { inputs: abi }: {
            inputs: import("./lib/contract").IAbiItem[];
        }): IEvent;
        padLeft(input: any, padding: string, amount: number): string;
        isNotNullOrUndefined<T_1>(val: T_1): val is Exclude<Exclude<T_1, null>, undefined>;
        sleep(millis?: number): Promise<never>;
    };
    version: string;
    providers: {
        HttpProvider: typeof HttpProvider;
    };
    utils: {
        code: typeof import("./utils/code.js");
        accounts: typeof import("./utils/accounts.js");
        base58: typeof import("./utils/base58.js");
        bytes: typeof import("./utils/bytes.js");
        crypto: typeof import("./utils/crypto.js");
        abi: typeof import("./utils/abi.js");
        message: typeof import("./utils/message.js");
        _TypedDataEncoder: typeof import("./utils/typedData.js").TypedDataEncoder;
        ethersUtils: typeof import("./utils/ethersUtils");
        isValidURL(url: any): url is string;
        isObject<T extends object>(obj: unknown): obj is T;
        isArray(array: any): array is unknown[];
        isJson(string: any): boolean;
        isBoolean(bool: any): bool is boolean;
        isBigNumber(number: any): number is BigNumber;
        isString(string: any): string is string;
        isFunction(obj: any): obj is Function;
        isHex(string: any): string is string;
        isInteger(number: any): number is number;
        hasProperty(obj: any, property: string): boolean;
        hasProperties(obj: any, ...properties: string[]): boolean;
        mapEvent(event: IEventResponse): IEvent;
        parseEvent(event: IEvent, { inputs: abi }: {
            inputs: import("./lib/contract").IAbiItem[];
        }): IEvent;
        padLeft(input: any, padding: string, amount: number): string;
        isNotNullOrUndefined<T_1>(val: T_1): val is Exclude<Exclude<T_1, null>, undefined>;
        sleep(millis?: number): Promise<never>;
    };
    BigNumber: typeof BigNumber;
    injectPromise: injectpromise;
    event: Event;
    transactionBuilder: TransactionBuilder;
    trx: Trx;
    plugin: Plugin;
    sidechain?: SideChain<TronWeb>;
    fullNode: HttpProvider;
    solidityNode: HttpProvider;
    eventServer: HttpProvider;
    defaultBlock: BlockT;
    defaultPrivateKey: string;
    defaultAddress: {
        base58: string;
        hex: string;
    };
    fullnodeVersion: string;
    feeLimit: number;
    constructor(options: ITronWebOptions, sideOptions?: IChainOptions);
    constructor(options: string | HttpProvider, solidityNode: string | HttpProvider, eventServer?: string | HttpProvider, sideOptions?: IChainOptions, privateKey?: string | null);
    constructor(options: string | HttpProvider, solidityNode: string | HttpProvider, eventServer?: string | HttpProvider, sideOptions?: string | null);
    getFullnodeVersion(): Promise<void>;
    setDefaultBlock(blockID?: BlockT | undefined): void;
    setPrivateKey(privateKey: string): void;
    setAddress(address: string): void;
    fullnodeSatisfies(version: string): boolean;
    isValidProvider(provider: unknown): boolean;
    setFullNode(fullNode: string | HttpProvider): void;
    setSolidityNode(solidityNode: string | HttpProvider): void;
    setEventServer(eventServer: string | HttpProvider | undefined | null, healthcheck?: string): void;
    setHeader(headers?: Record<string, string>): void;
    setFullNodeHeader(headers?: Record<string, string>): void;
    setEventHeader(headers?: Record<string, string>): void;
    currentProviders(): {
        fullNode: HttpProvider;
        solidityNode: HttpProvider;
        eventServer: HttpProvider;
    };
    currentProvider(): {
        fullNode: HttpProvider;
        solidityNode: HttpProvider;
        eventServer: HttpProvider;
    };
    getEventResult(contractAddress: string, options: ContractEventOptions & {
        rawResponse: true;
    }, callback?: undefined): Promise<IEventResponse>;
    getEventResult(contractAddress: string, options: ContractEventOptions & {
        rawResponse?: false;
    }, callback?: undefined): Promise<IEvent>;
    getEventResult(contractAddress: string, options: ContractEventOptions & {
        rawResponse: true;
    }, callback: _CallbackT<IEventResponse>): void;
    getEventResult(contractAddress: string, options: ContractEventOptions & {
        rawResponse?: false;
    }, callback: _CallbackT<IEvent>): void;
    getEventByTransactionID(transactionID: string, options: ContractEventOptions & {
        rawResponse: true;
    }, callback?: undefined): Promise<IEventResponse>;
    getEventByTransactionID(transactionID: string, options: ContractEventOptions & {
        rawResponse?: false;
    }, callback?: undefined): Promise<IEvent>;
    getEventByTransactionID(transactionID: string, options: ContractEventOptions & {
        rawResponse: true;
    }, callback: _CallbackT<IEventResponse>): void;
    getEventByTransactionID(transactionID: string, options: ContractEventOptions & {
        rawResponse?: false;
    }, callback: _CallbackT<IEvent>): void;
    contract(abi?: IAbi[], address?: string): Contract;
    static get address(): {
        fromHex(address: string): string;
        toHex(address: string): string;
        fromPrivateKey(privateKey: string, strict?: boolean): string;
    };
    get address(): {
        fromHex(address: string): string;
        toHex(address: string): string;
        fromPrivateKey(privateKey: string, strict?: boolean): string;
    };
    static sha3(string: string, prefix?: boolean): string;
    sha3(string: string, prefix?: boolean): string;
    static toHex(val: unknown): string;
    toHex(val: unknown): string;
    static toUtf8(hex: string): string;
    toUtf8(hex: string): string;
    static fromUtf8(string: string): string;
    fromUtf8(string: string): string;
    static toAscii(hex: string): string;
    toAscii(hex: string): string;
    static fromAscii(string: string, padding?: number): string;
    fromAscii(string: string, padding?: number): string;
    static toDecimal(value: string | number | BigNumber): number;
    toDecimal(value: string | number | BigNumber): number;
    static fromDecimal(value: string | number | BigNumber): string;
    fromDecimal(value: string | number | BigNumber): string;
    static fromSun(sun: BigNumber): BigNumber;
    static fromSun(sun: string | number): string;
    fromSun(sun: BigNumber): BigNumber;
    fromSun(sun: string | number): string;
    static toSun(trx: BigNumber): BigNumber;
    static toSun(trx: string | number): string;
    toSun(trx: BigNumber): BigNumber;
    toSun(trx: string | number): string;
    static toBigNumber(amount?: string | number | BigNumber): BigNumber;
    toBigNumber(amount?: string | number | BigNumber): BigNumber;
    static isAddress(address: unknown): address is string;
    isAddress(address: unknown): address is string;
    static createAccount(): Promise<import("./utils/accounts.js").IAccount>;
    createAccount(): Promise<import("./utils/accounts.js").IAccount>;
    static createRandom(options?: {}): import("./utils/accounts.js").IAccountWithMnemonic;
    createRandom(options?: {}): import("./utils/accounts.js").IAccountWithMnemonic;
    static fromMnemonic(mnemonic: string, path?: string, wordlist?: string): import("./utils/accounts.js").IAccountWithMnemonic;
    fromMnemonic(mnemonic: string, path?: string, wordlist?: string): import("./utils/accounts.js").IAccountWithMnemonic;
    isConnected(callback?: undefined): Promise<any>;
    isConnected(callback: _CallbackT<any>): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map