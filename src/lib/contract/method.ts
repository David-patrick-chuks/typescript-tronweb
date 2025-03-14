import Contract from '.';
import type {IAbiItem, IFuncAbi} from '.';
import type {ContractEventOptions} from '.';
import utils from '../../utils';
import {WithTronwebAndInjectpromise} from '../../utils/_base';
import {decodeParamsV2ByABI, encodeParamsV2ByABI} from '../../utils/abi';
import type _CallbackT from '../../utils/typing';
import type {
    ContractOptions,
    ITriggerConstantContract,
    ITriggerContractOptions,
} from '../transactionBuilder';
import type {ITransactionInfo} from '../trx';

export interface IMethodSendOptions extends Partial<ContractOptions> {
    from?: string;
    shouldPollResponse?: boolean;
    maxRetries?: number; // Default: 20
    pollingInterval?: number; // Default: 3000 [ms]
    rawResponse?: boolean;
    keepTxID?: boolean;
}

const MISSING_ADDRESS_MSG = 'Smart contract is missing address';

const getFunctionSelector = (abi) => {
    abi.stateMutability = abi.stateMutability
        ? abi.stateMutability.toLowerCase()
        : 'nonpayable';
    abi.type = abi.type ? abi.type.toLowerCase() : '';
    if (abi.type === 'fallback' || abi.type === 'receive') return '0x';
    const iface = new utils.ethersUtils.Interface([abi]);
    if (abi.type === 'event')
        return iface
            .getEvent(abi.name)
            .format(utils.ethersUtils.FormatTypes.sighash);

    return iface
        .getFunction(abi.name)
        .format(utils.ethersUtils.FormatTypes.sighash);
};

const decodeOutput = (abi, output) => {
    return decodeParamsV2ByABI(abi, output);
};

export interface IOnMethod {
    call(options?: ITriggerContractOptions, callback?: undefined): Promise<any>;
    call(
        options: ITriggerContractOptions | undefined,
        callback: _CallbackT<any>,
    ): Promise<void>;

