import BigNumber from 'bignumber.js';
import EventEmitter from 'eventemitter3';
import injectpromise from 'injectpromise';
import semver from 'semver';

import {version} from '../package.json';
import {default as Contract, IAbi} from './lib/contract';
import {ContractOptions} from './lib/contract';
import Event from './lib/event';
import Plugin from './lib/plugin';
import providers from './lib/providers';
import {HttpProvider} from './lib/providers';
import SideChain from './lib/sidechain';
import {IChainOptions} from './lib/sidechain';
import TransactionBuilder from './lib/transactionBuilder';
import Trx from './lib/trx';
import {BlockT} from './lib/trx';
import utils from './utils';
import {ADDRESS_PREFIX, TRON_BIP39_PATH_INDEX_0} from './utils/address';
import {keccak256} from './utils/ethersUtils';
import _CallbackT from './utils/typing';

const DEFAULT_VERSION = '3.5.0';

const FEE_LIMIT = 150000000;

export type ITronWebOptions = {
    headers?: Record<string, string>;
    eventHeaders?: Record<string, string>;
    privateKey?: string;
    disablePlugins?: string[];
} & (
    | {fullHost: string}
    | {
          fullNode: HttpProvider | string;
          solidityNode: HttpProvider | string;
          eventServer: HttpProvider | string;
      }
);

export default class TronWeb extends EventEmitter {
    static providers = providers;
    static BigNumber = BigNumber;
    static TransactionBuilder = TransactionBuilder;
    static Trx = Trx;
    static Contract = Contract;
    static Plugin = Plugin;
    static Event = Event;
    static version = version;
    static utils = utils;
    version = version;

    providers = providers;
    utils = utils;
    BigNumber = BigNumber;
    injectPromise: injectpromise;

    event: Event;
    transactionBuilder: TransactionBuilder;
    trx: Trx;
    plugin: Plugin;
    sidechain?: SideChain<TronWeb>;

    fullNode!: HttpProvider;
    solidityNode!: HttpProvider;
    eventServer!: HttpProvider;

    defaultBlock: BlockT;
    defaultPrivateKey: string;
    defaultAddress: {
        base58: string;
        hex: string;
    };
    fullnodeVersion = DEFAULT_VERSION;
    feeLimit = FEE_LIMIT;

