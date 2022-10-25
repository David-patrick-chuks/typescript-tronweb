import TronWeb from '..';
import utils from '../utils';
import { AbiCoder } from '../utils/ethersUtils';
import Validator from '../paramValidator';
import { ADDRESS_PREFIX_REGEX } from '../utils/address';
import injectpromise from 'injectpromise';
import { encodeParamsV2ByABI } from '../utils/abi';
import { ResourceT } from './trx';

type _CallbackT<Out> = ((err: unknown) => Out) &
    ((err: null, data: any) => Out);

const INVALID_RESOURCE_MESSAGE =
    'Invalid resource provided: Expected "BANDWIDTH" or "ENERGY';
let self;

export interface ITransaction {
    visible?: boolean;
    ret?: {
        contractRet: 'SUCCESS';
    }[];
    signature?: string[];
    raw_data: {
        // FIXME: types
        data?: unknown;
        contract: any[];
        expiration: number;
        timestamp: number;
        fee_limit: number;
        ref_block_bytes: string;
        ref_block_hash: string;
    };
    txID: string;
    raw_data_hex: string;
}
interface _LooseObject {
    [key: string]: any;
}
export interface IProposalParameter {
    // FIXME: sure?
    key: number;
    value: number;
}
export interface BaseOptions {
    feeLimit?: number;
    userFeePercentage?: number;
    originEnergyLimit?: number;
    callValue?: any;
    tokenValue?: number;
    tokenId?: number;
    token_id?: number;
    funcABIV2?: any;
    parametersV2?: any;
    permissionId?: number;
}
export type ContractOptions = {
    abi: string | { entrys: any[] };
    bytecode: string;
    parameters?: any[] | string;
    name: string;
    rawParameter?: string;
    shieldedParameter?: string;
    confirmed?: boolean;
} & BaseOptions;

export interface IUpdateTokenOptions {
    description: string;
    url: string;
    // The creator's "donated" bandwidth for use by token holders
    freeBandwidth?: number;
    // Out of `totalFreeBandwidth`, the amount each token holder get
    freeBandwidthLimit?: number;
}
export interface ICreateTokenOptions extends IUpdateTokenOptions {
    name: string;
    abbreviation: string;
    totalSupply: number;
    voteScore: number;
    precision: number;

    // Timestamps
    saleStart?: number;
    saleEnd: number;

    // How much TRX will `tokenRatio` cost?
    trxRatio?: number;
    // How many tokens will `trxRatio` afford?
    tokenRatio?: number;
    frozenAmount?: number;
    frozenDuration?: number;
    // for now there is no default for the following values
}
interface IPermissionId {
    permissionId?: number;
}
type IResources = any;
interface IPermissions {
    type: number;
    permission_name: string;
    threshold: number;
    keys: {
        address: string;
        weight: number;
    }[];
    operations: any;
}
//helpers

function toHex(value: string): string {
    return TronWeb.address.toHex(value);
}

function fromUtf8(value: string): string {
    return self.tronWeb.fromUtf8(value);
}

function resultManager(transaction, callback) {
    if (transaction.Error) return callback(transaction.Error);

    if (transaction.result && transaction.result.message)
        return callback(self.tronWeb.toUtf8(transaction.result.message));

    return callback(null, transaction);
}

export default class TransactionBuilder {
    tronWeb: TronWeb;
    injectPromise: injectpromise;
    validator: Validator;

    constructor(tronWeb: TronWeb) {
        if (!tronWeb || !(tronWeb instanceof TronWeb))
            throw new Error('Expected instance of TronWeb');
        self = this;
        this.tronWeb = tronWeb;
        this.injectPromise = injectpromise(this);
        this.validator = new Validator(tronWeb);
    }

