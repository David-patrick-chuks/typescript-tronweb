import TronWeb from '../..';
import {WithTronwebAndInjectpromise} from '../../../src/utils/_base';
import {SmartContract_ABI_Entry_StateMutabilityType as IAbiStateMutability} from '../../proto/core/contract/smart_contract';
import utils from '../../utils';
import _CallbackT from '../../utils/typing';
import {IEvent} from '../event';
import {ContractOptions as ExtendedContractOptions} from '../transactionBuilder';
import Method from './method';

export type {IMethodSendOptions} from './method';

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
export type IAbi = IFuncAbi | IEventAbi | IErrorAbi;

export interface ContractOptions {
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

class _Contract extends WithTronwebAndInjectpromise {
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

    constructor(tronWeb: TronWeb, abi: IAbi[] = [], address?: string) {
        super(tronWeb);

        this.address = address || null;
        this.abi = abi;

        this.eventListener = null;
        this.eventCallback = null;
        this.bytecode = null;
        this.deployed = false;
        this.lastBlock = null;

        this.methods = {};
        this.methodInstances = {};
        this.props = [];

        if (this.tronWeb.isAddress(address)) this.deployed = true;
        else this.address = null;

        this.loadAbi(abi);

        return this;
    }

    async _getEvents(options: ContractOptions = {}) {
        if (!this.address)
            throw new Error('Contract is not configured with an address');
        if (options.rawResponse)
            throw new Error('Cannot parse raw response here.');

        const events = await this.tronWeb.event.getEventsByContractAddress(
            this.address,
            options as ContractOptions & {rawResponse?: false},
        );
        const [latestEvent] = events.sort((a, b) => b.block - a.block);
        const newEvents = events.filter((event, index) => {
            if (
                options.resourceNode &&
                event.resourceNode &&
                options.resourceNode.toLowerCase() !==
                    event.resourceNode.toLowerCase()
            )
                return false;

            const duplicate = events
                .slice(0, index)
                .some(
                    (priorEvent) =>
                        JSON.stringify(priorEvent) === JSON.stringify(event),
                );

            if (duplicate) return false;

            if (!this.lastBlock) return true;

            return event.block > this.lastBlock;
        });

        if (latestEvent) this.lastBlock = latestEvent.block;

        return newEvents;
    }

    async _startEventListener(
        options: ContractOptions = {},
        callback?: (event: IEvent) => void,
    ) {
        if (this.eventListener) clearInterval(this.eventListener);

        if (!this.tronWeb.eventServer)
            throw new Error('Event server is not configured');

        if (!this.address)
            throw new Error('Contract is not configured with an address');

        this.eventCallback = callback;
        await this._getEvents(options);

        this.eventListener = setInterval(() => {
            this._getEvents(options)
                .then((newEvents) =>
                    newEvents.forEach((event) => {
                        this.eventCallback && this.eventCallback(event);
                    }),
                )
                .catch((err) => {
                    console.error('Failed to get event list', err);
                });
        }, 3000);
    }

    _stopEventListener() {
        if (!this.eventListener) return;

        clearInterval(this.eventListener);
        this.eventListener = null;
        this.eventCallback = null;
    }

    hasProperty(property: string): boolean {
        return (
            Object.prototype.hasOwnProperty.call(this, property) ||
            // TODO: just remove this, it's very old stuff
            (this as any).__proto__.hasOwnProperty(property) // eslint-disable-line
        );
    }

    loadAbi(abi: IAbi[]) {
        this.abi = abi;
        this.methods = {};

        this.props.forEach((prop) => delete this[prop]);

        abi.forEach((func) => {
            // Don't build a method for constructor function.
            // That's handled through contract create.
            if (
                !func.type ||
                /constructor/i.test(func.type) ||
                func.type === 'event' ||
                func.type === 'error'
            )
                return;

            const method = new Method(this as unknown as Contract, func);
            const methodCall = method.onMethod.bind(method);

            const {name, functionSelector, signature} = method;

            this.methods[name] = methodCall;
            this.methods[functionSelector] = methodCall;
            this.methods[signature] = methodCall;

            this.methodInstances[name] = method;
            this.methodInstances[functionSelector] = method;
            this.methodInstances[signature] = method;

            if (!this.hasProperty(name)) {
                this[name] = methodCall;
                this.props.push(name);
            }

            if (!this.hasProperty(functionSelector)) {
                this[functionSelector] = methodCall;
                this.props.push(functionSelector);
            }

            if (!this.hasProperty(signature)) {
                this[signature] = methodCall;
                this.props.push(signature);
            }
        });
    }