    constructor(options: ITronWebOptions, sideOptions?: IChainOptions);
    constructor(
        // for retro-compatibility:
        options: string | HttpProvider,
        solidityNode: string | HttpProvider,
        eventServer?: string | HttpProvider,
        sideOptions?: IChainOptions,
        privateKey?: string | null,
    );
    constructor(
        // for retro-compatibility:
        options: string | HttpProvider,
        solidityNode: string | HttpProvider,
        eventServer?: string | HttpProvider,
        sideOptions?: string | null,
    );
    constructor(
        options: ITronWebOptions | string | HttpProvider,
        // for retro-compatibility:
        solidityNode?: string | IChainOptions | HttpProvider,
        eventServer?: string | HttpProvider,
        sideOptions?: IChainOptions | string | null,
        privateKey?: string,
    ) {
        super();

        let fullNode;
        let headers;
        let eventHeaders;

        if (
            typeof options === 'object' &&
            ('fullNode' in options || 'fullHost' in options) &&
            ('fullNode' in options ? options.fullNode : options.fullHost)
        ) {
            fullNode =
                'fullNode' in options ? options.fullNode : options.fullHost;
            // shift
            sideOptions = solidityNode as any as IChainOptions;
            solidityNode =
                'solidityNode' in options
                    ? options.solidityNode
                    : options.fullHost;
            eventServer =
                'eventServer' in options
                    ? options.eventServer
                    : options.fullHost;
            headers = options.headers || false;
            eventHeaders = options.eventHeaders || headers;
            privateKey = options.privateKey;
        } else {
            fullNode = options;
        }
        if (utils.isString(fullNode)) fullNode = new HttpProvider(fullNode);
        if (utils.isString(solidityNode))
            solidityNode = new HttpProvider(solidityNode);
        if (utils.isString(eventServer))
            eventServer = new HttpProvider(eventServer);

        this.event = new Event(this);
        this.transactionBuilder = new TransactionBuilder(this);
        this.trx = new Trx(this);
        this.plugin = new Plugin(this, options as Record<string, unknown>);
        // this.utils = utils;

        this.setFullNode(fullNode);
        this.setSolidityNode(solidityNode as HttpProvider);
        this.setEventServer(eventServer!);

        // this.providers = providers;
        // this.BigNumber = BigNumber;

        // This allows undefined, but allowing it in class body raises 100+ errors
        // @ts-ignore
        this.defaultBlock = undefined;
        // @ts-ignore
        this.defaultPrivateKey = undefined;
        this.defaultAddress = {
            // @ts-ignore
            hex: undefined,
            // @ts-ignore
            base58: undefined,
        };

        // Done after defns?
        // [
        //     'sha3',
        //     'toHex',
        //     'toUtf8',
        //     'fromUtf8',
        //     'toAscii',
        //     'fromAscii',
        //     'toDecimal',
        //     'fromDecimal',
        //     'toSun',
        //     'fromSun',
        //     'toBigNumber',
        //     'isAddress',
        //     'createAccount',
        //     'address',
        //     'version',
        //     'createRandom',
        //     'fromMnemonic',
        // ].forEach((key) => {
        //     this[key] = TronWeb[key];
        // });

        // for sidechain
        if (
            sideOptions &&
            typeof sideOptions === 'object' &&
            ('fullNode' in sideOptions
                ? sideOptions.fullNode
                : sideOptions.fullHost)
        )
            this.sidechain = new SideChain(
                sideOptions,
                TronWeb,
                this,
                // WTF? Was options.privateKey, which makes even less sense
                // @ts-ignore
                privateKey,
            );
        else if (typeof sideOptions !== 'string' && sideOptions != null)
            throw new TypeError('Wrong options combination provided');
        else if (sideOptions != null) privateKey = privateKey || sideOptions;

        if (privateKey) this.setPrivateKey(privateKey);
        // this.fullnodeVersion = DEFAULT_VERSION;
        // this.feeLimit = FEE_LIMIT;
        this.injectPromise = injectpromise(this);

        if (headers) this.setFullNodeHeader(headers);

        if (eventHeaders) this.setEventHeader(eventHeaders);
    }

    async getFullnodeVersion() {
        try {
            const nodeInfo = await this.trx.getNodeInfo();
            this.fullnodeVersion = nodeInfo.configNodeInfo.codeVersion;
            if (this.fullnodeVersion.split('.').length === 2)
                this.fullnodeVersion += '.0';
        } catch (err) {
            this.fullnodeVersion = DEFAULT_VERSION;
        }
    }

    setDefaultBlock(blockID?: BlockT | undefined) {
        if ([undefined, 'latest', 'earliest', 0].includes(blockID)) {
            // This allows undefined, but allowing it in class body raises 100+ errors
            // @ts-ignore
            this.defaultBlock = blockID;
            return;
        }

        if (!utils.isInteger(blockID) || !blockID)
            throw new Error('Invalid block ID provided');

        this.defaultBlock = Math.abs(blockID);
    }

    setPrivateKey(privateKey: string) {
        try {
            const addr = this.address.fromPrivateKey(privateKey);
            if (addr) this.setAddress(addr);
            else throw new Error();
        } catch {
            throw new Error('Invalid private key provided');
        }

        this.defaultPrivateKey = privateKey;
        this.emit('privateKeyChanged', privateKey);
    }

    setAddress(address: string) {
        if (!this.isAddress(address))
            throw new Error('Invalid address provided');

        const hex = this.address.toHex(address);
        const base58 = this.address.fromHex(address);

        if (
            this.defaultPrivateKey &&
            this.address.fromPrivateKey(this.defaultPrivateKey) !== base58
        )
            // This allows undefined, but allowing it in class body raises 100+ errors
            // @ts-ignore
            this.defaultPrivateKey = undefined;

        this.defaultAddress = {
            hex,
            base58,
        };

        this.emit('addressChanged', {hex, base58});
    }

    fullnodeSatisfies(version: string): boolean {
        return semver.satisfies(this.fullnodeVersion, version);
    }