    sendTrx(
        to: string,
        amount: string | number,
        from: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    sendTrx(
        to: string,
        amount: string | number,
        from: string,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void;
    sendTrx(
        to: string,
        amount: string | number = 0,
        from: string = this.tronWeb.defaultAddress.hex,
        options: IPermissionId = {},
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(from)) {
        //     callback = from;
        //     from = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(from)) {
        //     options = from;
        //     from = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback)
            return this.injectPromise(this.sendTrx, to, amount, from, options);

        // accept amounts passed as strings
        amount = parseInt(amount.toString());

        if (
            this.validator.notValid(
                [
                    {
                        name: 'recipient',
                        type: 'address',
                        value: to,
                    },
                    {
                        name: 'origin',
                        type: 'address',
                        value: from,
                    },
                    {
                        names: ['recipient', 'origin'],
                        type: 'notEqual',
                        msg: 'Cannot transfer TRX to the same account',
                    },
                    {
                        name: 'amount',
                        type: 'integer',
                        gt: 0,
                        value: amount,
                    },
                ],
                callback,
            )
        )
            return;

        const data: _LooseObject = {
            to_address: toHex(to),
            owner_address: toHex(from),
            amount: amount,
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/createtransaction', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    sendToken(
        to: string,
        amount: number | string,
        tokenID: string,
        from: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    sendToken(
        to: string,
        amount: number | string,
        tokenID: string,
        from: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    sendToken(
        to: string,
        amount: number | string = 0,
        tokenID: string,
        from: string = this.tronWeb.defaultAddress.hex,
        options: IPermissionId = {},
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(from)) {
        //     callback = from;
        //     from = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(from)) {
        //     options = from;
        //     from = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.sendToken,
                to,
                amount,
                tokenID,
                from,
                options,
            );
        }

        amount = parseInt(amount.toString());
        if (
            this.validator.notValid(
                [
                    {
                        name: 'recipient',
                        type: 'address',
                        value: to,
                    },
                    {
                        name: 'origin',
                        type: 'address',
                        value: from,
                    },
                    {
                        names: ['recipient', 'origin'],
                        type: 'notEqual',
                        msg: 'Cannot transfer tokens to the same account',
                    },
                    {
                        name: 'amount',
                        type: 'integer',
                        gt: 0,
                        value: amount,
                    },
                    {
                        name: 'token ID',
                        type: 'tokenId',
                        value: tokenID,
                    },
                ],
                callback,
            )
        )
            return;

        const data: _LooseObject = {
            to_address: toHex(to),
            owner_address: toHex(from),
            asset_name: fromUtf8(tokenID),
            amount: parseInt(amount.toString()),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/transferasset', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    purchaseToken(
        issuerAddress: string,
        tokenID: string,
        amount: number,
        buyer: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    purchaseToken(
        issuerAddress: string,
        tokenID: string,
        amount: number,
        buyer: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    purchaseToken(
        issuerAddress: string,
        tokenID: string,
        amount: number | string = 0,
        buyer: string = this.tronWeb.defaultAddress.hex,
        options: IPermissionId = {},
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(buyer)) {
        //     callback = buyer;
        //     buyer = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(buyer)) {
        //     options = buyer;
        //     buyer = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.purchaseToken,
                issuerAddress,
                tokenID,
                amount,
                buyer,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'buyer',
                        type: 'address',
                        value: buyer,
                    },
                    {
                        name: 'issuer',
                        type: 'address',
                        value: issuerAddress,
                    },
                    {
                        names: ['buyer', 'issuer'],
                        type: 'notEqual',
                        msg: 'Cannot purchase tokens from same account',
                    },
                    {
                        name: 'amount',
                        type: 'integer',
                        gt: 0,
                        value: amount,
                    },
                    {
                        name: 'token ID',
                        type: 'tokenId',
                        value: tokenID,
                    },
                ],
                callback,
            )
        )
            return;

        const data: _LooseObject = {
            to_address: toHex(issuerAddress),
            owner_address: toHex(buyer),
            asset_name: fromUtf8(tokenID),
            amount: parseInt(amount.toString()),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/participateassetissue', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    freezeBalance(
        amount: number,
        duration: number,
        resource: ResourceT,
        address: string,
        receiverAddress?: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    freezeBalance(
        amount: number,
        duration: number,
        resource: ResourceT,
        address: string,
        receiverAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    freezeBalance(
        amount = 0,
        duration = 3,
        resource: ResourceT = 'BANDWIDTH',
        address: string = this.tronWeb.defaultAddress.hex,
        receiverAddress?: string,
        options: IPermissionId = {},
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(receiverAddress)) {
        //     callback = receiverAddress;
        //     receiverAddress = undefined;
        // } else if (utils.isObject(receiverAddress)) {
        //     options = receiverAddress;
        //     receiverAddress = undefined;
        // }

        // if (utils.isFunction(address)) {
        //     callback = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(address)) {
        //     options = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // }

        // if (utils.isFunction(duration)) {
        //     callback = duration;
        //     duration = 3;
        // }

        // if (utils.isFunction(resource)) {
        //     callback = resource;
        //     resource = 'BANDWIDTH';
        // }

        if (!callback) {
            return this.injectPromise(
                this.freezeBalance,
                amount,
                duration,
                resource,
                address,
                receiverAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'origin',
                        type: 'address',
                        value: address,
                    },
                    {
                        name: 'receiver',
                        type: 'address',
                        value: receiverAddress,
                        optional: true,
                    },
                    {
                        name: 'amount',
                        type: 'integer',
                        gt: 0,
                        value: amount,
                    },
                    {
                        name: 'duration',
                        type: 'integer',
                        gte: 3,
                        value: duration,
                    },
                    {
                        name: 'resource',
                        type: 'resource',
                        value: resource,
                        msg: INVALID_RESOURCE_MESSAGE,
                    },
                ],
                callback,
            )
        )
            return;

        const data: _LooseObject = {
            owner_address: toHex(address),
            frozen_balance: parseInt(amount.toString()),
            frozen_duration: parseInt(duration.toString()),
            resource: resource,
        };

        if (
            receiverAddress != null &&
            toHex(receiverAddress) !== toHex(address)
        )
            data.receiver_address = toHex(receiverAddress);

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/freezebalance', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    unfreezeBalance(
        resource: ResourceT,
        address: string,
        receiverAddress: string | undefined,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    unfreezeBalance(
        resource: ResourceT,
        address: string,
        receiverAddress: string | undefined,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    unfreezeBalance(
        resource: ResourceT = 'BANDWIDTH',
        address: string = this.tronWeb.defaultAddress.hex,
        receiverAddress: string | undefined,
        options: IPermissionId = {},
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(receiverAddress)) {
        //     callback = receiverAddress;
        //     receiverAddress = undefined;
        // } else if (utils.isObject(receiverAddress)) {
        //     options = receiverAddress;
        //     receiverAddress = undefined;
        // }

        // if (utils.isFunction(address)) {
        //     callback = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(address)) {
        //     options = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // }

        // if (utils.isFunction(resource)) {
        //     callback = resource;
        //     resource = 'BANDWIDTH';
        // }

        if (!callback) {
            return this.injectPromise(
                this.unfreezeBalance,
                resource,
                address,
                receiverAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'origin',
                        type: 'address',
                        value: address,
                    },
                    {
                        name: 'receiver',
                        type: 'address',
                        value: receiverAddress,
                        optional: true,
                    },
                    {
                        name: 'resource',
                        type: 'resource',
                        value: resource,
                        msg: INVALID_RESOURCE_MESSAGE,
                    },
                ],
                callback,
            )
        )
            return;

        const data: _LooseObject = {
            owner_address: toHex(address),
            resource: resource,
        };

        if (
            receiverAddress != null &&
            toHex(receiverAddress) !== toHex(address)
        )
            data.receiver_address = toHex(receiverAddress);

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/unfreezebalance', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    withdrawBlockRewards(
        address: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    withdrawBlockRewards(
        address: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    withdrawBlockRewards(
        address: string = this.tronWeb.defaultAddress.hex,
        options: IPermissionId = {},
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(address)) {
        //     callback = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(address)) {
        //     options = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.withdrawBlockRewards,
                address,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'origin',
                        type: 'address',
                        value: address,
                    },
                ],
                callback,
            )
        )
            return;

        const data: _LooseObject = {
            owner_address: toHex(address),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/withdrawbalance', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    applyForSR(
        address: string,
        url: string,
        options?: IPermissionId,
        callback?: undefined,
    ): void | Promise<ITransaction>;
    applyForSR(
        address: string,
        url: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    applyForSR(
        address: string = this.tronWeb.defaultAddress.hex,
        url: string,
        options: IPermissionId = {},
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
        // if (utils.isObject(url) && utils.isValidURL(address)) {
        //     options = url;
        //     url = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback)
            return this.injectPromise(this.applyForSR, address, url, options);

        if (
            this.validator.notValid(
                [
                    {
                        name: 'origin',
                        type: 'address',
                        value: address,
                    },
                    {
                        name: 'url',
                        type: 'url',
                        value: url,
                        msg: 'Invalid url provided',
                    },
                ],
                callback,
            )
        )
            return;

        const data: _LooseObject = {
            owner_address: toHex(address),
            url: fromUtf8(url),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/createwitness', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    vote(
        votes: { [key: string]: number },
        voterAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    vote(
        votes: { [key: string]: number },
        voterAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    vote(
        votes: { [key: string]: number } = {},
        voterAddress: string = this.tronWeb.defaultAddress.hex,
        options: IPermissionId = {},
        callback?: _CallbackT<any>,
    ) {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(voterAddress)) {
        //     callback = voterAddress;
        //     voterAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(voterAddress)) {
        //     options = voterAddress;
        //     voterAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback)
            return this.injectPromise(this.vote, votes, voterAddress, options);

        if (
            this.validator.notValid(
                [
                    {
                        name: 'voter',
                        type: 'address',
                        value: voterAddress,
                    },
                    {
                        name: 'votes',
                        type: 'notEmptyObject',
                        value: votes,
                    },
                ],
                callback,
            )
        )
            return;

        let invalid = false;
        const votesArr = Object.entries(votes).map(([srAddress, voteCount]) => {
            if (invalid) return;

            if (
                this.validator.notValid([
                    {
                        name: 'SR',
                        type: 'address',
                        value: srAddress,
                    },
                    {
                        name: 'vote count',
                        type: 'integer',
                        gt: 0,
                        value: voteCount,
                        msg: 'Invalid vote count provided for SR: ' + srAddress,
                    },
                ])
            )
                return (invalid = true);

            return {
                vote_address: toHex(srAddress),
                vote_count: parseInt(voteCount.toString()),
            };
        }) as { vote_address: string; vote_count: number }[];
        // Casting, because we'll return immediately otherwise
        // It doesn't affect typechecking anyway

        if (invalid) return;

        const data: _LooseObject = {
            owner_address: toHex(voterAddress),
            votes: votesArr,
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/votewitnessaccount', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    createSmartContract(
        options: ContractOptions,
        issuerAddress: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    createSmartContract(
        options: ContractOptions,
        issuerAddress: string,
        callback?: _CallbackT<any>,
    ): void;
    createSmartContract(
        options: ContractOptions,
        issuerAddress: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(issuerAddress)) {
        //     callback = issuerAddress;
        //     issuerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.createSmartContract,
                options,
                issuerAddress,
            );
        }

        const feeLimit = options.feeLimit || this.tronWeb.feeLimit;
        let userFeePercentage = options.userFeePercentage;
        if (typeof userFeePercentage !== 'number' && !userFeePercentage)
            userFeePercentage = 100;

        const originEnergyLimit = options.originEnergyLimit || 10_000_000;
        const callValue = options.callValue || 0;
        const tokenValue = options.tokenValue;
        const tokenId = options.tokenId || options.token_id;

        /* eslint-disable prefer-const */
        let {
            abi = '',
            bytecode = false,
            parameters = [],
            name = '',
        } = options;
        /* eslint-enable prefer-const */

        if (abi && utils.isString(abi)) {
            try {
                abi = JSON.parse(abi);
            } catch {
                return callback('Invalid options.abi provided');
            }
        }
        if (utils.isString(abi)) throw new Error('Impossible!');

        const abi_arr = abi.entrys;

        if (!utils.isArray(abi_arr))
            return callback('Invalid options.abi provided');

        const payable = abi_arr.some((func) => {
            return (
                func.type === 'constructor' &&
                'payable' === func.stateMutability.toLowerCase()
            );
        });

        if (
            this.validator.notValid(
                [
                    {
                        name: 'bytecode',
                        type: 'hex',
                        value: bytecode,
                    },
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gt: 0,
                    },
                    {
                        name: 'callValue',
                        type: 'integer',
                        value: callValue,
                        gte: 0,
                    },
                    {
                        name: 'userFeePercentage',
                        type: 'integer',
                        value: userFeePercentage,
                        gte: 0,
                        lte: 100,
                    },
                    {
                        name: 'originEnergyLimit',
                        type: 'integer',
                        value: originEnergyLimit,
                        gte: 0,
                        lte: 10_000_000,
                    },
                    {
                        name: 'parameters',
                        type: 'array',
                        value: parameters,
                    },
                    {
                        name: 'issuer',
                        type: 'address',
                        value: issuerAddress,
                    },
                    {
                        name: 'tokenValue',
                        type: 'integer',
                        value: tokenValue,
                        gte: 0,
                        optional: true,
                    },
                    {
                        name: 'tokenId',
                        type: 'integer',
                        value: tokenId,
                        gte: 0,
                        optional: true,
                    },
                ],
                callback,
            )
        )
            return;

        if (payable && callValue === 0 && tokenValue === 0) {
            return callback(
                'When contract is payable, options.callValue or options.tokenValue' +
                    ' must be a positive integer',
            );
        }

        if (!payable && (callValue > 0 || (tokenValue && tokenValue > 0))) {
            return callback(
                'When contract is not payable, options.callValue' +
                    ' and options.tokenValue must be 0',
            );
        }

        if (options.rawParameter && utils.isString(options.rawParameter)) {
            parameters = options.rawParameter.replace(/^(0x)/, '');
        } else if (options.funcABIV2) {
            parameters = encodeParamsV2ByABI(
                options.funcABIV2,
                options.parametersV2,
            ).replace(/^(0x)/, '');
        } else {
            const constructorParams = abi_arr.find((it) => {
                return it.type === 'constructor';
            });

            if (typeof constructorParams !== 'undefined' && constructorParams) {
                const abiCoder = new AbiCoder();
                const types: string[] = [];
                const values: unknown[] = [];
                const constructorParams2: { type?: string }[] =
                    constructorParams.inputs;

                if (parameters.length !== constructorParams2.length) {
                    return callback(
                        `constructor needs ${constructorParams2.length}` +
                            ` but ${parameters.length} provided`,
                    );
                }

                for (let i = 0; i < parameters.length; i++) {
                    let type = constructorParams2[i].type;
                    let value = parameters[i];

                    if (!type || !utils.isString(type) || !type.length) {
                        return callback(
                            'Invalid parameter type provided: ' + type,
                        );
                    }

                    if (type === 'address') {
                        value = toHex(value).replace(
                            ADDRESS_PREFIX_REGEX,
                            '0x',
                        );
                    } else if (
                        type.match(/^([^\x5b]*)(\x5b|$)/)![0] === 'address['
                    ) {
                        value = value.map((v) =>
                            toHex(v).replace(ADDRESS_PREFIX_REGEX, '0x'),
                        );
                    } else if (/trcToken/.test(type)) {
                        type = type.replace(/trcToken/, 'uint256');
                    }

                    types.push(type);
                    values.push(value);
                }

                try {
                    parameters = abiCoder
                        .encode(types, values)
                        .replace(/^(0x)/, '');
                } catch (ex) {
                    return callback(ex);
                }
            } else {
                parameters = '';
            }
        }

        const args = {
            owner_address: toHex(issuerAddress),
            fee_limit: parseInt(feeLimit.toString()),
            call_value: parseInt(callValue),
            consume_user_resource_percent: userFeePercentage,
            origin_energy_limit: originEnergyLimit,
            abi: JSON.stringify(abi_arr),
            bytecode,
            parameter: parameters,
            name,
        } as Record<string, unknown>;

        // tokenValue and tokenId can cause errors if provided
        // when the trx10 proposal has not been approved yet.
        // So we set them only if they are passed to the method.
        if (tokenValue != null)
            args.call_token_value = parseInt(tokenValue.toString());
        if (tokenId != null) args.token_id = parseInt(tokenId.toString());
        if (options && options.permissionId)
            args.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/deploycontract', args, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    triggerSmartContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback?: undefined,
    ): Promise<{ transaction: ITransaction; result: { result: boolean } }>;
    triggerSmartContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback: _CallbackT<any>,
    ): void;
    triggerSmartContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback?: _CallbackT<any>,
    ): void | Promise<{
        transaction: ITransaction;
        result: { result: boolean };
    }>;
    triggerSmartContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[] = [],
        issuerAddress: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<{
        transaction: ITransaction;
        result: { result: boolean };
    }> {
        // triggerSmartContract(...params) {
        // FIXME: it's some weird params shifting, fix it later
        if (typeof options !== 'object') {
            // @ts-ignore
            options = {
                feeLimit: options,
                callValue: parameters,
            };
            // params.splice(3, 1);
        }
        // @ts-ignore
        return this._triggerSmartContract(
            contractAddress,
            functionSelector,
            options,
            issuerAddress,
            callback,
        );
    }

    triggerConstantContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback?: undefined,
    ): Promise<{ transaction: ITransaction; result: { result: boolean } }>;
    triggerConstantContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback: _CallbackT<any>,
    ): void;
    triggerConstantContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback?: _CallbackT<any>,
    ): void | Promise<{
        transaction: ITransaction;
        result: { result: boolean };
    }>;
    triggerConstantContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[] = [],
        issuerAddress: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<{
        transaction: ITransaction;
        result: { result: boolean };
    }> {
        options._isConstant = true;
        return this.triggerSmartContract(
            contractAddress,
            functionSelector,
            options,
            parameters,
            issuerAddress,
            callback,
        );
    }

    triggerConfirmedConstantContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback?: undefined,
    ): Promise<{ transaction: ITransaction; result: { result: boolean } }>;
    triggerConfirmedConstantContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback: _CallbackT<any>,
    ): void;
    triggerConfirmedConstantContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback?: _CallbackT<any>,
    ): void | Promise<{
        transaction: ITransaction;
        result: { result: boolean };
    }>;
    triggerConfirmedConstantContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[] = [],
        issuerAddress: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<{
        transaction: ITransaction;
        result: { result: boolean };
    }> {
        options._isConstant = true;
        options.confirmed = true;
        return this.triggerSmartContract(
            contractAddress,
            functionSelector,
            options,
            parameters,
            issuerAddress,
            callback,
        );
    }

    _triggerSmartContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback?: undefined,
    ): Promise<{ transaction: ITransaction; result: { result: boolean } }>;
    _triggerSmartContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback: _CallbackT<any>,
    ): void;
    _triggerSmartContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[],
        issuerAddress: string,
        callback?: _CallbackT<any>,
    ): void | Promise<{
        transaction: ITransaction;
        result: { result: boolean };
    }>;
    _triggerSmartContract(
        contractAddress: string,
        functionSelector: string,
        options: ContractOptions & { _isConstant?: boolean },
        parameters: { type: string; value: any }[] = [],
        issuerAddress: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<{
        transaction: ITransaction;
        result: { result: boolean };
    }> {
        // if (utils.isFunction(issuerAddress)) {
        //     callback = issuerAddress;
        //     issuerAddress = this.tronWeb.defaultAddress.hex;
        // }

        // if (utils.isFunction(parameters)) {
        //     callback = parameters;
        //     parameters = [];
        // }

        if (!callback) {
            return this.injectPromise(
                this._triggerSmartContract,
                contractAddress,
                functionSelector,
                options,
                parameters,
                issuerAddress,
            );
        }

        const { tokenValue, tokenId, callValue, feeLimit } = Object.assign(
            {
                callValue: 0,
                feeLimit: this.tronWeb.feeLimit,
            },
            options,
        );

        if (
            this.validator.notValid(
                [
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gt: 0,
                    },
                    {
                        name: 'callValue',
                        type: 'integer',
                        value: callValue,
                        gte: 0,
                    },
                    {
                        name: 'parameters',
                        type: 'array',
                        value: parameters,
                    },
                    {
                        name: 'contract',
                        type: 'address',
                        value: contractAddress,
                    },
                    {
                        name: 'issuer',
                        type: 'address',
                        value: issuerAddress,
                        optional: true,
                    },
                    {
                        name: 'tokenValue',
                        type: 'integer',
                        value: tokenValue,
                        gte: 0,
                        optional: true,
                    },
                    {
                        name: 'tokenId',
                        type: 'integer',
                        value: tokenId,
                        gte: 0,
                        optional: true,
                    },
                ],
                callback,
            )
        )
            return;

        const args = {
            contract_address: toHex(contractAddress),
            owner_address: toHex(issuerAddress),
        } as Record<string, unknown>;

        let param_str: string;
        if (functionSelector && utils.isString(functionSelector)) {
            functionSelector = functionSelector.replace('/s*/g', '');
            if (parameters.length) {
                const abiCoder = new AbiCoder();
                let types: string[] = [];
                const values: unknown[] = [];

                for (let i = 0; i < parameters.length; i++) {
                    // eslint-disable-next-line prefer-const
                    let { type, value } = parameters[i];

                    if (!type || !utils.isString(type) || !type.length) {
                        return callback(
                            'Invalid parameter type provided: ' + type,
                        );
                    }

                    if (type === 'address') {
                        value = toHex(value).replace(
                            ADDRESS_PREFIX_REGEX,
                            '0x',
                        );
                    } else if (
                        type.match(/^([^\x5b]*)(\x5b|$)/)![0] === 'address['
                    ) {
                        value = value.map((v) =>
                            toHex(v).replace(ADDRESS_PREFIX_REGEX, '0x'),
                        );
                    }

                    types.push(type);
                    values.push(value);
                }

                try {
                    // workaround for unsupported trcToken type
                    types = types.map((type) => {
                        if (/trcToken/.test(type))
                            type = type.replace(/trcToken/, 'uint256');

                        return type;
                    });

                    param_str = abiCoder
                        .encode(types, values)
                        .replace(/^(0x)/, '');
                } catch (ex) {
                    return callback(ex);
                }
            } else {
                param_str = '';
            }

            // work for abiv2 if passed the function abi in options
            if (options.funcABIV2) {
                param_str = encodeParamsV2ByABI(
                    options.funcABIV2,
                    options.parametersV2,
                ).replace(/^(0x)/, '');
            }

            if (
                options.shieldedParameter &&
                utils.isString(options.shieldedParameter)
            )
                param_str = options.shieldedParameter.replace(/^(0x)/, '');

            if (options.rawParameter && utils.isString(options.rawParameter))
                param_str = options.rawParameter.replace(/^(0x)/, '');

            args.function_selector = functionSelector;
            args.parameter = param_str;
        }

        args.call_value = parseInt(callValue);
        if (tokenValue != null)
            args.call_token_value = parseInt(tokenValue.toString());
        if (tokenId != null) args.token_id = parseInt(tokenId.toString());

        if (!options._isConstant)
            args.fee_limit = parseInt(feeLimit.toString());

        if (options.permissionId) args.Permission_id = options.permissionId;

        this.tronWeb[options.confirmed ? 'solidityNode' : 'fullNode']
            .request(
                `wallet${options.confirmed ? 'solidity' : ''}/trigger${
                    options._isConstant ? 'constant' : 'smart'
                }contract`,
                args,
                'post',
            )
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    clearABI(
        contractAddress: string,
        ownerAddress: string,
        callback?: undefined,
    ): void | Promise<ITransaction>;
    clearABI(
        contractAddress: string,
        ownerAddress: string,
        callback: _CallbackT<any>,
    ): void | Promise<ITransaction>;
    clearABI(
        contractAddress: string,
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        if (!callback) {
            return this.injectPromise(
                this.clearABI,
                contractAddress,
                ownerAddress,
            );
        }

        if (!this.tronWeb.isAddress(contractAddress))
            return callback('Invalid contract address provided');

        if (!this.tronWeb.isAddress(ownerAddress))
            return callback('Invalid owner address provided');

        const data: Record<string, unknown> = {
            contract_address: toHex(contractAddress),
            owner_address: toHex(ownerAddress),
        };

        if (this.tronWeb.trx.cache.contracts[contractAddress])
            delete this.tronWeb.trx.cache.contracts[contractAddress];

        this.tronWeb.fullNode
            .request('wallet/clearabi', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    updateBrokerage(
        brokerage: number,
        ownerAddress: string,
        callback?: undefined,
    ): void | Promise<ITransaction>;
    updateBrokerage(
        brokerage: number,
        ownerAddress: string,
        callback: _CallbackT<any>,
    ): void | Promise<ITransaction>;
    updateBrokerage(
        brokerage: number,
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        if (!callback) {
            return this.injectPromise(
                this.updateBrokerage,
                brokerage,
                ownerAddress,
            );
        }

        if (!utils.isNotNullOrUndefined(brokerage))
            return callback('Invalid brokerage provided');

        if (!utils.isInteger(brokerage) || brokerage < 0 || brokerage > 100)
            return callback('Brokerage must be an integer between 0 and 100');

        if (!this.tronWeb.isAddress(ownerAddress))
            return callback('Invalid owner address provided');

        const data: _LooseObject = {
            brokerage: parseInt(brokerage.toString()),
            owner_address: toHex(ownerAddress),
        };

        this.tronWeb.fullNode
            .request('wallet/updateBrokerage', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    createToken(
        options: ICreateTokenOptions & IPermissionId,
        issuerAddress: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    createToken(
        options: ICreateTokenOptions & IPermissionId,
        issuerAddress: string,
        callback: _CallbackT<any>,
    ): void;
    createToken(
        options: ICreateTokenOptions & IPermissionId,
        issuerAddress: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(issuerAddress)) {
        //     callback = issuerAddress;
        //     issuerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback)
            return this.injectPromise(this.createToken, options, issuerAddress);

        const {
            name,
            abbreviation,
            description,
            url,
            totalSupply,
            voteScore,
            precision,
            saleStart = Date.now(),
            saleEnd,

            // How much TRX will `tokenRatio` cost?
            trxRatio = 1,
            // How many tokens will `trxRatio` afford?
            tokenRatio = 1,
            // The creator's "donated" bandwidth for use by token holders
            freeBandwidth = 0,
            // Out of `totalFreeBandwidth`, the amount each token holder get
            freeBandwidthLimit = 0,
            frozenAmount = 0,
            frozenDuration = 0,
            // for now there is no default for the following values
        } = options;

        if (
            this.validator.notValid(
                [
                    {
                        name: 'Supply amount',
                        type: 'positive-integer',
                        value: totalSupply,
                    },
                    {
                        name: 'TRX ratio',
                        type: 'positive-integer',
                        value: trxRatio,
                    },
                    {
                        name: 'Token ratio',
                        type: 'positive-integer',
                        value: tokenRatio,
                    },
                    {
                        name: 'token abbreviation',
                        type: 'not-empty-string',
                        value: abbreviation,
                    },
                    {
                        name: 'token name',
                        type: 'not-empty-string',
                        value: name,
                    },
                    {
                        name: 'token description',
                        type: 'not-empty-string',
                        value: description,
                    },
                    {
                        name: 'token url',
                        type: 'url',
                        value: url,
                    },
                    {
                        name: 'issuer',
                        type: 'address',
                        value: issuerAddress,
                    },
                    {
                        name: 'sale start timestamp',
                        type: 'integer',
                        value: saleStart,
                        gte: Date.now(),
                    },
                    {
                        name: 'sale end timestamp',
                        type: 'integer',
                        value: saleEnd,
                        gt: saleStart,
                    },
                    {
                        name: 'Free bandwidth amount',
                        type: 'integer',
                        value: freeBandwidth,
                        gte: 0,
                    },
                    {
                        name: 'Free bandwidth limit',
                        type: 'integer',
                        value: freeBandwidthLimit,
                        gte: 0,
                    },
                    {
                        name: 'Frozen supply',
                        type: 'integer',
                        value: frozenAmount,
                        gte: 0,
                    },
                    {
                        name: 'Frozen duration',
                        type: 'integer',
                        value: frozenDuration,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        if (
            utils.isNotNullOrUndefined(voteScore) &&
            (!utils.isInteger(voteScore) || voteScore <= 0)
        ) {
            return callback(
                'voteScore must be a positive integer greater than 0',
            );
        }

        if (
            utils.isNotNullOrUndefined(precision) &&
            (!utils.isInteger(precision) || precision < 0 || precision > 6)
        ) {
            return callback(
                'precision must be a positive integer >= 0 and <= 6',
            );
        }

        const data: Record<string, unknown> = {
            owner_address: toHex(issuerAddress),
            name: fromUtf8(name),
            abbr: fromUtf8(abbreviation),
            description: fromUtf8(description),
            url: fromUtf8(url),
            total_supply: parseInt(totalSupply.toString()),
            trx_num: parseInt(trxRatio.toString()),
            num: parseInt(tokenRatio.toString()),
            start_time: parseInt(saleStart.toString()),
            end_time: parseInt(saleEnd.toString()),
            free_asset_net_limit: parseInt(freeBandwidth.toString()),
            public_free_asset_net_limit: parseInt(
                freeBandwidthLimit.toString(),
            ),
            frozen_supply: {
                frozen_amount: parseInt(frozenAmount.toString()),
                frozen_days: parseInt(frozenDuration.toString()),
            },
        };
        // Can never happen, we validated before!
        // if (!(parseInt(frozenAmount) > 0)) delete data.frozen_supply;

        // TODO: refactor this to `else` of checking branch
        if (precision && !isNaN(parseInt(precision.toString())))
            data.precision = parseInt(precision.toString());

        if (voteScore && !isNaN(parseInt(voteScore.toString())))
            data.vote_score = parseInt(voteScore.toString());

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/createassetissue', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    updateAccount(
        accountName: string,
        address: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    updateAccount(
        accountName: string,
        address: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): Promise<ITransaction>;
    updateAccount(
        accountName: string,
        address: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(address)) {
        //     callback = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(address)) {
        //     options = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.updateAccount,
                accountName,
                address,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'Name',
                        type: 'not-empty-string',
                        value: accountName,
                    },
                    {
                        name: 'origin',
                        type: 'address',
                        value: address,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            account_name: fromUtf8(accountName),
            owner_address: toHex(address),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/updateaccount', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    setAccountId(
        accountId: string,
        address: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    setAccountId(
        accountId: string,
        address: string,
        callback: _CallbackT<any>,
    ): void;
    setAccountId(
        accountId: string,
        address: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(address)) {
        //     callback = address;
        //     address = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback)
            return this.injectPromise(this.setAccountId, accountId, address);

        if (
            accountId &&
            utils.isString(accountId) &&
            accountId.startsWith('0x')
        )
            accountId = accountId.slice(2);

        if (
            this.validator.notValid(
                [
                    {
                        name: 'accountId',
                        type: 'hex',
                        value: accountId,
                    },
                    {
                        name: 'accountId',
                        type: 'string',
                        lte: 32,
                        gte: 8,
                        value: accountId,
                    },
                    {
                        name: 'origin',
                        type: 'address',
                        value: address,
                    },
                ],
                callback,
            )
        )
            return;

        this.tronWeb.fullNode
            .request(
                'wallet/setaccountid',
                {
                    account_id: accountId,
                    owner_address: toHex(address),
                },
                'post',
            )
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    updateToken(
        options: IUpdateTokenOptions & IPermissionId,
        issuerAddress: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    updateToken(
        options: IUpdateTokenOptions & IPermissionId,
        issuerAddress: string,
        callback: _CallbackT<any>,
    ): void;
    updateToken(
        options: IUpdateTokenOptions & IPermissionId,
        issuerAddress: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(issuerAddress)) {
        //     callback = issuerAddress;
        //     issuerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(issuerAddress)) {
        //     options = issuerAddress;
        //     issuerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback)
            return this.injectPromise(this.updateToken, options, issuerAddress);

        const {
            description,
            url,
            // The creator's "donated" bandwidth for use by token holders
            freeBandwidth = 0,
            // Out of `totalFreeBandwidth`, the amount each token holder get
            freeBandwidthLimit = 0,
        } = options;

        if (
            this.validator.notValid(
                [
                    {
                        name: 'token description',
                        type: 'not-empty-string',
                        value: description,
                    },
                    {
                        name: 'token url',
                        type: 'url',
                        value: url,
                    },
                    {
                        name: 'issuer',
                        type: 'address',
                        value: issuerAddress,
                    },
                    {
                        name: 'Free bandwidth amount',
                        type: 'positive-integer',
                        value: freeBandwidth,
                    },
                    {
                        name: 'Free bandwidth limit',
                        type: 'positive-integer',
                        value: freeBandwidthLimit,
                    },
                ],
                callback,
            )
        )
            return;

        const data: _LooseObject = {
            owner_address: toHex(issuerAddress),
            description: fromUtf8(description),
            url: fromUtf8(url),
            new_limit: parseInt(freeBandwidth.toString()),
            new_public_limit: parseInt(freeBandwidthLimit.toString()),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/updateasset', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    sendAsset: TransactionBuilder['sendToken'] = this.sendToken.bind(this);
    purchaseAsset: TransactionBuilder['purchaseToken'] =
        this.purchaseToken.bind(this);
    createAsset: TransactionBuilder['createToken'] =
        this.createToken.bind(this);
    updateAsset: TransactionBuilder['updateToken'] =
        this.updateToken.bind(this);

    /**
     * Creates a proposal to modify the network.
     * Can only be created by a current Super Representative.
     */
    createProposal(
        parameters: IProposalParameter | IProposalParameter[],
        issuerAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    createProposal(
        parameters: IProposalParameter | IProposalParameter[],
        issuerAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    createProposal(
        parameters: IProposalParameter | IProposalParameter[],
        issuerAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(issuerAddress)) {
        //     callback = issuerAddress;
        //     issuerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(issuerAddress)) {
        //     options = issuerAddress;
        //     issuerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.createProposal,
                parameters,
                issuerAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'issuer',
                        type: 'address',
                        value: issuerAddress,
                    },
                ],
                callback,
            )
        )
            return;

        const invalid = 'Invalid proposal parameters provided';

        if (!parameters) return callback(invalid);

        if (!utils.isArray(parameters)) parameters = [parameters];

        for (const parameter of parameters)
            if (!utils.isObject(parameter)) return callback(invalid);

        const data: Record<string, unknown> = {
            owner_address: toHex(issuerAddress),
            parameters: parameters,
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/proposalcreate', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    /**
     * Deletes a network modification proposal that the owner issued.
     * Only current Super Representative can vote on a proposal.
     */
    deleteProposal(
        proposalID: number,
        issuerAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    deleteProposal(
        proposalID: number,
        issuerAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    deleteProposal(
        proposalID: number,
        issuerAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(issuerAddress)) {
        //     callback = issuerAddress;
        //     issuerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(issuerAddress)) {
        //     options = issuerAddress;
        //     issuerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.deleteProposal,
                proposalID,
                issuerAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'issuer',
                        type: 'address',
                        value: issuerAddress,
                    },
                    {
                        name: 'proposalID',
                        type: 'integer',
                        value: proposalID,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            owner_address: toHex(issuerAddress),
            proposal_id: parseInt(proposalID.toString()),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/proposaldelete', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    /**
     * Adds a vote to an issued network modification proposal.
     * Only current Super Representative can vote on a proposal.
     */
    voteProposal(
        proposalID: number,
        isApproval: boolean,
        voterAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    voteProposal(
        proposalID: number,
        isApproval: boolean,
        voterAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    voteProposal(
        proposalID: number,
        isApproval: boolean,
        voterAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(voterAddress)) {
        //     callback = voterAddress;
        //     voterAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(voterAddress)) {
        //     options = voterAddress;
        //     voterAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.voteProposal,
                proposalID,
                isApproval,
                voterAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'voter',
                        type: 'address',
                        value: voterAddress,
                    },
                    {
                        name: 'proposalID',
                        type: 'integer',
                        value: proposalID,
                        gte: 0,
                    },
                    {
                        name: 'has approval',
                        type: 'boolean',
                        value: isApproval,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            owner_address: toHex(voterAddress),
            proposal_id: parseInt(proposalID.toString()),
            is_add_approval: isApproval,
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/proposalapprove', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    /**
     * Create an exchange between a token and TRX.
     * Token Name should be a CASE SENSITIVE string.
     * PLEASE VERIFY THIS ON TRONSCAN.
     */
    createTRXExchange(
        tokenName: string,
        tokenBalance: number,
        trxBalance: number,
        ownerAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<IResources>;
    createTRXExchange(
        tokenName: string,
        tokenBalance: number,
        trxBalance: number,
        ownerAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    createTRXExchange(
        tokenName: string,
        tokenBalance: number,
        trxBalance: number,
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<IResources> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(ownerAddress)) {
        //     callback = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(ownerAddress)) {
        //     options = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.createTRXExchange,
                tokenName,
                tokenBalance,
                trxBalance,
                ownerAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'owner',
                        type: 'address',
                        value: ownerAddress,
                    },
                    {
                        name: 'token name',
                        type: 'not-empty-string',
                        value: tokenName,
                    },
                    {
                        name: 'token balance',
                        type: 'positive-integer',
                        value: tokenBalance,
                    },
                    {
                        name: 'trx balance',
                        type: 'positive-integer',
                        value: trxBalance,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            owner_address: toHex(ownerAddress),
            first_token_id: fromUtf8(tokenName),
            first_token_balance: tokenBalance,
            second_token_id: '5f', // Constant for TRX.
            second_token_balance: trxBalance,
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/exchangecreate', data, 'post')
            .then((resources) => {
                callback(null, resources);
            })
            .catch((err) => callback(err));
    }

    /**
     * Create an exchange between a token and another token.
     * DO NOT USE THIS FOR TRX.
     * Token Names should be a CASE SENSITIVE string.
     * PLEASE VERIFY THIS ON TRONSCAN.
     */
    createTokenExchange(
        firstTokenName: string,
        firstTokenBalance: number,
        secondTokenName: string,
        secondTokenBalance: number,
        ownerAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<IResources>;
    createTokenExchange(
        firstTokenName: string,
        firstTokenBalance: number,
        secondTokenName: string,
        secondTokenBalance: number,
        ownerAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    createTokenExchange(
        firstTokenName: string,
        firstTokenBalance: number,
        secondTokenName: string,
        secondTokenBalance: number,
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<IResources> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(ownerAddress)) {
        //     callback = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(ownerAddress)) {
        //     options = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.createTokenExchange,
                firstTokenName,
                firstTokenBalance,
                secondTokenName,
                secondTokenBalance,
                ownerAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'owner',
                        type: 'address',
                        value: ownerAddress,
                    },
                    {
                        name: 'first token name',
                        type: 'not-empty-string',
                        value: firstTokenName,
                    },
                    {
                        name: 'second token name',
                        type: 'not-empty-string',
                        value: secondTokenName,
                    },
                    {
                        name: 'first token balance',
                        type: 'positive-integer',
                        value: firstTokenBalance,
                    },
                    {
                        name: 'second token balance',
                        type: 'positive-integer',
                        value: secondTokenBalance,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            owner_address: toHex(ownerAddress),
            first_token_id: fromUtf8(firstTokenName),
            first_token_balance: firstTokenBalance,
            second_token_id: fromUtf8(secondTokenName),
            second_token_balance: secondTokenBalance,
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/exchangecreate', data, 'post')
            .then((resources) => {
                callback(null, resources);
            })
            .catch((err) => callback(err));
    }

    /**
     * Adds tokens into a bancor style exchange.
     * Will add both tokens at market rate.
     * Use "_" for the constant value for TRX.
     */
    injectExchangeTokens(
        exchangeID: number,
        tokenName: string,
        tokenAmount: number,
        ownerAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    injectExchangeTokens(
        exchangeID: number,
        tokenName: string,
        tokenAmount: number,
        ownerAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    injectExchangeTokens(
        exchangeID: number,
        tokenName: string,
        tokenAmount = 0,
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(ownerAddress)) {
        //     callback = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(ownerAddress)) {
        //     options = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.injectExchangeTokens,
                exchangeID,
                tokenName,
                tokenAmount,
                ownerAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'owner',
                        type: 'address',
                        value: ownerAddress,
                    },
                    {
                        name: 'token name',
                        type: 'not-empty-string',
                        value: tokenName,
                    },
                    {
                        name: 'token amount',
                        type: 'integer',
                        value: tokenAmount,
                        gte: 1,
                    },
                    {
                        name: 'exchangeID',
                        type: 'integer',
                        value: exchangeID,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            owner_address: toHex(ownerAddress),
            exchange_id: parseInt(exchangeID.toString()),
            token_id: fromUtf8(tokenName),
            quant: parseInt(tokenAmount.toString()),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/exchangeinject', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    /**
     * Withdraws tokens from a bancor style exchange.
     * Will withdraw at market rate both tokens.
     * Use "_" for the constant value for TRX.
     */
    withdrawExchangeTokens(
        exchangeID: number,
        tokenName: string,
        tokenAmount: number,
        ownerAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    withdrawExchangeTokens(
        exchangeID: number,
        tokenName: string,
        tokenAmount: number,
        ownerAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    withdrawExchangeTokens(
        exchangeID: number,
        tokenName: string,
        tokenAmount = 0,
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(ownerAddress)) {
        //     callback = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(ownerAddress)) {
        //     options = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.withdrawExchangeTokens,
                exchangeID,
                tokenName,
                tokenAmount,
                ownerAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'owner',
                        type: 'address',
                        value: ownerAddress,
                    },
                    {
                        name: 'token name',
                        type: 'not-empty-string',
                        value: tokenName,
                    },
                    {
                        name: 'token amount',
                        type: 'integer',
                        value: tokenAmount,
                        gte: 1,
                    },
                    {
                        name: 'exchangeID',
                        type: 'integer',
                        value: exchangeID,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            owner_address: toHex(ownerAddress),
            exchange_id: parseInt(exchangeID.toString()),
            token_id: fromUtf8(tokenName),
            quant: parseInt(tokenAmount.toString()),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/exchangewithdraw', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    /**
     * Trade tokens on a bancor style exchange.
     * Expected value is a validation and used to cap the total amt of token 2 spent.
     * Use "_" for the constant value for TRX.
     */
    tradeExchangeTokens(
        exchangeID: number,
        tokenName: string,
        tokenAmountSold: number,
        tokenAmountExpected: number,
        ownerAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    tradeExchangeTokens(
        exchangeID: number,
        tokenName: string,
        tokenAmountSold: number,
        tokenAmountExpected: number,
        ownerAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    tradeExchangeTokens(
        exchangeID: number,
        tokenName: string,
        tokenAmountSold = 0,
        tokenAmountExpected = 0,
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(ownerAddress)) {
        //     callback = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(ownerAddress)) {
        //     options = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.tradeExchangeTokens,
                exchangeID,
                tokenName,
                tokenAmountSold,
                tokenAmountExpected,
                ownerAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'owner',
                        type: 'address',
                        value: ownerAddress,
                    },
                    {
                        name: 'token name',
                        type: 'not-empty-string',
                        value: tokenName,
                    },
                    {
                        name: 'tokenAmountSold',
                        type: 'integer',
                        value: tokenAmountSold,
                        gte: 1,
                    },
                    {
                        name: 'tokenAmountExpected',
                        type: 'integer',
                        value: tokenAmountExpected,
                        gte: 1,
                    },
                    {
                        name: 'exchangeID',
                        type: 'integer',
                        value: exchangeID,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            owner_address: toHex(ownerAddress),
            exchange_id: parseInt(exchangeID.toString()),
            token_id: this.tronWeb.fromAscii(tokenName),
            quant: parseInt(tokenAmountSold.toString()),
            expected: parseInt(tokenAmountExpected.toString()),
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/exchangetransaction', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    /**
     * Update userFeePercentage.
     */
    updateSetting(
        contractAddress: string,
        userFeePercentage: number,
        ownerAddress: string,
        options?: IPermissionId,
        callback?: undefined,
    ): Promise<ITransaction>;
    updateSetting(
        contractAddress: string,
        userFeePercentage: number,
        ownerAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    updateSetting(
        contractAddress: string,
        userFeePercentage: number,
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(ownerAddress)) {
        //     callback = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(ownerAddress)) {
        //     options = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.updateSetting,
                contractAddress,
                userFeePercentage,
                ownerAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'owner',
                        type: 'address',
                        value: ownerAddress,
                    },
                    {
                        name: 'contract',
                        type: 'address',
                        value: contractAddress,
                    },
                    {
                        name: 'userFeePercentage',
                        type: 'integer',
                        value: userFeePercentage,
                        gte: 0,
                        lte: 100,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            owner_address: toHex(ownerAddress),
            contract_address: toHex(contractAddress),
            consume_user_resource_percent: userFeePercentage,
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/updatesetting', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    /**
     * Update energy limit.
     */
    updateEnergyLimit(
        contractAddress: string,
        originEnergyLimit: number,
        ownerAddress: string,
        options?: IPermissionId,
        callback?: unknown,
    ): Promise<ITransaction>;
    updateEnergyLimit(
        contractAddress: string,
        originEnergyLimit: number,
        ownerAddress: string,
        options: IPermissionId,
        callback: _CallbackT<any>,
    ): void;
    updateEnergyLimit(
        contractAddress: string,
        originEnergyLimit: number,
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        options?: IPermissionId,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }

        // if (utils.isFunction(ownerAddress)) {
        //     callback = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // } else if (utils.isObject(ownerAddress)) {
        //     options = ownerAddress;
        //     ownerAddress = this.tronWeb.defaultAddress.hex;
        // }

        if (!callback) {
            return this.injectPromise(
                this.updateEnergyLimit,
                contractAddress,
                originEnergyLimit,
                ownerAddress,
                options,
            );
        }

        if (
            this.validator.notValid(
                [
                    {
                        name: 'owner',
                        type: 'address',
                        value: ownerAddress,
                    },
                    {
                        name: 'contract',
                        type: 'address',
                        value: contractAddress,
                    },
                    {
                        name: 'originEnergyLimit',
                        type: 'integer',
                        value: originEnergyLimit,
                        gte: 0,
                        lte: 10_000_000,
                    },
                ],
                callback,
            )
        )
            return;

        const data: Record<string, unknown> = {
            owner_address: toHex(ownerAddress),
            contract_address: toHex(contractAddress),
            origin_energy_limit: originEnergyLimit,
        };

        if (options && options.permissionId)
            data.Permission_id = options.permissionId;

        this.tronWeb.fullNode
            .request('wallet/updateenergylimit', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    checkPermissions(permissions: IPermissions, type: number): boolean {
        if (permissions) {
            if (
                permissions.type !== type ||
                !permissions.permission_name ||
                !utils.isString(permissions.permission_name) ||
                !utils.isInteger(permissions.threshold) ||
                permissions.threshold < 1 ||
                !permissions.keys
            )
                return false;

            for (const key of permissions.keys) {
                if (
                    !this.tronWeb.isAddress(key.address) ||
                    !utils.isInteger(key.weight) ||
                    key.weight > permissions.threshold ||
                    key.weight < 1 ||
                    (type === 2 && !permissions.operations)
                )
                    return false;
            }
        }
        return true;
    }

    updateAccountPermissions(
        ownerAddress: string,
        ownerPermissions: IPermissions,
        witnessPermissions: IPermissions,
        activesPermissions: IPermissions | IPermissions[],
        callback?: unknown,
    ): Promise<ITransaction>;
    updateAccountPermissions(
        ownerAddress: string,
        ownerPermissions: IPermissions,
        witnessPermissions: IPermissions,
        activesPermissions: IPermissions | IPermissions[],
        callback: _CallbackT<any>,
    ): void;
    updateAccountPermissions(
        ownerAddress: string = this.tronWeb.defaultAddress.hex,
        ownerPermissions: IPermissions,
        witnessPermissions: IPermissions,
        activesPermissions: IPermissions | IPermissions[],
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        // if (utils.isFunction(activesPermissions)) {
        //     callback = activesPermissions;
        //     activesPermissions = false;
        // }

        // if (utils.isFunction(witnessPermissions)) {
        //     callback = witnessPermissions;
        //     witnessPermissions = activesPermissions = false;
        // }

        // if (utils.isFunction(ownerPermissions)) {
        //     callback = ownerPermissions;
        //     ownerPermissions = witnessPermissions = activesPermissions = false;
        // }

        if (!callback) {
            return this.injectPromise(
                this.updateAccountPermissions,
                ownerAddress,
                ownerPermissions,
                witnessPermissions,
                activesPermissions,
            );
        }

        if (!this.tronWeb.isAddress(ownerAddress))
            return callback('Invalid ownerAddress provided');

        if (!this.checkPermissions(ownerPermissions, 0))
            return callback('Invalid ownerPermissions provided');

        if (!this.checkPermissions(witnessPermissions, 1))
            return callback('Invalid witnessPermissions provided');

        if (!Array.isArray(activesPermissions))
            activesPermissions = [activesPermissions];

        for (const activesPermission of activesPermissions) {
            if (!this.checkPermissions(activesPermission, 2))
                return callback('Invalid activesPermissions provided');
        }

        const data: Record<string, unknown> = {
            owner_address: ownerAddress,
        };
        if (ownerPermissions) data.owner = ownerPermissions;

        if (witnessPermissions) data.witness = witnessPermissions;

        if (activesPermissions) {
            data.actives =
                activesPermissions.length === 1
                    ? activesPermissions[0]
                    : activesPermissions;
        }

        this.tronWeb.fullNode
            .request('wallet/accountpermissionupdate', data, 'post')
            .then((transaction) => resultManager(transaction, callback))
            .catch((err) => callback(err));
    }

    async newTxID(
        transaction: ITransaction,
        callback?: undefined,
    ): Promise<ITransaction>;
    async newTxID(
        transaction: ITransaction,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async newTxID(
        transaction: ITransaction,
        callback?: _CallbackT<any>,
    ): Promise<void | ITransaction> {
        if (!callback) return this.injectPromise(this.newTxID, transaction);

        this.tronWeb.fullNode
            .request('wallet/getsignweight', transaction, 'post')
            .then((newTransaction) => {
                const inner = newTransaction.transaction.transaction;
                if (typeof transaction.visible === 'boolean')
                    inner.visible = transaction.visible;

                callback(null, inner);
            })
            .catch(() => callback('Error generating a new transaction id.'));
    }

    async alterTransaction(
        transaction: ITransaction,
        // eslint-disable-next-line @typescript-eslint/ban-types
        options: ({} | { data: unknown; dataFormat: string }) & {
            extension?: number;
        },
        callback?: undefined,
    ): Promise<ITransaction>;
    async alterTransaction(
        transaction: ITransaction,
        // eslint-disable-next-line @typescript-eslint/ban-types
        options: ({} | { data: unknown; dataFormat: string }) & {
            extension?: number;
        },
        callback: _CallbackT<any>,
    ): Promise<void>;
    async alterTransaction(
        transaction: ITransaction,
        // eslint-disable-next-line @typescript-eslint/ban-types
        options: ({} | { data: unknown; dataFormat: string }) & {
            extension?: number;
        },
        callback?: _CallbackT<any>,
    ): Promise<void | ITransaction> {
        if (!callback) {
            return this.injectPromise(
                this.alterTransaction,
                transaction,
                options,
            );
        }

        if (transaction.signature) {
            return callback(
                'You can not extend the expiration of a signed transaction.',
            );
        }

        if ('data' in options && options.data) {
            let { data } = options;
            if (options.dataFormat !== 'hex') data = this.tronWeb.toHex(data);
            if (!utils.isString(data))
                throw new TypeError('Invalid data provided');
            data = data.replace(/^0x/, '');
            if ((data as string).length === 0)
                return callback('Invalid data provided');
            transaction.raw_data.data = data;
            options.data = data;
        }

        if (options.extension) {
            options.extension = parseInt((options.extension * 1000).toString());
            if (
                isNaN(options.extension) ||
                transaction.raw_data.expiration + options.extension <=
                    Date.now() + 3000
            )
                return callback('Invalid extension provided');
            transaction.raw_data.expiration += options.extension;
        }

        this.newTxID(transaction, callback);
    }

    async extendExpiration(
        transaction: ITransaction,
        extension: number,
        callback?: undefined,
    ): Promise<ITransaction>;
    async extendExpiration(
        transaction: ITransaction,
        extension: number,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async extendExpiration(
        transaction: ITransaction,
        extension: number,
        callback?: _CallbackT<any>,
    ): Promise<void | ITransaction> {
        if (!callback) {
            return this.injectPromise(
                this.extendExpiration,
                transaction,
                extension,
            );
        }

        this.alterTransaction(transaction, { extension }, callback);
    }

    async addUpdateData(
        transaction: ITransaction,
        data: unknown,
        dataFormat: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    async addUpdateData(
        transaction: ITransaction,
        data: unknown,
        dataFormat: string,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async addUpdateData(
        transaction: ITransaction,
        data: unknown,
        dataFormat = 'utf8',
        callback?: _CallbackT<any>,
    ): Promise<void | ITransaction> {
        // if (utils.isFunction(dataFormat)) {
        //     callback = dataFormat;
        //     dataFormat = 'utf8';
        // }

        if (!callback) {
            return this.injectPromise(
                this.addUpdateData,
                transaction,
                data,
                dataFormat,
            );
        }

        this.alterTransaction(transaction, { data, dataFormat }, callback);
    }
}