    decodeInput(data: string) {
        const methodName = data.substring(0, 8);
        const inputData = data.substring(8);

        if (!this.methodInstances[methodName])
            throw new Error('Contract method ' + methodName + ' not found');

        const methodInstance = this.methodInstances[methodName];

        return {
            name: methodInstance.name,
            params: this.methodInstances[methodName].decodeInput(inputData),
        };
    }

    async new(
        options: ExtendedContractOptions,
        privateKey: string,
        callback?: unknown,
    ): Promise<this>;
    async new(
        options: ExtendedContractOptions,
        privateKey: string,
        callback: _CallbackT<this>,
    ): Promise<void>;
    async new(
        options: ExtendedContractOptions,
        privateKey: string = this.tronWeb.defaultPrivateKey,
        callback?: _CallbackT<this>,
    ): Promise<void | this> {
        if (!callback) return this.injectPromise(this.new, options, privateKey);

        try {
            const address = this.tronWeb.address.fromPrivateKey(privateKey);
            if (!address) return callback('Invalid privateKey provided!');

            const transaction =
                await this.tronWeb.transactionBuilder.createSmartContract(
                    options,
                    address,
                );
            const signedTransaction = await this.tronWeb.trx.sign(
                transaction,
                privateKey,
            );
            const contract = await this.tronWeb.trx.sendRawTransaction(
                signedTransaction,
            );

            if (contract.code)
                return callback({
                    error: contract.code,
                    message: this.tronWeb.toUtf8(contract.message),
                });

            await utils.sleep(3000);
            return this.at(signedTransaction.contract_address, callback);
        } catch (ex) {
            return callback(ex);
        }
    }

    async at(contractAddress: string, callback?: unknown): Promise<this>;
    async at(
        contractAddress: string,
        callback: _CallbackT<this>,
    ): Promise<void>;
    async at(
        contractAddress: string,
        callback?: _CallbackT<this>,
    ): Promise<void | this> {
        if (!callback) return this.injectPromise(this.at, contractAddress);

        try {
            const contract = await this.tronWeb.trx.getContract(
                contractAddress,
            );

            if (!contract.contract_address)
                return callback(
                    'Unknown error: ' + JSON.stringify(contract, null, 2),
                );

            this.address = contract.contract_address;
            this.bytecode = contract.bytecode;
            this.deployed = true;

            this.loadAbi(
                contract.abi?.entrys ? (contract.abi.entrys as IAbi[]) : [],
            );

            return callback(null, this);
        } catch (ex) {
            if (ex?.toString && ex.toString().includes('does not exist'))
                return callback(
                    'Contract has not been deployed on the network',
                );

            return callback(ex);
        }
    }

    events(options: ContractOptions = {}, callback: _CallbackT<any>) {
        if (!utils.isFunction(callback))
            throw new Error('Callback function expected');

        const self = this;

        return {
            start(startCallback: (err?: unknown) => unknown) {
                if (!startCallback) {
                    self._startEventListener(options, callback);
                    return this;
                }

                self._startEventListener(options, callback)
                    .then(() => {
                        startCallback();
                    })
                    .catch((err) => {
                        startCallback(err);
                    });

                return this;
            },
            stop() {
                self._stopEventListener();
            },
        };
    }
}

// Hack
// Pretend like we export class that has additional method-based properties
type MethodCallT = Method['onMethod'];
type ContractT = _Contract & {[key: string]: MethodCallT};
const _ContractI: {
    new (tronWeb: TronWeb, abi: IAbi[], address?: string): ContractT;
} = _Contract as any;

export default class Contract extends _ContractI {}
// export default Contract;