    isValidProvider(provider: unknown): boolean {
        return Object.values(providers).some(
            (knownProvider: any) => provider instanceof knownProvider,
        );
    }

    setFullNode(fullNode: string | HttpProvider) {
        if (utils.isString(fullNode)) fullNode = new HttpProvider(fullNode);

        if (!this.isValidProvider(fullNode))
            throw new Error('Invalid full node provided');

        this.fullNode = fullNode;
        this.fullNode.setStatusPage('wallet/getnowblock');

        this.getFullnodeVersion();
    }

    setSolidityNode(solidityNode: string | HttpProvider) {
        if (utils.isString(solidityNode))
            solidityNode = new HttpProvider(solidityNode);

        if (!this.isValidProvider(solidityNode))
            throw new Error('Invalid solidity node provided');

        this.solidityNode = solidityNode;
        this.solidityNode.setStatusPage('walletsolidity/getnowblock');
    }

    setEventServer(
        eventServer: string | HttpProvider | undefined | null,
        healthcheck = 'healthcheck',
    ): void {
        this.event.setServer(eventServer, healthcheck);
    }

    setHeader(headers: Record<string, string> = {}) {
        const fullNode = new HttpProvider(
            this.fullNode.host,
            30000,
            undefined,
            undefined,
            headers,
        );
        const solidityNode = new HttpProvider(
            this.solidityNode.host,
            30000,
            undefined,
            undefined,
            headers,
        );
        const eventServer = new HttpProvider(
            this.eventServer.host,
            30000,
            undefined,
            undefined,
            headers,
        );

        this.setFullNode(fullNode);
        this.setSolidityNode(solidityNode);
        this.setEventServer(eventServer);
    }

    setFullNodeHeader(headers: Record<string, string> = {}) {
        const fullNode = new HttpProvider(
            this.fullNode.host,
            30000,
            undefined,
            undefined,
            headers,
        );
        const solidityNode = new HttpProvider(
            this.solidityNode.host,
            30000,
            undefined,
            undefined,
            headers,
        );

        this.setFullNode(fullNode);
        this.setSolidityNode(solidityNode);
    }

    setEventHeader(headers: Record<string, string> = {}) {
        const eventServer = new HttpProvider(
            this.eventServer.host,
            30000,
            undefined,
            undefined,
            headers,
        );
        this.setEventServer(eventServer);
    }

    currentProviders() {
        return {
            fullNode: this.fullNode,
            solidityNode: this.solidityNode,
            eventServer: this.eventServer,
        };
    }

    currentProvider() {
        return this.currentProviders();
    }

    getEventResult(
        contractAddress: string,
        options: ContractOptions,
        callback?: undefined,
    ): Promise<any>;
    getEventResult(
        contractAddress: string,
        options: ContractOptions,
        callback: _CallbackT<any>,
    ): void;
    getEventResult(
        contractAddress: string,
        options: ContractOptions = {},
        callback?: _CallbackT<any>,
    ): void | Promise<any> {
        // getEventResult(...params) {
        // if (typeof params[1] !== 'object') {
        //     params[1] = {
        //         sinceTimestamp: params[1] || 0,
        //         eventName: params[2] || false,
        //         blockNumber: params[3] || false,
        //         size: params[4] || 20,
        //         page: params[5] || 1,
        //     };
        //     params.splice(2, 4);

        //     // callback:
        //     if (!utils.isFunction(params[2])) {
        //         if (utils.isFunction(params[1].page)) {
        //             params[2] = params[1].page;
        //             params[1].page = 1;
        //         } else if (utils.isFunction(params[1].size)) {
        //             params[2] = params[1].size;
        //             params[1].size = 20;
        //             params[1].page = 1;
        //         }
        //     }
        // }

        if (callback)
            return this.event.getEventsByContractAddress(
                contractAddress,
                options,
                callback,
            );

        return this.event.getEventsByContractAddress(
            contractAddress,
            options,
            callback,
        );
    }