    send(
        options: IMethodSendOptions & {shouldPollResponse: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    send(
        options: IMethodSendOptions & {shouldPollResponse: false},
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    send(
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    send(
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    send(
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, any]>;
    send(
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, any]>,
    ): Promise<void>;

    send(
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: false;
            keepTxID: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<any>;
    send(
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: false;
            keepTxID: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<any>,
    ): Promise<void>;

    send(
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<any>,
    ): Promise<any>;

    watch(
        options: ContractEventOptions,
        callback: _CallbackT<any>,
    ): Promise<{
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

    constructor(contract: Contract, abi: IFuncAbi) {
        super(contract.tronWeb);

        this.contract = contract;

        this.abi = abi;
        this.name = abi.name || (abi.name = abi.type);

        this.inputs = abi.inputs || [];
        this.outputs = abi.outputs || [];

        this.functionSelector = getFunctionSelector(abi);
        this.signature = this.tronWeb
            .sha3(this.functionSelector, false)
            .slice(0, 8);

        this.defaultOptions = {
            feeLimit: this.tronWeb.feeLimit,
            callValue: 0,
            userFeePercentage: 100,
            shouldPollResponse: false,
        };
    }

    decodeInput(data) {
        return decodeOutput(this.inputs, '0x' + data);
    }

    onMethod(...args) {
        let rawParameter = '';
        if (this.abi && !/event/i.test(this.abi.type))
            rawParameter = encodeParamsV2ByABI(this.abi, args);

        return {
            call: (
                options: ITriggerContractOptions = {},
                callback?: _CallbackT<any>,
            ) => {
                options = {
                    ...options,
                    rawParameter,
                };

                return this._call([], [], options, callback);
            },

            send: (
                options: Partial<ContractOptions> & IMethodSendOptions = {},
                privateKey: string = this.tronWeb.defaultPrivateKey,
                callback?: _CallbackT<any>,
            ) => {
                options = {
                    ...options,
                    rawParameter,
                };

                return this._send([], [], options, privateKey, callback);
            },
            watch: (this['_watch'] = this._watch.bind(this)),
        } as IOnMethod;
    }

    async _call(
        types: string[],
        args: unknown[],
        options: ITriggerContractOptions = {},
        callback?: _CallbackT<any>,
    ) {
        if (!callback)
            return this.injectPromise(this._call, types, args, options);

        if (types.length !== args.length)
            return callback('Invalid argument count provided');

        if (!this.contract.address) return callback(MISSING_ADDRESS_MSG);

        if (!this.contract.deployed)
            return callback(
                'Calling smart contracts requires you to load the contract first',
            );

        const {stateMutability} = this.abi;

        if (!['pure', 'view'].includes(stateMutability.toLowerCase()))
            return callback(
                `Methods with state mutability "${stateMutability}" must use send()`,
            );

        const final_options: ContractOptions & {
            _isConstant: boolean;
            from: string;
        } = {
            ...this.defaultOptions,
            from: this.tronWeb.defaultAddress.hex,
            ...options,
            _isConstant: true,
        } as any;

        const parameters = args.map((value, index) => ({
            type: types[index],
            value,
        }));

        // Changed by me, was triggerSmartContract
        this.tronWeb.transactionBuilder.triggerConstantContract(
            this.contract.address,
            this.functionSelector,
            final_options,
            parameters,
            final_options.from
                ? this.tronWeb.address.toHex(final_options.from)
                : undefined,
            (err: unknown, transaction?: ITriggerConstantContract): void => {
                if (err) return callback(err);

                if (
                    !transaction ||
                    !utils.hasProperty(transaction, 'constant_result')
                )
                    return callback('Failed to execute');

                try {
                    const len = transaction.constant_result[0].length;
                    if (len === 0 || len % 64 === 8) {
                        let msg =
                            'The call has been reverted or has thrown an error.';
                        if (len !== 0) {
                            msg += ' Error message: ';
                            let msg2 = '';
                            const chunk =
                                transaction.constant_result[0].substring(8);
                            for (let i = 0; i < len - 8; i += 64)
                                msg2 += this.tronWeb.toUtf8(
                                    chunk.substring(i, i + 64),
                                );

                            msg += msg2
                                // eslint-disable-next-line no-control-regex
                                .replace(/(\u0000|\u000b|\f)+/g, ' ')
                                .replace(/ +/g, ' ')
                                .replace(/\s+$/g, '');
                        }
                        return callback(msg);
                    }

                    let output = decodeOutput(
                        this.abi,
                        '0x' + transaction.constant_result[0],
                    );

                    if (output.length === 1 && Object.keys(output).length === 1)
                        output = output[0];

                    return callback(null, output);
                } catch (ex) {
                    return callback(ex);
                }
            },
        );
    }

    async _send(
        types: string[],
        args: unknown[],
        options: IMethodSendOptions = {},
        privateKey: string = this.tronWeb.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ) {
        if (!callback)
            return this.injectPromise(
                this._send,
                types,
                args,
                options,
                privateKey,
            );

        if (types.length !== args.length)
            throw new Error('Invalid argument count provided');

        if (!this.contract.address) return callback(MISSING_ADDRESS_MSG);

        if (!this.contract.deployed)
            return callback(
                'Calling smart contracts requires you to load the contract first',
            );

        const {stateMutability} = this.abi;

        if (['pure', 'view'].includes(stateMutability.toLowerCase()))
            return callback(
                `Methods with state mutability "${stateMutability}" must use call()`,
            );

        // If a function isn't payable, dont provide a callValue.
        if (!['payable'].includes(stateMutability.toLowerCase()))
            options.callValue = 0;

        // TODO: this intersection may be not needed after final options cleanup
        const final_options: ContractOptions & IMethodSendOptions = {
            ...this.defaultOptions,
            from: this.tronWeb.defaultAddress.hex,
            ...options,
        } as any;

        const parameters = args.map((value, index) => ({
            type: types[index],
            value,
        }));

        try {
            const address = privateKey
                ? this.tronWeb.address.fromPrivateKey(privateKey)
                : this.tronWeb.defaultAddress.base58;
            const transaction =
                await this.tronWeb.transactionBuilder.triggerSmartContract(
                    this.contract.address,
                    this.functionSelector,
                    final_options,
                    parameters,
                    this.tronWeb.address.toHex(address),
                );

            if (!transaction.result || !transaction.result.result)
                return callback(
                    'Unknown error: ' + JSON.stringify(transaction, null, 2),
                );

            // If privateKey is false, this won't be signed here.
            // We assume sign functionality will be replaced.
            const signedTransaction = await this.tronWeb.trx.sign(
                transaction.transaction,
                privateKey,
            );

            if (!signedTransaction.signature) {
                if (!privateKey)
                    return callback('Transaction was not signed properly');

                return callback('Invalid private key provided');
            }

            const broadcast = await this.tronWeb.trx.sendRawTransaction(
                signedTransaction,
            );

            if (broadcast.code) {
                const err = {
                    error: broadcast.code,
                    message: broadcast.code,
                };
                if (broadcast.message)
                    err.message = this.tronWeb.toUtf8(broadcast.message);
                return callback(err);
            }

            if (!final_options.shouldPollResponse)
                return callback(null, signedTransaction.txID);

            const {maxRetries = 20, pollingInterval = 3_000} = options;

            const checkResult = async (index = 0) => {
                if (index === maxRetries - 1)
                    return callback({
                        error: 'Cannot find result in solidity node',
                        transaction: signedTransaction,
                    });

                const output = await this.tronWeb.trx.getTransactionInfo(
                    signedTransaction.txID,
                );

                if (!Object.keys(output).length)
                    return setTimeout(() => {
                        checkResult(index + 1);
                    }, pollingInterval);

                if ('result' in output && output.result === 'FAILED')
                    return callback({
                        error: this.tronWeb.toUtf8(output.resMessage!),
                        transaction: signedTransaction,
                        output,
                    });

                if (!utils.hasProperty(output, 'contractResult'))
                    return callback({
                        error:
                            'Failed to execute: ' +
                            JSON.stringify(output, null, 2),
                        transaction: signedTransaction,
                        output,
                    });

                if (final_options.rawResponse) return callback(null, output);

                let decoded = decodeOutput(
                    this.abi,
                    '0x' + output.contractResult[0],
                );

                if (decoded.length === 1 && Object.keys(decoded).length === 1)
                    decoded = decoded[0];

                if (final_options.keepTxID)
                    return callback(null, [signedTransaction.txID, decoded]);

                return callback(null, decoded);
            };

            checkResult();
        } catch (ex) {
            return callback(ex);
        }
    }

    async _watch(
        options: Partial<ContractEventOptions> = {},
        callback: _CallbackT<any>,
    ) {
        if (!utils.isFunction(callback))
            throw new Error('Expected callback to be provided');

        if (!this.contract.address) return callback(MISSING_ADDRESS_MSG);

        if (!this.abi.type || !/event/i.test(this.abi.type))
            return callback('Invalid method type for event watching');

        if (!this.tronWeb.eventServer)
            return callback('No event server configured');

        let listener: NodeJS.Timer | null = null;
        let lastBlock: number | null = null;
        const since = Date.now() - 1000;

        const getEvents = async () => {
            if (!this.contract.address) throw new Error(MISSING_ADDRESS_MSG);

            try {
                const params = {
                    since,
                    eventName: this.name,
                    sort: 'block_timestamp',
                    blockNumber: 'latest',
                    filters: options.filters,
                } as Record<string, unknown>;

                if (options.size) params.size = options.size;

                if (options.resourceNode)
                    if (/full/i.test(options.resourceNode))
                        params.onlyUnconfirmed = true;
                    else params.onlyConfirmed = true;

                const events =
                    await this.tronWeb.event.getEventsByContractAddress(
                        this.contract.address,
                        params,
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
                                JSON.stringify(priorEvent) ===
                                JSON.stringify(event),
                        );

                    if (duplicate) return false;

                    if (!lastBlock) return true;

                    return event.block > lastBlock;
                });

                if (latestEvent) lastBlock = latestEvent.block;

                return newEvents;
            } catch (ex) {
                return Promise.reject(ex);
            }
        };

        const bindListener = () => {
            if (listener) clearInterval(listener);

            listener = setInterval(() => {
                getEvents()
                    .then((events) =>
                        events.forEach((event) => {
                            callback(null, utils.parseEvent(event, this.abi));
                        }),
                    )
                    .catch((err) => callback(err));
            }, 3000);
        };

        await getEvents();
        bindListener();

        return {
            start: bindListener,
            stop: () => {
                if (!listener) return;

                clearInterval(listener);
                listener = null;
            },
        };
    }
}
