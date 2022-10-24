import TronWeb from '..';
import utils from '../utils';
import {
    keccak256,
    toUtf8Bytes,
    recoverAddress,
    SigningKey,
} from '../utils/ethersUtils';
import { ADDRESS_PREFIX } from '../utils/address';
import Validator from '../paramValidator';
import injectpromise from 'injectpromise';

const TRX_MESSAGE_HEADER = '\x19TRON Signed Message:\n32';
// it should be: '\x15TRON Signed Message:\n32';
const ETH_MESSAGE_HEADER = '\x19Ethereum Signed Message:\n32';

// FIXME: more generic or not generic at all
type _CallbackT<Out> = ((err: unknown) => Out) &
    ((err: null, data: any) => Out);
export declare type BlockT = number | 'latest' | 'earliest' | string;
export declare type ResourceT = 'BANDWIDTH' | 'ENERGY';
// FIXME: All interfaces here should be generated from protobuf instead.
export interface IBlock {
    number: number;
    transactions: ITransaction[];
}
export interface ITransaction {
    number: number;
    hash: string;
    direction: 'to' | 'from' | 'all';
    signature?: string;
    raw_data: {
        timestamp: number;
        contract: {
            parameter: { value: { owner_address: string } };
            Permission_id: number;
        }[];
    };
    // transactions: any[];
}
export interface IAccount {
    balance: number;
}

export interface IAccountNet {
    freeNetUsed: number;
    freeNetLimit: number;
    NetUsed: number;
    NetLimit: number;
}
export interface IToken {
    name: string;
    abbr: string;
    description: string;
    url?: string;
}
export type IAssetIssue = IToken;