    getEventByTransactionID(
        transactionID: string,
        options: {rawResponse?: boolean},
        callback?: undefined,
    ): Promise<any>;
    getEventByTransactionID(
        transactionID: string,
        options: {rawResponse?: boolean},
        callback: _CallbackT<any>,
    ): void;
    getEventByTransactionID(
        transactionID: string,
        options: {rawResponse?: boolean} = {},
        callback?: _CallbackT<any>,
    ): void | Promise<any> {
        if (callback)
            return this.event.getEventsByTransactionID(
                transactionID,
                options,
                callback,
            );

        return this.event.getEventsByTransactionID(
            transactionID,
            options,
            callback,
        );
    }

    contract(abi: IAbi[] = [], address?: string): Contract {
        return new Contract(this, abi, address);
    }

    static get address() {
        // FIXME: types are baaad
        return {
            fromHex(address) {
                if (!utils.isHex(address)) return address;

                return utils.crypto.getBase58CheckAddress(
                    utils.code.hexStr2byteArray(
                        address.replace(/^0x/, ADDRESS_PREFIX),
                    ),
                );
            },
            toHex(address) {
                if (utils.isHex(address))
                    return address.toLowerCase().replace(/^0x/, ADDRESS_PREFIX);

                return utils.code
                    .byteArray2hexStr(utils.crypto.decodeBase58Address(address))
                    .toLowerCase();
            },
            fromPrivateKey(privateKey, strict = false) {
                try {
                    return utils.crypto.pkToAddress(privateKey, strict);
                } catch {
                    return null;
                }
            },
        };
    }
    get address() {
        return TronWeb.address;
    }

    static sha3(string: string, prefix = true): string {
        return (
            (prefix ? '0x' : '') +
            keccak256(Buffer.from(string, 'utf-8')).toString().substring(2)
        );
    }
    sha3(string: string, prefix = true): string {
        return TronWeb.sha3(string, prefix);
    }

    static toHex(val: unknown): string {
        if (utils.isBoolean(val)) return TronWeb.fromDecimal(+val);

        if (utils.isBigNumber(val)) return TronWeb.fromDecimal(val);

        if (typeof val === 'object')
            return TronWeb.fromUtf8(JSON.stringify(val));

        if (utils.isString(val)) {
            if (/^(-|)0x/.test(val)) return val;

            // `val` is really a string, and below is legacy code abusing isFinite.
            // @ts-ignore
            if (!isFinite(val) || /^\s*$/.test(val))
                return TronWeb.fromUtf8(val);
        }

        const result = TronWeb.fromDecimal(val as any);
        if (result === '0xNaN')
            throw new Error(
                'The passed value is not convertible to a hex string',
            );
        else return result;
    }
    toHex(val: unknown): string {
        return TronWeb.toHex(val);
    }

    static toUtf8(hex: string): string {
        if (utils.isHex(hex)) {
            hex = hex.replace(/^0x/, '');
            return Buffer.from(hex, 'hex').toString('utf8');
        } else {
            throw new Error('The passed value is not a valid hex string');
        }
    }
    toUtf8(hex: string): string {
        return TronWeb.toUtf8(hex);
    }

    static fromUtf8(string: string): string {
        if (!utils.isString(string))
            throw new Error('The passed value is not a valid utf-8 string');

        return '0x' + Buffer.from(string, 'utf8').toString('hex');
    }
    fromUtf8(string: string): string {
        return TronWeb.fromUtf8(string);
    }

    static toAscii(hex: string): string {
        if (utils.isHex(hex)) {
            let str = '';
            // FIXME: it's very bad
            let i = hex.substring(0, 2) === '0x' ? 2 : 0;

            for (; i < hex.length; i += 2) {
                const code = parseInt(hex.substr(i, 2), 16);
                str += String.fromCharCode(code);
            }
            return str;
        } else {
            throw new Error('The passed value is not a valid hex string');
        }
    }
    toAscii(hex: string): string {
        return TronWeb.toAscii(hex);
    }

    static fromAscii(string: string, padding = 0) {
        if (!utils.isString(string))
            throw new Error('The passed value is not a valid utf-8 string');

        return (
            '0x' +
            Buffer.from(string, 'ascii').toString('hex').padEnd(padding, '0')
        );
    }
    fromAscii(string: string, padding = 0) {
        return TronWeb.fromAscii(string, padding);
    }

    static toDecimal(value: string | number | BigNumber): number {
        return TronWeb.toBigNumber(value).toNumber();
    }
    toDecimal(value: string | number | BigNumber): number {
        return TronWeb.toDecimal(value);
    }

    static fromDecimal(value: string | number | BigNumber): string {
        const number = TronWeb.toBigNumber(value);
        const result = number.toString(16);

        return number.isLessThan(0) ? '-0x' + result.substr(1) : '0x' + result;
    }
    fromDecimal(value: string | number | BigNumber): string {
        return TronWeb.fromDecimal(value);
    }

    static fromSun(sun: BigNumber): BigNumber;
    static fromSun(sun: string | number): string;
    static fromSun(sun: BigNumber | string | number): BigNumber | string {
        const trx = TronWeb.toBigNumber(sun).div(1_000_000);
        return utils.isBigNumber(sun) ? trx : trx.toString(10);
    }
    fromSun(sun: BigNumber): BigNumber;
    fromSun(sun: string | number): string;
    fromSun(sun: BigNumber | string | number): BigNumber | string {
        return TronWeb.fromSun(sun as any);
    }

    static toSun(trx: BigNumber): BigNumber;
    static toSun(trx: string | number): string;
    static toSun(trx: BigNumber | string | number): BigNumber | string {
        const sun = TronWeb.toBigNumber(trx).times(1_000_000);
        return utils.isBigNumber(trx) ? sun : sun.toString(10);
    }
    toSun(trx: BigNumber): BigNumber;
    toSun(trx: string | number): string;
    toSun(trx: BigNumber | string | number): BigNumber | string {
        return TronWeb.toSun(trx as any);
    }

    static toBigNumber(amount: string | number | BigNumber = 0): BigNumber {
        if (utils.isBigNumber(amount)) return amount;

        if (utils.isString(amount) && /^(-|)0x/.test(amount))
            return new BigNumber(amount.replace('0x', ''), 16);

        return new BigNumber(amount.toString(10), 10);
    }
    toBigNumber(amount: string | number | BigNumber = 0): BigNumber {
        return TronWeb.toBigNumber(amount);
    }

    static isAddress(address: unknown): address is string {
        if (!utils.isString(address)) return false;

        // Convert HEX to Base58
        if (address.length === 42)
            try {
                return TronWeb.isAddress(
                    utils.crypto.getBase58CheckAddress(
                        // it throws an error if the address starts with 0x
                        utils.code.hexStr2byteArray(address),
                    ),
                );
            } catch (err) {
                return false;
            }

        try {
            return utils.crypto.isAddressValid(address);
        } catch (err) {
            return false;
        }
    }
    isAddress(address: unknown): address is string {
        return TronWeb.isAddress(address);
    }

    static async createAccount() {
        return utils.accounts.generateAccount();
    }
    async createAccount() {
        return TronWeb.createAccount();
    }

    static createRandom(options = {}) {
        return utils.accounts.generateRandom(options);
    }
    createRandom(options = {}) {
        return TronWeb.createRandom(options);
    }

    static fromMnemonic(
        mnemonic: string,
        path = TRON_BIP39_PATH_INDEX_0,
        wordlist = 'en',
    ) {
        return utils.accounts.generateAccountWithMnemonic(
            mnemonic,
            path,
            wordlist,
        );
    }
    fromMnemonic(
        mnemonic: string,
        path = TRON_BIP39_PATH_INDEX_0,
        wordlist = 'en',
    ) {
        return TronWeb.fromMnemonic(mnemonic, path, wordlist);
    }

    async isConnected(callback?: undefined): Promise<any>;
    async isConnected(callback: _CallbackT<any>): Promise<void>;
    async isConnected(callback?: _CallbackT<any>): Promise<void | any> {
        if (!callback) return this.injectPromise(this.isConnected);

        return callback(null, {
            fullNode: await this.fullNode.isConnected(),
            solidityNode: await this.solidityNode.isConnected(),
            eventServer:
                this.eventServer && (await this.eventServer.isConnected()),
        });
    }
}