type _PureObject = { [k: string]: unknown } & (
    | { bind?: never }
    | { call?: never }
);
export interface ISignWeight {
    result: { code: string; message: string };
    permission: { keys: [{ address: string }] };
    approved_list: string[];
    transaction: { transaction: ITransaction };
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IProposal {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IExchange {}

function toHex(value: string): string {
    return TronWeb.address.toHex(value);
}

export default class Trx {
    tronWeb: TronWeb;
    injectPromise: any;
    cache: { contracts: { [key: string]: unknown } };
    validator: Validator;

    constructor(tronWeb: TronWeb) {
        if (!tronWeb || !(tronWeb instanceof TronWeb))
            throw new Error('Expected instance of TronWeb');

        this.tronWeb = tronWeb;
        this.injectPromise = injectpromise(this);
        this.cache = {
            contracts: {},
        };
        this.validator = new Validator(tronWeb);
    }

    _parseToken(token: IToken): IToken {
        return {
            ...token,
            name: this.tronWeb.toUtf8(token.name),
            abbr: token.abbr && this.tronWeb.toUtf8(token.abbr),
            description:
                token.description && this.tronWeb.toUtf8(token.description),
            url: token.url && this.tronWeb.toUtf8(token.url),
        };
    }

    getCurrentBlock(): Promise<IBlock>;
    getCurrentBlock(callback: _CallbackT<any>): void;
    getCurrentBlock(callback?: _CallbackT<any>): void | Promise<IBlock> {
        if (!callback) return this.injectPromise(this.getCurrentBlock);
        this.tronWeb.fullNode
            .request('wallet/getnowblock')
            .then((block) => {
                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    getConfirmedCurrentBlock(): Promise<IBlock>;
    getConfirmedCurrentBlock(callback: _CallbackT<any>): void;
    getConfirmedCurrentBlock(
        callback?: _CallbackT<any>,
    ): void | Promise<IBlock> {
        if (!callback) return this.injectPromise(this.getConfirmedCurrentBlock);
        this.tronWeb.solidityNode
            .request('walletsolidity/getnowblock')
            .then((block) => {
                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    getBlock(block: BlockT | false): Promise<IBlock>;
    getBlock(block: _CallbackT<any>): void;
    getBlock(block: BlockT | false, callback: _CallbackT<any>): void;
    getBlock(
        block: BlockT | _CallbackT<any> | false = this.tronWeb.defaultBlock,
        callback?: _CallbackT<any>,
    ): void | Promise<IBlock> {
        if (typeof block === 'function')
            return this.getBlock(this.tronWeb.defaultBlock, block);

        if (!callback) return this.injectPromise(this.getBlock, block);

        if (block === false) return callback('No block identifier provided');

        if (block === 'earliest') block = 0;
        if (block === 'latest') return this.getCurrentBlock(callback);

        // TODO: can we drop this weird isNaN for string?..
        // if (isNaN(block as any as number) && utils.isHex(block))
        if (utils.isHex(block)) return this.getBlockByHash(block, callback);

        this.getBlockByNumber(block, callback);
    }

    getBlockByHash(blockHash: string, callback?: undefined): Promise<IBlock>;
    getBlockByHash(blockHash: string, callback: _CallbackT<any>): void;
    getBlockByHash(
        blockHash: string,
        callback?: _CallbackT<any>,
    ): void | Promise<IBlock> {
        if (!callback)
            return this.injectPromise(this.getBlockByHash, blockHash);

        this.tronWeb.fullNode
            .request(
                'wallet/getblockbyid',
                {
                    value: blockHash,
                },
                'post',
            )
            .then((block) => {
                if (!Object.keys(block).length)
                    return callback('Block not found');

                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    getBlockByNumber(blockID: number, callback?: undefined): Promise<IBlock>;
    getBlockByNumber(blockID: number, callback: _CallbackT<any>): void;
    getBlockByNumber(
        blockID: number,
        callback?: _CallbackT<any>,
    ): void | Promise<IBlock> {
        if (!callback)
            return this.injectPromise(this.getBlockByNumber, blockID);

        if (!utils.isInteger(blockID) || blockID < 0)
            return callback('Invalid block number provided');

        this.tronWeb.fullNode
            .request(
                'wallet/getblockbynum',
                { num: parseInt(blockID.toString()) },
                'post',
            )
            .then((block) => {
                if (!Object.keys(block).length)
                    return callback('Block not found');

                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    getBlockTransactionCount(block: BlockT | false): Promise<number>;
    getBlockTransactionCount(block: _CallbackT<any>): void;
    getBlockTransactionCount(
        block: BlockT | false,
        callback: _CallbackT<any>,
    ): void;
    getBlockTransactionCount(
        block: BlockT | _CallbackT<any> | false = this.tronWeb.defaultBlock,
        callback?: _CallbackT<any>,
    ): void | Promise<number> {
        if (typeof block === 'function') {
            return this.getBlockTransactionCount(
                this.tronWeb.defaultBlock,
                block,
            );
        }

        if (!callback)
            return this.injectPromise(this.getBlockTransactionCount, block);

        this.getBlock(block)
            .then(({ transactions = [] }) => {
                callback(null, transactions.length);
            })
            .catch((err) => callback(err));
    }

    getTransactionFromBlock(block: BlockT | false): Promise<ITransaction[]>;
    getTransactionFromBlock(block: _CallbackT<any>): void;
    getTransactionFromBlock(
        block: BlockT | false,
        index: number,
    ): Promise<ITransaction>;
    getTransactionFromBlock(
        block: BlockT | false,
        index: _CallbackT<any>,
    ): void;
    getTransactionFromBlock(
        block: BlockT | false,
        index: number | null | undefined,
        callback: _CallbackT<any>,
    ): void;
    getTransactionFromBlock(
        block: BlockT | _CallbackT<any> | false = this.tronWeb.defaultBlock,
        index?: number | null | _CallbackT<any>,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> | Promise<ITransaction[]> {
        if (utils.isFunction(index)) {
            if (utils.isFunction(block))
                throw new TypeError('Two callbacks passed.');
            return this.getTransactionFromBlock(block, 0, index);
        }

        if (utils.isFunction(block)) {
            return this.getTransactionFromBlock(
                this.tronWeb.defaultBlock,
                index,
                block,
            );
        }

        if (!callback) {
            return this.injectPromise(
                this.getTransactionFromBlock,
                block,
                index,
            );
        }

        this.getBlock(block)
            .then(({ transactions }: { transactions?: ITransaction[] }) => {
                if (!transactions) {
                    callback('Transaction not found in block');
                } else if (typeof index == 'number') {
                    if (index >= 0 && index < transactions.length)
                        callback(null, transactions[index]);
                    else callback('Invalid transaction index provided');
                } else {
                    callback(null, transactions);
                }
            })
            .catch((err) => callback(err));
    }

    getTransaction(
        transactionID: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    getTransaction(transactionID: string, callback: _CallbackT<any>): void;
    getTransaction(
        transactionID: string,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        if (!callback)
            return this.injectPromise(this.getTransaction, transactionID);

        this.tronWeb.fullNode
            .request(
                'wallet/gettransactionbyid',
                { value: transactionID },
                'post',
            )
            .then((transaction) => {
                if (!Object.keys(transaction).length)
                    return callback('Transaction not found');

                callback(null, transaction);
            })
            .catch((err) => callback(err));
    }

    getConfirmedTransaction(
        transactionID: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    getConfirmedTransaction(
        transactionID: string,
        callback: _CallbackT<any>,
    ): void;
    getConfirmedTransaction(
        transactionID: string,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        if (!callback) {
            return this.injectPromise(
                this.getConfirmedTransaction,
                transactionID,
            );
        }

        this.tronWeb.solidityNode
            .request(
                'walletsolidity/gettransactionbyid',
                { value: transactionID },
                'post',
            )
            .then((transaction) => {
                if (!Object.keys(transaction).length)
                    return callback('Transaction not found');

                callback(null, transaction);
            })
            .catch((err) => callback(err));
    }

    getUnconfirmedTransaction(
        transactionID: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    getUnconfirmedTransaction(
        transactionID: string,
        callback: _CallbackT<any>,
    ): void;
    getUnconfirmedTransaction(
        transactionID: string,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        if (!callback) {
            return this._getTransactionInfoById(
                transactionID,
                { confirmed: false },
                callback,
            );
        }
        return this._getTransactionInfoById(
            transactionID,
            { confirmed: false },
            callback,
        );
    }

    getTransactionInfo(
        transactionID: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    getTransactionInfo(transactionID: string, callback: _CallbackT<any>): void;
    getTransactionInfo(
        transactionID: string,
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        if (!callback) {
            return this._getTransactionInfoById(
                transactionID,
                { confirmed: true },
                callback,
            );
        }
        return this._getTransactionInfoById(
            transactionID,
            { confirmed: true },
            callback,
        );
    }

    _getTransactionInfoById(
        transactionID: string,
        options: { confirmed: boolean },
        callback?: undefined,
    ): Promise<ITransaction>;
    _getTransactionInfoById(
        transactionID: string,
        options: { confirmed: boolean },
        callback: _CallbackT<any>,
    ): void;
    _getTransactionInfoById(
        transactionID: string,
        options: { confirmed: boolean },
        callback?: _CallbackT<any>,
    ): void | Promise<ITransaction> {
        if (!callback) {
            return this.injectPromise(
                this._getTransactionInfoById,
                transactionID,
                options,
            );
        }

        this.tronWeb[options.confirmed ? 'solidityNode' : 'fullNode']
            .request(
                `wallet${
                    options.confirmed ? 'solidity' : ''
                }/gettransactioninfobyid`,
                { value: transactionID },
                'post',
            )
            .then((transaction) => {
                callback(null, transaction);
            })
            .catch((err) => callback(err));
    }

    getTransactionsToAddress(address: string): Promise<ITransaction[]>;
    getTransactionsToAddress(
        address: string,
        limit: number,
    ): Promise<ITransaction[]>;
    getTransactionsToAddress(
        address: string,
        limit: _CallbackT<any>,
    ): Promise<void>;
    getTransactionsToAddress(
        address: string,
        limit: number,
        offset: number,
    ): Promise<ITransaction[]>;
    getTransactionsToAddress(
        address: string,
        limit: number,
        offset: _CallbackT<any>,
    ): Promise<void>;
    getTransactionsToAddress(
        address: string,
        limit: number,
        offset: number | undefined,
        callback: _CallbackT<any>,
    ): Promise<void>;
    getTransactionsToAddress(
        address: string,
        limit: number | _CallbackT<any> = 30,
        offset: number | _CallbackT<any> = 0,
        callback?: _CallbackT<any>,
    ): Promise<void> | Promise<ITransaction[]> {
        if (utils.isFunction(offset)) {
            if (utils.isFunction(limit))
                throw new TypeError('Two callbacks passed.');
            return this.getTransactionsToAddress(address, limit, 0, offset);
        }

        if (utils.isFunction(limit))
            return this.getTransactionsToAddress(address, 30, offset, limit);

        if (!callback) {
            return this.injectPromise(
                this.getTransactionsToAddress,
                address,
                limit,
                offset,
            );
        }

        address = this.tronWeb.address.toHex(address);

        return this.getTransactionsRelated(
            address,
            'to',
            limit,
            offset,
            callback,
        );
    }

    getTransactionsFromAddress(): Promise<ITransaction[]>;
    getTransactionsFromAddress(address: string): Promise<ITransaction[]>;
    getTransactionsFromAddress(
        address: string,
        limit: number,
    ): Promise<ITransaction[]>;
    getTransactionsFromAddress(
        address: string,
        limit: _CallbackT<any>,
    ): Promise<void>;
    getTransactionsFromAddress(
        address: string,
        limit: number,
        offset: number,
    ): Promise<ITransaction[]>;
    getTransactionsFromAddress(
        address: string,
        limit: number,
        offset: _CallbackT<any>,
    ): Promise<void>;
    getTransactionsFromAddress(
        address: string,
        limit: number,
        offset: number | undefined,
        callback: _CallbackT<any>,
    ): Promise<void>;
    getTransactionsFromAddress(
        address: string = this.tronWeb.defaultAddress.hex,
        limit: number | _CallbackT<any> = 30,
        offset: number | _CallbackT<any> = 0,
        callback?: _CallbackT<any>,
    ): Promise<void> | Promise<ITransaction[]> {
        if (utils.isFunction(offset)) {
            if (utils.isFunction(limit))
                throw new TypeError('Two callbacks passed.');
            return this.getTransactionsFromAddress(address, limit, 0, offset);
        }

        if (utils.isFunction(limit))
            return this.getTransactionsFromAddress(address, 30, offset, limit);

        if (!callback) {
            return this.injectPromise(
                this.getTransactionsFromAddress,
                address,
                limit,
                offset,
            );
        }

        address = this.tronWeb.address.toHex(address);

        return this.getTransactionsRelated(
            address,
            'from',
            limit,
            offset,
            callback,
        );
    }

    async getTransactionsRelated(): Promise<ITransaction[]>;
    async getTransactionsRelated(address: string): Promise<ITransaction[]>;
    async getTransactionsRelated(address: _CallbackT<any>): Promise<void>;
    async getTransactionsRelated(
        address: string,
        direction: 'all' | 'to' | 'from',
    ): Promise<ITransaction[]>;
    async getTransactionsRelated(
        address: string,
        direction: _CallbackT<any>,
    ): Promise<void>;
    async getTransactionsRelated(
        address: string,
        direction: 'all' | 'to' | 'from',
        limit: number,
    ): Promise<ITransaction[]>;
    async getTransactionsRelated(
        address: string,
        direction: 'all' | 'to' | 'from',
        limit: _CallbackT<any>,
    ): Promise<void>;
    async getTransactionsRelated(
        address: string,
        direction: 'all' | 'to' | 'from',
        limit: number,
        offset: number,
    ): Promise<ITransaction[]>;
    async getTransactionsRelated(
        address: string,
        direction: 'all' | 'to' | 'from',
        limit: number,
        offset: _CallbackT<any>,
    ): Promise<void>;
    async getTransactionsRelated(
        address: string,
        direction: 'all' | 'to' | 'from',
        limit: number,
        offset: number | undefined,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async getTransactionsRelated(
        address: string | _CallbackT<any> = this.tronWeb.defaultAddress.hex,
        direction: 'all' | 'to' | 'from' | _CallbackT<any> = 'all',
        limit: number | _CallbackT<any> = 30,
        offset: number | _CallbackT<any> = 0,
        callback?: _CallbackT<any>,
    ): Promise<void | ITransaction[]> {
        if (utils.isFunction(offset)) {
            if (
                utils.isFunction(limit) ||
                utils.isFunction(address) ||
                utils.isFunction(direction)
            )
                throw new TypeError('Two or more callbacks passed.');
            return this.getTransactionsRelated(
                address,
                direction,
                limit,
                0,
                offset,
            );
        }
        if (utils.isFunction(limit)) {
            if (utils.isFunction(address) || utils.isFunction(direction))
                throw new TypeError('Two or more callbacks passed.');
            return this.getTransactionsRelated(
                address,
                direction,
                30,
                offset,
                limit,
            );
        }
        if (utils.isFunction(direction)) {
            if (utils.isFunction(address))
                throw new TypeError('Two or more callbacks passed.');
            return this.getTransactionsRelated(
                address,
                'all',
                limit,
                offset,
                direction,
            );
        }
        if (utils.isFunction(address)) {
            return this.getTransactionsRelated(
                this.tronWeb.defaultAddress.hex,
                direction,
                limit,
                offset,
                address,
            );
        }

        if (!callback) {
            return this.injectPromise(
                this.getTransactionsRelated,
                address,
                direction,
                limit,
                offset,
            );
        }

        if (!['to', 'from', 'all'].includes(direction)) {
            return callback(
                'Invalid direction provided: Expected "to", "from" or "all"',
            );
        }

        if (direction === 'all') {
            try {
                const [from, to] = await Promise.all([
                    this.getTransactionsRelated(address, 'from', limit, offset),
                    this.getTransactionsRelated(address, 'to', limit, offset),
                ]);

                return callback(
                    null,
                    [
                        ...from.map((tx) => ((tx.direction = 'from'), tx)),
                        ...to.map((tx) => ((tx.direction = 'to'), tx)),
                    ].sort((a, b) => {
                        return b.raw_data.timestamp - a.raw_data.timestamp;
                    }),
                );
            } catch (ex) {
                return callback(ex);
            }
        }

        if (!this.tronWeb.isAddress(address))
            return callback('Invalid address provided');

        if (!utils.isInteger(limit) || limit < 0 || (offset && limit < 1))
            return callback('Invalid limit provided');

        if (!utils.isInteger(offset) || offset < 0)
            return callback('Invalid offset provided');

        address = this.tronWeb.address.toHex(address);

        this.tronWeb.solidityNode
            .request(
                `walletextension/gettransactions${direction}this`,
                {
                    account: {
                        address,
                    },
                    offset,
                    limit,
                },
                'post',
            )
            .then(({ transaction }) => {
                callback(null, transaction);
            })
            .catch((err) => callback(err));
    }

    getAccount(): Promise<IAccount>;
    getAccount(address: _CallbackT<any>): void;
    getAccount(address: string, callback?: undefined): Promise<IAccount>;
    getAccount(address: string, callback: _CallbackT<any>): void;
    getAccount(
        address: string | _CallbackT<any> = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<IAccount> {
        if (utils.isFunction(address))
            return this.getAccount(this.tronWeb.defaultAddress.hex, address);

        if (!callback) return this.injectPromise(this.getAccount, address);

        if (!this.tronWeb.isAddress(address))
            return callback('Invalid address provided');

        address = this.tronWeb.address.toHex(address);

        this.tronWeb.solidityNode
            .request('walletsolidity/getaccount', { address }, 'post')
            .then((account) => {
                callback(null, account);
            })
            .catch((err) => callback(err));
    }

    getAccountById(id: string, callback?: undefined): Promise<IAccount>;
    getAccountById(id: string, callback: _CallbackT<any>): void;
    getAccountById(
        id: string,
        callback?: _CallbackT<any>,
    ): void | Promise<IAccount> {
        if (!callback) return this.injectPromise(this.getAccountById, id);
        this.getAccountInfoById(id, { confirmed: true }, callback);
    }

    getAccountInfoById(
        id: string,
        options: { confirmed: boolean },
        callback: _CallbackT<any>,
    ): void {
        if (
            this.validator.notValid(
                [
                    {
                        name: 'accountId',
                        type: 'hex',
                        value: id,
                    },
                    {
                        name: 'accountId',
                        type: 'string',
                        lte: 32,
                        gte: 8,
                        value: id,
                    },
                ],
                callback,
            )
        )
            return;

        if (id.startsWith('0x')) id = id.slice(2);

        this.tronWeb[options.confirmed ? 'solidityNode' : 'fullNode']
            .request(
                `wallet${options.confirmed ? 'solidity' : ''}/getaccountbyid`,
                { account_id: id },
                'post',
            )
            .then((account) => {
                callback(null, account);
            })
            .catch((err) => callback(err));
    }

    getBalance(): Promise<number>;
    getBalance(address: _CallbackT<any>): void;
    getBalance(address: string, callback?: undefined): Promise<number>;
    getBalance(address: string, callback: _CallbackT<any>): void;
    getBalance(
        address: string | _CallbackT<any> = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<number> {
        if (utils.isFunction(address))
            return this.getBalance(this.tronWeb.defaultAddress.hex, address);

        if (!callback) return this.injectPromise(this.getBalance, address);

        this.getAccount(address)
            .then(({ balance = 0 }) => {
                callback(null, balance);
            })
            .catch((err) => callback(err));
    }

    getUnconfirmedAccount(): Promise<IAccount>;
    getUnconfirmedAccount(address: _CallbackT<any>): void;
    getUnconfirmedAccount(
        address: string,
        callback?: undefined,
    ): Promise<IAccount>;
    getUnconfirmedAccount(address: string, callback: _CallbackT<any>): void;
    getUnconfirmedAccount(
        address: string | _CallbackT<any> = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<IAccount> {
        if (utils.isFunction(address)) {
            return this.getUnconfirmedAccount(
                this.tronWeb.defaultAddress.hex,
                address,
            );
        }

        if (!callback)
            return this.injectPromise(this.getUnconfirmedAccount, address);

        if (!this.tronWeb.isAddress(address))
            return callback('Invalid address provided');

        address = this.tronWeb.address.toHex(address);

        this.tronWeb.fullNode
            .request('wallet/getaccount', { address }, 'post')
            .then((account) => {
                callback(null, account);
            })
            .catch((err) => callback(err));
    }

    getUnconfirmedAccountById(
        id: string,
        callback?: undefined,
    ): Promise<IAccount>;
    getUnconfirmedAccountById(id: string, callback: _CallbackT<any>): void;
    getUnconfirmedAccountById(
        id: string,
        callback?: _CallbackT<any>,
    ): void | Promise<IAccount> {
        if (!callback)
            return this.injectPromise(this.getUnconfirmedAccountById, id);
        this.getAccountInfoById(id, { confirmed: false }, callback);
    }

    getUnconfirmedBalance(): Promise<number>;
    getUnconfirmedBalance(address: _CallbackT<any>): void;
    getUnconfirmedBalance(
        address: string,
        callback?: undefined,
    ): Promise<number>;
    getUnconfirmedBalance(address: string, callback: _CallbackT<any>): void;
    getUnconfirmedBalance(
        address: string | _CallbackT<any> = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<number> {
        if (utils.isFunction(address)) {
            return this.getUnconfirmedBalance(
                this.tronWeb.defaultAddress.hex,
                address,
            );
        }

        if (!callback)
            return this.injectPromise(this.getUnconfirmedBalance, address);

        this.getUnconfirmedAccount(address)
            .then(({ balance = 0 }) => {
                callback(null, balance);
            })
            .catch((err) => callback(err));
    }

    // TODO: it should be separate IBandwidth
    getBandwidth(): Promise<IAccountNet>;
    getBandwidth(address: _CallbackT<any>): void;
    getBandwidth(address: string, callback?: undefined): Promise<IAccountNet>;
    getBandwidth(address: string, callback: _CallbackT<any>): void;
    getBandwidth(
        address: string | _CallbackT<any> = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<IAccountNet> {
        if (utils.isFunction(address))
            return this.getBandwidth(this.tronWeb.defaultAddress.hex, address);

        if (!callback) return this.injectPromise(this.getBandwidth, address);

        if (!this.tronWeb.isAddress(address))
            return callback('Invalid address provided');

        address = this.tronWeb.address.toHex(address);

        this.tronWeb.fullNode
            .request('wallet/getaccountnet', { address }, 'post')
            .then(
                ({
                    freeNetUsed = 0,
                    freeNetLimit = 0,
                    NetUsed = 0,
                    NetLimit = 0,
                }) => {
                    callback(
                        null,
                        freeNetLimit - freeNetUsed + (NetLimit - NetUsed),
                    );
                },
            )
            .catch((err) => callback(err));
    }

    getTokensIssuedByAddress(): Promise<number>;
    getTokensIssuedByAddress(address: _CallbackT<any>): void;
    getTokensIssuedByAddress(
        address: string,
        callback?: undefined,
    ): Promise<number>;
    getTokensIssuedByAddress(address: string, callback: _CallbackT<any>): void;
    getTokensIssuedByAddress(
        address: string | _CallbackT<any> = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<any>,
    ): void | Promise<number> {
        if (utils.isFunction(address)) {
            return this.getTokensIssuedByAddress(
                this.tronWeb.defaultAddress.hex,
                address,
            );
        }

        if (!callback)
            return this.injectPromise(this.getTokensIssuedByAddress, address);

        if (!this.tronWeb.isAddress(address))
            return callback('Invalid address provided');

        address = this.tronWeb.address.toHex(address);

        this.tronWeb.fullNode
            .request('wallet/getassetissuebyaccount', { address }, 'post')
            // FIXME: should be separate interface
            .then(({ assetIssue }: { assetIssue?: IToken[] }) => {
                if (!assetIssue) return callback(null, {});

                const tokens = assetIssue
                    .map((token) => {
                        return this._parseToken(token);
                    })
                    .reduce((tokens, token) => {
                        return (tokens[token.name] = token), tokens;
                    }, {});

                callback(null, tokens);
            })
            .catch((err) => callback(err));
    }

    // FIXME: any
    getTokenFromID(
        tokenID: string | number,
        callback?: undefined,
    ): Promise<any>;
    getTokenFromID(tokenID: string | number, callback: _CallbackT<any>): void;
    getTokenFromID(
        tokenID: string | number,
        callback?: _CallbackT<any>,
    ): void | Promise<any> {
        if (!callback) return this.injectPromise(this.getTokenFromID, tokenID);

        if (utils.isInteger(tokenID)) tokenID = tokenID.toString();

        if (!utils.isString(tokenID) || !tokenID.length)
            return callback('Invalid token ID provided');

        this.tronWeb.fullNode
            .request(
                'wallet/getassetissuebyname',
                { value: this.tronWeb.fromUtf8(tokenID) },
                'post',
            )
            .then((token) => {
                if (!token.name) return callback('Token does not exist');

                callback(null, this._parseToken(token));
            })
            .catch((err) => callback(err));
    }

    listNodes(callback?: undefined): Promise<string[]>;
    listNodes(callback: _CallbackT<any>): void;
    listNodes(callback?: _CallbackT<any>): void | Promise<string[]> {
        if (!callback) return this.injectPromise(this.listNodes);

        this.tronWeb.fullNode
            .request('wallet/listnodes')
            .then(
                ({
                    nodes = [],
                }: {
                    nodes: { address: { host: string; port: number } }[];
                }) => {
                    callback(
                        null,
                        nodes.map(
                            ({ address: { host, port } }) =>
                                `${this.tronWeb.toUtf8(host)}:${port}`,
                        ),
                    );
                },
            )
            .catch((err) => callback(err));
    }

    getBlockRange(start: number): Promise<any[]>;
    getBlockRange(start: _CallbackT<any>): void;
    getBlockRange(start: number, end: number): Promise<any[]>;
    getBlockRange(start: number, end: _CallbackT<any>): void;
    getBlockRange(
        start: number,
        end: number | null | undefined,
        callback: _CallbackT<any>,
    ): void;
    getBlockRange(
        start: number | _CallbackT<any> = 0,
        end: number | null | _CallbackT<any> = 30,
        callback?: _CallbackT<any>,
    ): void | Promise<any[]> {
        if (utils.isFunction(end)) {
            if (utils.isFunction(start))
                throw new TypeError('Two callbacks passed');
            return this.getBlockRange(start, 30, end);
        }

        if (utils.isFunction(start)) return this.getBlockRange(0, end, start);

        if (!callback)
            return this.injectPromise(this.getBlockRange, start, end);

        if (!utils.isInteger(start) || start < 0)
            return callback('Invalid start of range provided');

        if (!utils.isInteger(end) || end <= start)
            return callback('Invalid end of range provided');

        this.tronWeb.fullNode
            .request(
                'wallet/getblockbylimitnext',
                {
                    startNum: parseInt(start.toString()),
                    endNum: parseInt(end.toString()) + 1,
                },
                'post',
            )
            .then(({ block = [] }) => {
                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    listSuperRepresentatives(callback?: undefined): Promise<any[]>;
    listSuperRepresentatives(callback: _CallbackT<any>): void;
    listSuperRepresentatives(
        callback?: _CallbackT<any>,
    ): void | Promise<any[]> {
        if (!callback) return this.injectPromise(this.listSuperRepresentatives);

        this.tronWeb.fullNode
            .request('wallet/listwitnesses')
            .then(({ witnesses = [] }) => {
                callback(null, witnesses);
            })
            .catch((err) => callback(err));
    }

    listTokens(limit: number): Promise<IToken[]>;
    listTokens(limit: _CallbackT<any>): void;
    listTokens(limit: number, offset: number): Promise<IToken[]>;
    listTokens(limit: number, offset: _CallbackT<any>): void;
    listTokens(
        limit: number,
        offset: number | null | undefined,
        callback: _CallbackT<any>,
    ): void;
    listTokens(
        limit: number | _CallbackT<any> = 0,
        offset: number | null | _CallbackT<any> = 0,
        callback?: _CallbackT<any>,
    ): void | Promise<IToken[]> {
        if (utils.isFunction(offset)) {
            if (utils.isFunction(limit))
                throw new TypeError('Two callbacks passed');
            return this.listTokens(limit, 30, offset);
        }

        if (utils.isFunction(limit)) return this.listTokens(0, offset, limit);

        if (!callback)
            return this.injectPromise(this.listTokens, limit, offset);

        if (!utils.isInteger(limit) || limit < 0 || (offset && limit < 1))
            return callback('Invalid limit provided');

        if (!utils.isInteger(offset) || offset < 0)
            return callback('Invalid offset provided');

        if (!limit) {
            return this.tronWeb.fullNode
                .request('wallet/getassetissuelist')
                .then(({ assetIssue = [] }: { assetIssue: IToken[] }) => {
                    callback(
                        null,
                        assetIssue.map((token) => this._parseToken(token)),
                    );
                })
                .catch((err) => callback(err));
        }

        this.tronWeb.fullNode
            .request(
                'wallet/getpaginatedassetissuelist',
                {
                    offset: parseInt(offset.toString()),
                    limit: parseInt(limit.toString()),
                },
                'post',
            )
            .then(({ assetIssue = [] }) => {
                callback(
                    null,
                    assetIssue.map((token) => this._parseToken(token)),
                );
            })
            .catch((err) => callback(err));
    }

    timeUntilNextVoteCycle(callback?: undefined): Promise<number>;
    timeUntilNextVoteCycle(callback: _CallbackT<any>): void;
    timeUntilNextVoteCycle(callback?: _CallbackT<any>): void | Promise<number> {
        if (!callback) return this.injectPromise(this.timeUntilNextVoteCycle);

        this.tronWeb.fullNode
            .request('wallet/getnextmaintenancetime')
            .then(({ num = -1 }) => {
                if (num === -1)
                    return callback('Failed to get time until next vote cycle');

                callback(null, Math.floor(num / 1000));
            })
            .catch((err) => callback(err));
    }

    getContract(contractAddress: string, callback?: undefined): Promise<any>;
    getContract(contractAddress: string, callback: _CallbackT<any>): void;
    getContract(
        contractAddress: string,
        callback?: _CallbackT<any>,
    ): void | Promise<any> {
        if (!callback)
            return this.injectPromise(this.getContract, contractAddress);

        if (!this.tronWeb.isAddress(contractAddress))
            return callback('Invalid contract address provided');

        if (this.cache.contracts[contractAddress]) {
            callback(null, this.cache.contracts[contractAddress]);
            return undefined;
        }

        contractAddress = this.tronWeb.address.toHex(contractAddress);

        this.tronWeb.fullNode
            .request('wallet/getcontract', { value: contractAddress })
            .then((contract) => {
                if (contract.Error) return callback('Contract does not exist');
                this.cache.contracts[contractAddress] = contract;
                callback(null, contract);
            })
            .catch((err) => callback(err));
    }

    async verifyMessage(
        message: string,
        signature: string,
        address: string,
    ): Promise<boolean>;
    async verifyMessage(
        message: string,
        signature: string,
        address: _CallbackT<any>,
    ): Promise<void>;
    async verifyMessage(
        message: string,
        signature: string,
        address: string,
        useTronHeader: boolean,
    ): Promise<boolean>;
    async verifyMessage(
        message: string,
        signature: string,
        address: string,
        useTronHeader: _CallbackT<any>,
    ): Promise<void>;
    async verifyMessage(
        message: string,
        signature: string,
        address: string,
        useTronHeader: boolean | undefined,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async verifyMessage(
        message: string,
        signature: string,
        address: string | _CallbackT<any> = this.tronWeb.defaultAddress.base58,
        useTronHeader: boolean | _CallbackT<any> = true,
        callback?: _CallbackT<any>,
    ): Promise<void | boolean> {
        if (utils.isFunction(address)) {
            if (utils.isFunction(useTronHeader))
                throw new TypeError('Two callbacks passed');
            return this.verifyMessage(
                message,
                signature,
                this.tronWeb.defaultAddress.hex,
                true,
                address,
            );
        }

        if (utils.isFunction(useTronHeader)) {
            return this.verifyMessage(
                message,
                signature,
                address,
                true,
                useTronHeader,
            );
        }

        if (!callback) {
            return this.injectPromise(
                this.verifyMessage,
                message,
                signature,
                address,
                useTronHeader,
            );
        }

        if (!utils.isHex(message))
            return callback('Expected hex message input');

        if (Trx.verifySignature(message, address, signature, useTronHeader))
            return callback(null, true);

        callback('Signature does not match');
    }

    static verifySignature(
        message,
        address,
        signature,
        useTronHeader = true,
    ): boolean {
        message = message.replace(/^0x/, '');
        signature = signature.replace(/^0x/, '');
        const messageBytes = [
            ...toUtf8Bytes(
                useTronHeader ? TRX_MESSAGE_HEADER : ETH_MESSAGE_HEADER,
            ),
            ...utils.code.hexStr2byteArray(message),
        ];

        const messageDigest = keccak256(messageBytes);
        const recovered = recoverAddress(messageDigest, {
            recoveryParam: signature.substring(128, 130) === '1c' ? 1 : 0,
            r: '0x' + signature.substring(0, 64),
            s: '0x' + signature.substring(64, 128),
        });

        const tronAddress = ADDRESS_PREFIX + recovered.substr(2);
        const base58Address = TronWeb.address.fromHex(tronAddress);

        return base58Address === TronWeb.address.fromHex(address);
    }

    verifyMessageV2(
        message: string,
        signature: string,
        options: _CallbackT<any>,
        callback?: undefined,
    ): void;
    verifyMessageV2(
        message: string,
        signature: string,
        options: _PureObject,
        callback?: undefined,
    ): Promise<string>;
    verifyMessageV2(
        message: string,
        signature: string,
        options: _PureObject | _CallbackT<any>,
        callback: _CallbackT<any>,
    ): void;
    verifyMessageV2(
        message: string,
        signature: string,
        options: _PureObject | _CallbackT<any> = {},
        callback?: _CallbackT<any>,
    ): void | Promise<string> {
        if (utils.isFunction(options))
            return this.verifyMessageV2(message, signature, {}, options);

        if (!callback) {
            return this.injectPromise(
                this.verifyMessageV2,
                message,
                signature,
                options,
            );
        }

        try {
            const base58Address = Trx.verifyMessageV2(message, signature);
            callback(null, base58Address);
        } catch (ex) {
            callback(ex);
        }
    }

    static verifyMessageV2(message: string, signature: string): string {
        return utils.message.verifyMessage(message, signature);
    }

    verifyTypedData(
        domain: string,
        types: string[],
        value: any,
        signature: string,
    ): Promise<boolean>;
    verifyTypedData(
        domain: string,
        types: string[],
        value: any,
        signature: string,
        address: _CallbackT<any>,
    ): void;
    verifyTypedData(
        domain: string,
        types: string[],
        value: any,
        signature: string,
        address: string,
        callback?: undefined,
    ): Promise<boolean>;
    verifyTypedData(
        domain: string,
        types: string[],
        value: any,
        signature: string,
        address: string,
        callback: _CallbackT<any>,
    ): void;
    verifyTypedData(
        domain: string,
        types: string[],
        value: any,
        signature: string,
        address: string | _CallbackT<any> = this.tronWeb.defaultAddress.base58,
        callback?: _CallbackT<any>,
    ): void | Promise<boolean> {
        if (utils.isFunction(address)) {
            return this.verifyTypedData(
                domain,
                types,
                value,
                signature,
                this.tronWeb.defaultAddress.base58,
                address,
            );
        }

        if (!callback) {
            return this.injectPromise(
                this.verifyTypedData,
                domain,
                types,
                value,
                signature,
                address,
            );
        }

        if (Trx.verifyTypedData(domain, types, value, signature, address))
            return callback(null, true);

        callback('Signature does not match');
    }

    static verifyTypedData(
        domain: string,
        types: string[],
        value: any,
        signature: string,
        address: string,
    ): boolean {
        signature = signature.replace(/^0x/, '');

        const messageDigest = utils._TypedDataEncoder.hash(
            domain,
            types,
            value,
        );
        const recovered = recoverAddress(messageDigest, {
            recoveryParam: signature.substring(128, 130) === '1c' ? 1 : 0,
            r: '0x' + signature.substring(0, 64),
            s: '0x' + signature.substring(64, 128),
        });

        const tronAddress = ADDRESS_PREFIX + recovered.substr(2);
        const base58Address = TronWeb.address.fromHex(tronAddress);

        return base58Address === TronWeb.address.fromHex(address);
    }

    async sign(
        transaction: string | ITransaction,
        privateKey?: string,
    ): Promise<ITransaction>;
    async sign(
        transaction: string | ITransaction,
        privateKey: _CallbackT<any>,
    ): Promise<void>;
    async sign(
        transaction: string | ITransaction,
        privateKey: string,
        useTronHeader: boolean,
    ): Promise<ITransaction>;
    async sign(
        transaction: string | ITransaction,
        privateKey: string,
        useTronHeader: _CallbackT<any>,
    ): Promise<void>;
    async sign(
        transaction: string | ITransaction,
        privateKey: string,
        useTronHeader: boolean,
        multisig: boolean,
    ): Promise<ITransaction>;
    async sign(
        transaction: string | ITransaction,
        privateKey: string,
        useTronHeader: boolean,
        multisig: _CallbackT<any>,
    ): Promise<void>;
    async sign(
        transaction: string | ITransaction,
        privateKey: string,
        useTronHeader: boolean,
        multisig: boolean,
        callback?: undefined,
    ): Promise<ITransaction>;
    async sign(
        transaction: string | ITransaction,
        privateKey: string,
        useTronHeader: boolean,
        multisig: boolean,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async sign(
        transaction: string | ITransaction,
        privateKey: string | _CallbackT<any> = this.tronWeb.defaultAddress.hex,
        useTronHeader: boolean | _CallbackT<any> = false,
        multisig: boolean | _CallbackT<any> = false,
        callback?: _CallbackT<any>,
    ): Promise<void | ITransaction> {
        if (utils.isFunction(multisig)) {
            if (utils.isFunction(useTronHeader) || utils.isFunction(privateKey))
                throw new TypeError('Two or more callbacks passed');
            return this.sign(
                transaction,
                privateKey,
                useTronHeader,
                false,
                multisig,
            );
        }

        if (utils.isFunction(useTronHeader)) {
            if (utils.isFunction(privateKey))
                throw new TypeError('Two callbacks passed');
            return this.sign(
                transaction,
                privateKey,
                true,
                false,
                useTronHeader,
            );
        }

        if (utils.isFunction(privateKey)) {
            return this.sign(
                transaction,
                this.tronWeb.defaultPrivateKey,
                true,
                false,
                privateKey,
            );
        }

        if (!callback) {
            return this.injectPromise(
                this.sign,
                transaction,
                privateKey,
                useTronHeader,
                multisig,
            );
        }

        // Message signing
        if (utils.isString(transaction)) {
            if (!utils.isHex(transaction))
                return callback('Expected hex message input');

            try {
                const signatureHex = Trx.signString(
                    transaction,
                    privateKey,
                    useTronHeader,
                );
                return callback(null, signatureHex);
            } catch (ex) {
                callback(ex);
            }
        }

        if (!utils.isObject(transaction))
            return callback('Invalid transaction provided');

        if (!multisig && transaction.signature)
            return callback('Transaction is already signed');

        try {
            if (!multisig) {
                const address = this.tronWeb.address
                    .toHex(this.tronWeb.address.fromPrivateKey(privateKey))
                    .toLowerCase();

                if (
                    address !==
                    this.tronWeb.address.toHex(
                        transaction.raw_data.contract[0].parameter.value
                            .owner_address,
                    )
                ) {
                    return callback(
                        'Private key does not match address in transaction',
                    );
                }
            }
            return callback(
                null,
                utils.crypto.signTransaction(privateKey, transaction),
            );
        } catch (ex) {
            callback(ex);
        }
    }

    static signString(
        message: string,
        privateKey: string,
        useTronHeader = true,
    ): string {
        message = message.replace(/^0x/, '');
        const value = {
            toHexString: function () {
                return '0x' + privateKey;
            },
            value: privateKey,
        };
        const signingKey = new SigningKey(value);
        const messageBytes = [
            ...toUtf8Bytes(
                useTronHeader ? TRX_MESSAGE_HEADER : ETH_MESSAGE_HEADER,
            ),
            ...utils.code.hexStr2byteArray(message),
        ];
        const messageDigest = keccak256(messageBytes);
        const signature = signingKey.signDigest(messageDigest);
        const signatureHex = [
            '0x',
            signature.r.substring(2),
            signature.s.substring(2),
            Number(signature.v).toString(16),
        ].join('');
        return signatureHex;
    }

    /**
     * sign message v2 for verified header length
     *
     * @param {message to be signed, should be Bytes or string} message
     * @param {privateKey for signature} privateKey
     * @param {reserved} options
     * @param {callback function} callback
     */
    // FIXME: Bytes?
    signMessageV2(message: string, privateKey: string): Promise<string>;
    signMessageV2(message: string, privateKey: _CallbackT<any>): void;
    signMessageV2(
        message: string,
        privateKey: string,
        options: _PureObject,
    ): Promise<string>;
    signMessageV2(
        message: string,
        privateKey: string,
        options: _CallbackT<any>,
    ): void;
    signMessageV2(
        message: string,
        privateKey: string,
        options: _PureObject | undefined,
        callback: _CallbackT<any>,
    ): void;
    signMessageV2(
        message: string,
        privateKey: string | _CallbackT<any> = this.tronWeb.defaultPrivateKey,
        options: _PureObject | _CallbackT<any> = {},
        callback?: _CallbackT<any>,
    ): void | Promise<string> {
        if (utils.isFunction(options)) {
            if (utils.isFunction(privateKey))
                throw new TypeError('Two callbacks passed');
            return this.signMessageV2(message, privateKey, {}, options);
        }

        if (utils.isFunction(privateKey)) {
            return this.signMessageV2(
                message,
                this.tronWeb.defaultPrivateKey,
                options,
                privateKey,
            );
        }

        if (!callback)
            return this.injectPromise(this.signMessageV2, message, privateKey);

        try {
            const signatureHex = Trx.signMessageV2(message, privateKey);
            return callback(null, signatureHex);
        } catch (ex) {
            callback(ex);
        }
    }

    static signMessageV2(message: string, privateKey: string): string {
        return utils.message.signMessage(message, privateKey);
    }

    _signTypedData(
        domain: string,
        types: string[],
        value: any,
    ): Promise<string>;
    _signTypedData(
        domain: string,
        types: string[],
        value: any,
        privateKey: _CallbackT<any>,
    ): void;
    _signTypedData(
        domain: string,
        types: string[],
        value: any,
        privateKey: string,
        callback?: undefined,
    ): Promise<string>;
    _signTypedData(
        domain: string,
        types: string[],
        value: any,
        privateKey: string,
        callback: _CallbackT<any>,
    ): void;
    _signTypedData(
        domain: string,
        types: string[],
        value: any,
        privateKey: string | _CallbackT<any> = this.tronWeb.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): void | Promise<string> {
        if (utils.isFunction(privateKey)) {
            return this._signTypedData(
                domain,
                types,
                value,
                this.tronWeb.defaultPrivateKey,
                privateKey,
            );
        }

        if (!callback) {
            return this.injectPromise(
                this._signTypedData,
                domain,
                types,
                value,
                privateKey,
            );
        }

        try {
            const signatureHex = Trx._signTypedData(
                domain,
                types,
                value,
                privateKey,
            );
            return callback(null, signatureHex);
        } catch (ex) {
            callback(ex);
        }
    }

    static _signTypedData(
        domain: string,
        types: string[],
        value: any,
        privateKey: string,
    ): string {
        return utils.crypto._signTypedData(domain, types, value, privateKey);
    }

    async multiSign(
        transaction: ITransaction,
        privateKey: string,
    ): Promise<string>;
    async multiSign(
        transaction: ITransaction,
        privateKey: _CallbackT<any>,
    ): Promise<void>;
    async multiSign(
        transaction: ITransaction,
        privateKey: string,
        permissionId: number,
    ): Promise<string>;
    async multiSign(
        transaction: ITransaction,
        privateKey: string,
        permissionId: _CallbackT<any>,
    ): Promise<void>;
    async multiSign(
        transaction: ITransaction,
        privateKey: string,
        permissionId: number | undefined,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async multiSign(
        transaction: ITransaction,
        privateKey: string | _CallbackT<any> = this.tronWeb.defaultPrivateKey,
        permissionId: number | _CallbackT<any> = 0,
        callback?: _CallbackT<any>,
    ): Promise<void | string> {
        if (utils.isFunction(permissionId)) {
            if (utils.isFunction(privateKey))
                throw new TypeError('Two callbacks passed');
            return this.multiSign(transaction, privateKey, 0, permissionId);
        }
        if (utils.isFunction(privateKey)) {
            return this.multiSign(
                transaction,
                this.tronWeb.defaultPrivateKey,
                0,
                privateKey,
            );
        }

        if (!callback) {
            return this.injectPromise(
                this.multiSign,
                transaction,
                privateKey,
                permissionId,
            );
        }

        if (
            !utils.isObject(transaction) ||
            !transaction.raw_data ||
            !transaction.raw_data.contract
        )
            return callback('Invalid transaction provided');

        // If owner permission or permission id exists in transaction, do sign directly
        // If no permission id inside transaction or user passes permission id,
        // use old way to reset permission id
        if (
            !transaction.raw_data.contract[0].Permission_id &&
            permissionId > 0
        ) {
            // set permission id
            transaction.raw_data.contract[0].Permission_id = permissionId;

            // check if private key insides permission list
            const address = this.tronWeb.address
                .toHex(this.tronWeb.address.fromPrivateKey(privateKey))
                .toLowerCase();
            const signWeight = await this.getSignWeight(
                transaction,
                permissionId,
            );

            if (signWeight.result.code === 'PERMISSION_ERROR')
                return callback(signWeight.result.message);

            let foundKey = false;
            signWeight.permission.keys.map((key) => {
                if (key.address === address) foundKey = true;
            });

            if (!foundKey)
                return callback(privateKey + ' has no permission to sign');

            if (
                signWeight.approved_list &&
                signWeight.approved_list.indexOf(address) !== -1
            )
                return callback(privateKey + ' already sign transaction');

            // reset transaction
            if (signWeight.transaction && signWeight.transaction.transaction) {
                transaction = signWeight.transaction.transaction;
                if (permissionId > 0) {
                    transaction.raw_data.contract[0].Permission_id =
                        permissionId;
                }
            } else {
                return callback('Invalid transaction provided');
            }
        }

        // sign
        try {
            return callback(
                null,
                utils.crypto.signTransaction(privateKey, transaction),
            );
        } catch (ex) {
            callback(ex);
        }
    }

    async getApprovedList(
        transaction: ITransaction,
        callback?: undefined,
    ): Promise<any>;
    async getApprovedList(
        transaction: ITransaction,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async getApprovedList(
        transaction: ITransaction,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (!callback)
            return this.injectPromise(this.getApprovedList, transaction);

        if (!utils.isObject(transaction))
            return callback('Invalid transaction provided');

        this.tronWeb.fullNode
            .request('wallet/getapprovedlist', transaction, 'post')
            .then((result) => {
                callback(null, result);
            })
            .catch((err) => callback(err));
    }

    async getSignWeight(
        transaction: ITransaction,
        permissionId?: _CallbackT<any>,
        callback?: undefined,
    ): Promise<void>;
    async getSignWeight(
        transaction: ITransaction,
        permissionId?: number,
        callback?: undefined,
    ): Promise<ISignWeight>;
    async getSignWeight(
        transaction: ITransaction,
        permissionId: number | undefined,
        callback?: _CallbackT<any>,
    ): Promise<void>;
    async getSignWeight(
        transaction: ITransaction,
        permissionId?: number | _CallbackT<any>,
        callback?: _CallbackT<any>,
    ): Promise<void | ISignWeight> {
        if (utils.isFunction(permissionId))
            return this.getSignWeight(transaction, undefined, permissionId);

        if (!callback) {
            return this.injectPromise(
                this.getSignWeight,
                transaction,
                permissionId,
            );
        }

        if (
            !utils.isObject(transaction) ||
            !transaction.raw_data ||
            !transaction.raw_data.contract
        )
            return callback('Invalid transaction provided');

        if (utils.isInteger(permissionId)) {
            transaction.raw_data.contract[0].Permission_id = parseInt(
                permissionId.toString(),
            );
        } else if (
            typeof transaction.raw_data.contract[0].Permission_id !== 'number'
        ) {
            transaction.raw_data.contract[0].Permission_id = 0;
        }

        if (!utils.isObject(transaction))
            return callback('Invalid transaction provided');

        this.tronWeb.fullNode
            .request('wallet/getsignweight', transaction, 'post')
            .then((result) => {
                callback(null, result);
            })
            .catch((err) => callback(err));
    }

    sendRawTransaction(
        signedTransaction: ITransaction,
        options?: _CallbackT<any>,
        callback?: undefined,
    ): void;
    sendRawTransaction(
        signedTransaction: ITransaction,
        options?: _PureObject,
        callback?: undefined,
    ): Promise<any>;
    sendRawTransaction(
        signedTransaction: ITransaction,
        options: _PureObject | undefined,
        callback?: _CallbackT<any>,
    ): void;
    sendRawTransaction(
        signedTransaction: ITransaction,
        options?: _PureObject | _CallbackT<any>,
        callback?: _CallbackT<any>,
    ): void | Promise<any> {
        if (utils.isFunction(options))
            return this.sendRawTransaction(signedTransaction, {}, options);

        if (!callback) {
            return this.injectPromise(
                this.sendRawTransaction,
                signedTransaction,
                options,
            );
        }

        if (!utils.isObject(signedTransaction))
            return callback('Invalid transaction provided');

        if (!utils.isObject(options))
            return callback('Invalid options provided');

        if (
            !signedTransaction.signature ||
            !utils.isArray(signedTransaction.signature)
        )
            return callback('Transaction is not signed');

        this.tronWeb.fullNode
            .request('wallet/broadcasttransaction', signedTransaction, 'post')
            .then((result) => {
                if (result.result) result.transaction = signedTransaction;
                callback(null, result);
            })
            .catch((err) => callback(err));
    }

    sendHexTransaction(
        signedHexTransaction: ITransaction,
        options?: _CallbackT<any>,
        callback?: undefined,
    ): void;
    sendHexTransaction(
        signedHexTransaction: ITransaction,
        options?: _PureObject,
        callback?: undefined,
    ): Promise<any>;
    sendHexTransaction(
        signedHexTransaction: ITransaction,
        options: _PureObject | undefined,
        callback?: _CallbackT<any>,
    ): void;
    sendHexTransaction(
        signedHexTransaction: ITransaction,
        options?: _PureObject | _CallbackT<any>,
        callback?: _CallbackT<any>,
    ): void | Promise<any> {
        if (utils.isFunction(options))
            return this.sendHexTransaction(signedHexTransaction, {}, options);

        if (!callback) {
            return this.injectPromise(
                this.sendHexTransaction,
                signedHexTransaction,
                options,
            );
        }

        if (!utils.isHex(signedHexTransaction))
            return callback('Invalid hex transaction provided');

        if (!utils.isObject(options))
            return callback('Invalid options provided');

        const params = {
            transaction: signedHexTransaction,
        };

        this.tronWeb.fullNode
            .request('wallet/broadcasthex', params, 'post')
            .then((result) => {
                if (result.result) {
                    result.transaction = JSON.parse(result.transaction);
                    result.hexTransaction = signedHexTransaction;
                }
                callback(null, result);
            })
            .catch((err) => callback(err));
    }

    async sendTransaction(
        to: string,
        amount: number,
        options?: _CallbackT<any>,
        callback?: undefined,
    ): Promise<void>;
    async sendTransaction(
        to: string,
        amount: number,
        options?: string | _PureObject,
        callback?: undefined,
    ): Promise<any>;
    async sendTransaction(
        to: string,
        amount: number,
        options: string | _PureObject | undefined,
        callback?: _CallbackT<any>,
    ): Promise<void>;
    async sendTransaction(
        to: string,
        amount: number,
        options?: string | _PureObject | _CallbackT<any>,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (utils.isFunction(options))
            return this.sendTransaction(to, amount, {}, options);

        if (typeof options === 'string') options = { privateKey: options };

        if (!callback) {
            return this.injectPromise(
                this.sendTransaction,
                to,
                amount,
                options,
            );
        }

        if (!this.tronWeb.isAddress(to))
            return callback('Invalid recipient provided');

        if (!utils.isInteger(amount) || amount <= 0)
            return callback('Invalid amount provided');

        const options2:
            | { privateKey: string; address: string | undefined }
            | { privateKey: string | undefined; address: string } = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options2.privateKey && !options2.address) {
            return callback(
                'Function requires either a private key or address to be set',
            );
        }

        try {
            const address = options2.privateKey
                ? this.tronWeb.address.fromPrivateKey(options2.privateKey)
                : options2.address;
            const transaction = await this.tronWeb.transactionBuilder.sendTrx(
                to,
                amount,
                address,
            );
            const signedTransaction = await this.sign(
                transaction,
                options2.privateKey || undefined,
            );
            const result = await this.sendRawTransaction(signedTransaction);

            return callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    async sendToken(
        to: string,
        amount: number,
        tokenID: string | number,
        options?: _CallbackT<any>,
        callback?: undefined,
    ): Promise<void>;
    async sendToken(
        to: string,
        amount: number,
        tokenID: string | number,
        options?: string | _PureObject,
        callback?: undefined,
    ): Promise<any>;
    async sendToken(
        to: string,
        amount: number,
        tokenID: string | number,
        options: string | _PureObject | undefined,
        callback?: _CallbackT<any>,
    ): Promise<void>;
    async sendToken(
        to: string,
        amount: number,
        tokenID: string | number,
        options?: string | _PureObject | _CallbackT<any>,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (utils.isFunction(options))
            return this.sendToken(to, amount, tokenID, {}, options);

        if (typeof options === 'string') options = { privateKey: options };

        if (!callback) {
            return this.injectPromise(
                this.sendToken,
                to,
                amount,
                tokenID,
                options,
            );
        }

        if (!this.tronWeb.isAddress(to))
            return callback('Invalid recipient provided');

        if (!utils.isInteger(amount) || amount <= 0)
            return callback('Invalid amount provided');

        if (utils.isInteger(tokenID)) tokenID = tokenID.toString();

        if (!utils.isString(tokenID))
            return callback('Invalid token ID provided');

        const options2:
            | { privateKey: string; address: string | undefined }
            | { privateKey: string | undefined; address: string } = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options2.privateKey && !options2.address) {
            return callback(
                'Function requires either a private key or address to be set',
            );
        }

        try {
            const address = options2.privateKey
                ? this.tronWeb.address.fromPrivateKey(options2.privateKey)
                : options2.address;
            const transaction = await this.tronWeb.transactionBuilder.sendToken(
                to,
                amount,
                tokenID,
                address,
            );
            const signedTransaction = await this.sign(
                transaction,
                options2.privateKey || undefined,
            );
            const result = await this.sendRawTransaction(signedTransaction);

            return callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    /**
     * Freezes an amount of TRX.
     * Will give bandwidth OR Energy and TRON Power(voting rights)
     * to the owner of the frozen tokens.
     *
     * @param amount - is the number of frozen trx
     * @param duration - is the duration in days to be frozen
     * @param resource - is the type, must be either "ENERGY" or "BANDWIDTH"
     * @param options
     * @param callback
     */
    // async freezeBalance(amount: number): Promise<any[]>;
    async freezeBalance(amount: number, duration?: number): Promise<any[]>;
    async freezeBalance(
        amount: number,
        duration: _CallbackT<any>,
    ): Promise<void>;
    async freezeBalance(
        amount: number,
        duration: number,
        resource?: ResourceT,
    ): Promise<any[]>;
    async freezeBalance(
        amount: number,
        duration: number,
        resource: _CallbackT<any>,
    ): Promise<void>;
    // async freezeBalance(
    //     amount: number,
    //     duration: number,
    //     resource: ResourceT,
    //     options: _PureObject
    // ): Promise<any[]>;
    async freezeBalance(
        amount: number,
        duration: number,
        resource: ResourceT,
        options: _CallbackT<any>,
    ): Promise<void>;
    async freezeBalance(
        amount: number,
        duration: number,
        resource: ResourceT,
        options: _PureObject,
        receiverAddress?: string,
    ): Promise<any[]>;
    async freezeBalance(
        amount: number,
        duration: number,
        resource: ResourceT,
        options: _PureObject,
        receiverAddress: _CallbackT<any>,
    ): Promise<void>;
    async freezeBalance(
        amount: number,
        duration: number,
        resource: ResourceT,
        options: _PureObject,
        receiverAddress: string | undefined,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async freezeBalance(
        amount: number,
        duration: number | _CallbackT<any> = 3,
        resource: ResourceT | _CallbackT<any> = 'BANDWIDTH',
        options: _PureObject | _CallbackT<any> = {},
        receiverAddress: string | undefined | _CallbackT<any> = undefined,
        callback?: _CallbackT<any>,
    ): Promise<void | any[]> {
        if (utils.isFunction(receiverAddress)) {
            if (
                utils.isFunction(options) ||
                utils.isFunction(duration) ||
                utils.isFunction(resource)
            )
                throw new TypeError('Two or more callbacks passed.');
            return this.freezeBalance(
                amount,
                duration,
                resource,
                options,
                undefined,
                receiverAddress,
            );
        }
        if (utils.isFunction(options)) {
            if (utils.isFunction(duration) || utils.isFunction(resource))
                throw new TypeError('Two or more callbacks passed.');
            return this.freezeBalance(
                amount,
                duration,
                resource,
                {},
                receiverAddress,
                options,
            );
        }
        if (utils.isFunction(resource)) {
            if (utils.isFunction(duration))
                throw new TypeError('Two or more callbacks passed.');
            return this.freezeBalance(
                amount,
                duration,
                'BANDWIDTH',
                options,
                receiverAddress,
                resource,
            );
        }
        if (utils.isFunction(duration)) {
            return this.freezeBalance(
                amount,
                3,
                resource,
                options,
                receiverAddress,
                duration,
            );
        }

        if (typeof options === 'string') options = { privateKey: options };

        if (!callback) {
            return this.injectPromise(
                this.freezeBalance,
                amount,
                duration,
                resource,
                options,
                receiverAddress,
            );
        }

        if (!['BANDWIDTH', 'ENERGY'].includes(resource)) {
            return callback(
                'Invalid resource provided: Expected "BANDWIDTH" or "ENERGY"',
            );
        }

        if (!utils.isInteger(amount) || amount <= 0)
            return callback('Invalid amount provided');

        if (!utils.isInteger(duration) || duration < 3)
            return callback('Invalid duration provided, minimum of 3 days');

        const options2:
            | { privateKey: string; address: string | undefined }
            | { privateKey: string | undefined; address: string } = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options2.privateKey && !options2.address) {
            return callback(
                'Function requires either a private key or address to be set',
            );
        }

        try {
            const address = options2.privateKey
                ? this.tronWeb.address.fromPrivateKey(options2.privateKey)
                : options2.address;
            const freezeBalance =
                await this.tronWeb.transactionBuilder.freezeBalance(
                    amount,
                    duration,
                    resource,
                    address,
                    receiverAddress,
                );
            const signedTransaction = await this.sign(
                freezeBalance,
                options2.privateKey || undefined,
            );
            const result = await this.sendRawTransaction(signedTransaction);

            return callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    /**
     * Unfreeze TRX that has passed the minimum freeze duration.
     * Unfreezing will remove bandwidth and TRON Power.
     *
     * @param resource - is the type, must be either "ENERGY" or "BANDWIDTH"
     * @param options
     * @param callback
     */
    // async unfreezeBalance(amount: number): Promise<any[]>;
    // async unfreezeBalance(amount: number, duration?: number): Promise<any[]>;
    // async unfreezeBalance(amount: number, duration: _CallbackT<any>): Promise<void>;
    async unfreezeBalance(resource?: ResourceT): Promise<any[]>;
    async unfreezeBalance(resource: _CallbackT<any>): Promise<void>;
    async unfreezeBalance(
        resource: ResourceT,
        options: _PureObject,
    ): Promise<any[]>;
    async unfreezeBalance(
        resource: ResourceT,
        options: _CallbackT<any>,
    ): Promise<void>;
    async unfreezeBalance(
        resource: ResourceT,
        options: _PureObject,
        receiverAddress?: string,
    ): Promise<any[]>;
    async unfreezeBalance(
        resource: ResourceT,
        options: _PureObject,
        receiverAddress: _CallbackT<any>,
    ): Promise<void>;
    async unfreezeBalance(
        resource: ResourceT,
        options: _PureObject,
        receiverAddress: string | undefined,
        callback: _CallbackT<any>,
    ): Promise<void>;
    async unfreezeBalance(
        resource: ResourceT | _CallbackT<any> = 'BANDWIDTH',
        options: _PureObject | _CallbackT<any> = {},
        receiverAddress: string | undefined | _CallbackT<any> = undefined,
        callback?: _CallbackT<any>,
    ): Promise<void | any[]> {
        if (utils.isFunction(receiverAddress)) {
            if (utils.isFunction(options) || utils.isFunction(resource))
                throw new TypeError('Two or more callbacks passed.');
            return this.unfreezeBalance(
                resource,
                options,
                undefined,
                receiverAddress,
            );
        }
        if (utils.isFunction(options)) {
            if (utils.isFunction(resource))
                throw new TypeError('Two or more callbacks passed.');
            return this.unfreezeBalance(resource, {}, receiverAddress, options);
        }
        if (utils.isFunction(resource)) {
            return this.unfreezeBalance(
                'BANDWIDTH',
                options,
                receiverAddress,
                resource,
            );
        }

        if (typeof options === 'string') options = { privateKey: options };

        if (!callback) {
            return this.injectPromise(
                this.unfreezeBalance,
                resource,
                options,
                receiverAddress,
            );
        }

        if (!['BANDWIDTH', 'ENERGY'].includes(resource)) {
            return callback(
                'Invalid resource provided: Expected "BANDWIDTH" or "ENERGY"',
            );
        }

        const options2:
            | { privateKey: string; address: string | undefined }
            | { privateKey: string | undefined; address: string } = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options2.privateKey && !options2.address) {
            return callback(
                'Function requires either a private key or address to be set',
            );
        }

        try {
            const address = options2.privateKey
                ? this.tronWeb.address.fromPrivateKey(options2.privateKey)
                : options2.address;
            const unfreezeBalance =
                await this.tronWeb.transactionBuilder.unfreezeBalance(
                    resource,
                    address,
                    receiverAddress,
                );
            const signedTransaction = await this.sign(
                unfreezeBalance,
                options2.privateKey || undefined,
            );
            const result = await this.sendRawTransaction(signedTransaction);

            return callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    /**
     * Modify account name
     * Note: Username is allowed to edit only once.
     *
     * @param privateKey - Account private Key
     * @param accountName - name of the account
     * @param callback
     *
     * @return modified Transaction Object
     */
    async updateAccount(
        accountName: string,
        options?: _CallbackT<any>,
        callback?: undefined,
    ): Promise<void>;
    async updateAccount(
        accountName: string,
        options?: _PureObject,
        callback?: undefined,
    ): Promise<any>;
    async updateAccount(
        accountName: string,
        options: _PureObject | undefined,
        callback?: _CallbackT<any>,
    ): Promise<void>;
    async updateAccount(
        accountName: string,
        options?: _PureObject | _CallbackT<any>,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (utils.isFunction(options))
            return this.updateAccount(accountName, {}, options);

        if (typeof options === 'string') options = { privateKey: options };

        if (!callback)
            return this.injectPromise(this.updateAccount, accountName, options);

        if (!utils.isString(accountName) || !accountName.length)
            return callback('Name must be a string');

        const options2:
            | { privateKey: string; address: string | undefined }
            | { privateKey: string | undefined; address: string } = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options2.privateKey && !options2.address) {
            return callback(
                'Function requires either a private key or address to be set',
            );
        }

        try {
            const address = options2.privateKey
                ? this.tronWeb.address.fromPrivateKey(options2.privateKey)
                : options2.address;
            const updateAccount =
                await this.tronWeb.transactionBuilder.updateAccount(
                    accountName,
                    address,
                );
            const signedTransaction = await this.sign(
                updateAccount,
                options2.privateKey || undefined,
            );
            const result = await this.sendRawTransaction(signedTransaction);

            return callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    signMessage: Trx['sign'] = this.sign.bind(this);
    sendAsset: Trx['sendToken'] = this.sendToken.bind(this);
    send: Trx['sendTransaction'] = this.sendTransaction.bind(this);
    sendTrx: Trx['sendTransaction'] = this.sendTransaction.bind(this);
    broadcast: Trx['sendRawTransaction'] = this.sendRawTransaction.bind(this);
    broadcastHex: Trx['sendHexTransaction'] =
        this.sendHexTransaction.bind(this);
    signTransaction: Trx['sign'] = this.sign.bind(this);

    /**
     * Gets a network modification proposal by ID.
     */
    getProposal(proposalID: number, callback?: undefined): Promise<IProposal>;
    getProposal(proposalID: number, callback: _CallbackT<any>): void;
    getProposal(
        proposalID: number,
        callback?: _CallbackT<any>,
    ): void | Promise<IProposal> {
        if (!callback) return this.injectPromise(this.getProposal, proposalID);

        if (!utils.isInteger(proposalID) || proposalID < 0)
            return callback('Invalid proposalID provided');

        this.tronWeb.fullNode
            .request(
                'wallet/getproposalbyid',
                { id: parseInt(proposalID.toString()) },
                'post',
            )
            .then((proposal) => {
                callback(null, proposal);
            })
            .catch((err) => callback(err));
    }

    /**
     * Lists all network modification proposals.
     */
    listProposals(callback?: undefined): Promise<IProposal[]>;
    listProposals(callback: _CallbackT<any>): void;
    listProposals(callback?: _CallbackT<any>): void | Promise<IProposal[]> {
        if (!callback) return this.injectPromise(this.listProposals);

        this.tronWeb.fullNode
            .request('wallet/listproposals', {}, 'post')
            .then(({ proposals = [] }: { proposals: IProposal[] }) => {
                callback(null, proposals);
            })
            .catch((err) => callback(err));
    }

    /**
     * Lists all parameters available for network modification proposals.
     */
    getChainParameters(callback?: undefined): Promise<any[]>;
    getChainParameters(callback: _CallbackT<any>): void;
    getChainParameters(callback?: _CallbackT<any>): void | Promise<any[]> {
        if (!callback) return this.injectPromise(this.getChainParameters);

        this.tronWeb.fullNode
            .request('wallet/getchainparameters', {}, 'post')
            .then(({ chainParameter = [] }) => {
                callback(null, chainParameter);
            })
            .catch((err) => callback(err));
    }

    /**
     * Get the account resources
     */
    getAccountResources(address: string, callback?: undefined): Promise<any[]>;
    getAccountResources(address: string, callback: _CallbackT<any>): void;
    getAccountResources(
        address: string,
        callback?: _CallbackT<any>,
    ): void | Promise<any[]> {
        if (!callback)
            return this.injectPromise(this.getAccountResources, address);

        if (!this.tronWeb.isAddress(address))
            return callback('Invalid address provided');

        this.tronWeb.fullNode
            .request(
                'wallet/getaccountresource',
                { address: this.tronWeb.address.toHex(address) },
                'post',
            )
            .then((resources) => {
                callback(null, resources);
            })
            .catch((err) => callback(err));
    }

    /**
     * Get the exchange ID.
     */
    getExchangeByID(
        exchangeID: number,
        callback?: undefined,
    ): Promise<IExchange>;
    getExchangeByID(exchangeID: number, callback: _CallbackT<any>): void;
    getExchangeByID(
        exchangeID: number,
        callback?: _CallbackT<any>,
    ): void | Promise<IExchange> {
        if (!callback)
            return this.injectPromise(this.getExchangeByID, exchangeID);

        if (!utils.isInteger(exchangeID) || exchangeID < 0)
            return callback('Invalid exchangeID provided');

        this.tronWeb.fullNode
            .request('wallet/getexchangebyid', { id: exchangeID }, 'post')
            .then((exchange) => {
                callback(null, exchange);
            })
            .catch((err) => callback(err));
    }

    /**
     * Lists the exchanges
     */
    listExchanges(callback?: undefined): Promise<IExchange[]>;
    listExchanges(callback: _CallbackT<any>): void;
    listExchanges(callback?: _CallbackT<any>): void | Promise<IExchange[]> {
        if (!callback) return this.injectPromise(this.listExchanges);

        this.tronWeb.fullNode
            .request('wallet/listexchanges', {}, 'post')
            .then(({ exchanges = [] }: { exchanges: IExchange[] }) => {
                callback(null, exchanges);
            }, 'post')
            .catch((err) => callback(err));
    }

    /**
     * Lists all network modification proposals.
     */
    listExchangesPaginated(limit: number): Promise<IToken[]>;
    listExchangesPaginated(limit: _CallbackT<any>): void;
    listExchangesPaginated(limit: number, offset: number): Promise<IToken[]>;
    listExchangesPaginated(limit: number, offset: _CallbackT<any>): void;
    listExchangesPaginated(
        limit: number,
        offset: number | null | undefined,
        callback: _CallbackT<any>,
    ): void;
    listExchangesPaginated(
        limit: number | _CallbackT<any> = 0,
        offset: number | null | _CallbackT<any> = 0,
        callback?: _CallbackT<any>,
    ): void | Promise<IToken[]> {
        if (utils.isFunction(offset)) {
            if (utils.isFunction(limit))
                throw new TypeError('Two callbacks passed');
            return this.listExchangesPaginated(limit, 30, offset);
        }
        if (utils.isFunction(limit))
            return this.listExchangesPaginated(0, offset, limit);

        if (!callback) {
            return this.injectPromise(
                this.listExchangesPaginated,
                limit,
                offset,
            );
        }

        this.tronWeb.fullNode
            .request(
                'wallet/getpaginatedexchangelist',
                { limit, offset },
                'post',
            )
            .then(({ exchanges = [] }) => {
                callback(null, exchanges);
            })
            .catch((err) => callback(err));
    }

    /**
     * Get info about thre node
     */
    getNodeInfo(callback?: undefined): Promise<any>;
    getNodeInfo(callback: _CallbackT<any>): void;
    getNodeInfo(callback?: _CallbackT<any>): void | Promise<any> {
        if (!callback) return this.injectPromise(this.getNodeInfo);

        this.tronWeb.fullNode
            .request('wallet/getnodeinfo', {}, 'post')
            .then((info) => {
                callback(null, info);
            }, 'post')
            .catch((err) => callback(err));
    }

    getTokenListByName(
        tokenID: string | number,
        callback?: undefined,
    ): Promise<IToken[]>;
    getTokenListByName(
        tokenID: string | number,
        callback: _CallbackT<any>,
    ): void;
    getTokenListByName(
        tokenID: string | number,
        callback?: _CallbackT<any>,
    ): void | Promise<IToken[]> {
        if (!callback)
            return this.injectPromise(this.getTokenListByName, tokenID);

        if (utils.isInteger(tokenID)) tokenID = tokenID.toString();

        if (!utils.isString(tokenID) || !tokenID.length)
            return callback('Invalid token ID provided');

        this.tronWeb.fullNode
            .request(
                'wallet/getassetissuelistbyname',
                { value: this.tronWeb.fromUtf8(tokenID) },
                'post',
            )
            .then((token: { assetIssue: IAssetIssue[] }) => {
                // FIXME: this is super weird and probably wrong
                if (Array.isArray(token.assetIssue)) {
                    callback(
                        null,
                        token.assetIssue.map((t) => this._parseToken(t)),
                    );
                    // @ts-ignore
                } else if (!token.name) {
                    return callback('Token does not exist');
                }

                // @ts-ignore
                callback(null, this._parseToken(token));
            })
            .catch((err) => callback(err));
    }

    getTokenByID(
        tokenID: string | number,
        callback?: undefined,
    ): Promise<IToken[]>;
    getTokenByID(tokenID: string | number, callback: _CallbackT<any>): void;
    getTokenByID(
        tokenID: string | number,
        callback?: _CallbackT<any>,
    ): void | Promise<IToken[]> {
        if (!callback) return this.injectPromise(this.getTokenByID, tokenID);

        if (utils.isInteger(tokenID)) tokenID = tokenID.toString();

        if (!utils.isString(tokenID) || !tokenID.length)
            return callback('Invalid token ID provided');

        this.tronWeb.fullNode
            .request('wallet/getassetissuebyid', { value: tokenID }, 'post')
            .then((token: IAssetIssue) => {
                if (!token.name) return callback('Token does not exist');

                callback(null, this._parseToken(token));
            })
            .catch((err) => callback(err));
    }

    async getReward(
        address: string,
        options: { confirmed?: boolean },
        callback?: undefined,
    ): Promise<number>;
    async getReward(
        address: string,
        options: { confirmed?: boolean },
        callback: _CallbackT<any>,
    ): Promise<void>;
    async getReward(
        address: string,
        options: { confirmed?: boolean },
        callback?: _CallbackT<any>,
    ): Promise<void | number> {
        options.confirmed = true;
        if (callback) return this._getReward(address, options, callback);
        return this._getReward(address, options, callback);
    }

    async getUnconfirmedReward(
        address: string,
        options: { confirmed?: boolean },
        callback?: undefined,
    ): Promise<number>;
    async getUnconfirmedReward(
        address: string,
        options: { confirmed?: boolean },
        callback: _CallbackT<any>,
    ): Promise<void>;
    async getUnconfirmedReward(
        address: string,
        options: { confirmed?: boolean },
        callback?: _CallbackT<any>,
    ): Promise<void | number> {
        options.confirmed = false;
        if (callback) return this._getReward(address, options, callback);
        return this._getReward(address, options, callback);
    }

    async getBrokerage(
        address: string,
        options: { confirmed?: boolean },
        callback?: undefined,
    ): Promise<number>;
    async getBrokerage(
        address: string,
        options: { confirmed?: boolean },
        callback: _CallbackT<any>,
    ): Promise<void>;
    async getBrokerage(
        address: string,
        options: { confirmed?: boolean },
        callback?: _CallbackT<any>,
    ): Promise<void | number> {
        options.confirmed = true;
        if (callback) return this._getBrokerage(address, options, callback);
        return this._getBrokerage(address, options, callback);
    }

    async getUnconfirmedBrokerage(
        address: string,
        options: { confirmed?: boolean },
        callback?: undefined,
    ): Promise<number>;
    async getUnconfirmedBrokerage(
        address: string,
        options: { confirmed?: boolean },
        callback: _CallbackT<any>,
    ): Promise<void>;
    async getUnconfirmedBrokerage(
        address: string,
        options: { confirmed?: boolean },
        callback?: _CallbackT<any>,
    ): Promise<void | number> {
        options.confirmed = false;
        if (callback) return this._getBrokerage(address, options, callback);
        return this._getBrokerage(address, options, callback);
    }

    async _getReward(address: string): Promise<number>;
    async _getReward(address: { confirmed?: boolean }): Promise<number>;
    async _getReward(address: _CallbackT<any>): Promise<void>;
    async _getReward(
        address: string,
        options: { confirmed?: boolean },
        callback?: undefined,
    ): Promise<number>;
    async _getReward(address: string, options: _CallbackT<any>): Promise<void>;
    async _getReward(
        address: { confirmed?: boolean },
        options: _CallbackT<any>,
    ): Promise<number>;
    async _getReward(
        address: string,
        options: { confirmed?: boolean },
        callback: _CallbackT<any>,
    ): Promise<void>;
    async _getReward(
        address: string | { confirmed?: boolean } | _CallbackT<any> = this
            .tronWeb.defaultAddress.hex,
        options: { confirmed?: boolean } | _CallbackT<any> = {},
        callback?: _CallbackT<any>,
    ): Promise<void | number> {
        if (utils.isFunction(options)) {
            if (utils.isFunction(address)) {
                throw new TypeError('Two callbacks passed');
            } else if (utils.isString(address)) {
                return this._getReward(address, {}, options);
            } else {
                return this._getReward(
                    this.tronWeb.defaultAddress.hex,
                    address,
                    options,
                );
            }
        } else if (utils.isFunction(address)) {
            return this._getReward(
                this.tronWeb.defaultAddress.hex,
                {},
                address,
            );
        }

        if (!callback)
            return this.injectPromise(this._getReward, address, options);
        if (!utils.isString(address)) return callback('Invalid address.');

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

        const data = {
            address: toHex(address),
        };

        this.tronWeb[options.confirmed ? 'solidityNode' : 'fullNode']
            .request(
                `wallet${options.confirmed ? 'solidity' : ''}/getReward`,
                data,
                'post',
            )
            .then((result: { reward?: number } = {}) => {
                if (typeof result.reward === 'undefined')
                    return callback('Not found.');

                callback(null, result.reward);
            })
            .catch((err) => callback(err));
    }

    async _getBrokerage(address: string): Promise<number>;
    async _getBrokerage(address: { confirmed?: boolean }): Promise<number>;
    async _getBrokerage(address: _CallbackT<any>): Promise<void>;
    async _getBrokerage(
        address: string,
        options: { confirmed?: boolean },
        callback?: undefined,
    ): Promise<number>;
    async _getBrokerage(
        address: string,
        options: _CallbackT<any>,
    ): Promise<void>;
    async _getBrokerage(
        address: { confirmed?: boolean },
        options: _CallbackT<any>,
    ): Promise<number>;
    async _getBrokerage(
        address: string,
        options: { confirmed?: boolean },
        callback: _CallbackT<any>,
    ): Promise<void>;
    async _getBrokerage(
        address: string | { confirmed?: boolean } | _CallbackT<any> = this
            .tronWeb.defaultAddress.hex,
        options: { confirmed?: boolean } | _CallbackT<any> = {},
        callback?: _CallbackT<any>,
    ): Promise<void | number> {
        if (utils.isFunction(options)) {
            if (utils.isFunction(address)) {
                throw new TypeError('Two callbacks passed');
            } else if (utils.isString(address)) {
                return this._getBrokerage(address, {}, options);
            } else {
                return this._getBrokerage(
                    this.tronWeb.defaultAddress.hex,
                    address,
                    options,
                );
            }
        } else if (utils.isFunction(address)) {
            return this._getBrokerage(
                this.tronWeb.defaultAddress.hex,
                {},
                address,
            );
        }

        if (!callback)
            return this.injectPromise(this._getBrokerage, address, options);
        if (!utils.isString(address)) return callback('Invalid address.');

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

        const data = {
            address: toHex(address),
        };

        this.tronWeb[options.confirmed ? 'solidityNode' : 'fullNode']
            .request(
                `wallet${options.confirmed ? 'solidity' : ''}/getBrokerage`,
                data,
                'post',
            )
            .then((result: { brokerage?: number } = {}) => {
                if (typeof result.brokerage === 'undefined')
                    return callback('Not found.');

                callback(null, result.brokerage);
            })
            .catch((err) => callback(err));
    }
}
