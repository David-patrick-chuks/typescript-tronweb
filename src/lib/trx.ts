import TronWeb from '..';
import {WithTronwebAndInjectpromise} from '../../src/utils/_base';
import Validator from '../paramValidator';
import type {
    AccountResourceMessage as IAccountResource,
    BlockExtention as IBlockExtention,
    TransactionSignWeight as ISignWeight,
    TransactionApprovedList as ITransactionApprovedList,
    TransactionExtention as ITransactionExtention,
} from '../proto/api/api';
import type {
    Account as IAccount,
    ChainParameters_ChainParameter as IChainParameter,
    Exchange as IExchange,
    NodeInfo as INodeInfo,
    Proposal as IProposal,
    TransactionInfo as ITransactionInfo,
    Witness as IWitness,
} from '../proto/core/Tron';
import type {AssetIssueContract as IToken} from '../proto/core/contract/asset_issue_contract';
import {ResourceCode as ResourceT} from '../proto/core/contract/common';
import type {SmartContract as ISmartContract} from '../proto/core/contract/smart_contract';
import utils from '../utils';
import {ADDRESS_PREFIX} from '../utils/address';
import type {SomeBytes} from '../utils/bytes';
import {TypedDataTypes} from '../utils/crypto';
import {
    SigningKey,
    keccak256,
    recoverAddress,
    toUtf8Bytes,
} from '../utils/ethersUtils';
import {IDomain} from '../utils/typedData';
import _CallbackT from '../utils/typing';
import {
    ISignedTransaction,
    Transaction as ITransaction,
} from './transactionBuilder';

export {ResourceCode as ResourceT} from '../proto/core/contract/common';

const TRX_MESSAGE_HEADER = '\x19TRON Signed Message:\n32';
// it should be: '\x15TRON Signed Message:\n32';
const ETH_MESSAGE_HEADER = '\x19Ethereum Signed Message:\n32';

export type BlockT = number | 'latest' | 'earliest' | string;

export type {
    Block as IBlock,
    TransactionInfo_Log as ILog,
    TransactionInfo as ITransactionInfo,
    Account as IAccount,
    Proposal as IProposal,
    Exchange as IExchange,
    Witness as IWitness,
    ChainParameters_ChainParameter as IChainParameter,
    NodeInfo as INodeInfo,
} from '../proto/core/Tron';

export type {
    TransactionExtention as ITransactionExtention,
    TransactionSignWeight as ISignWeight,
    BlockExtention as IBlockExtention,
    TransactionApprovedList as ITransactionApprovedList,
    AccountResourceMessage as IAccountResource,
} from '../proto/api/api';
export type {SmartContract as ISmartContract} from '../proto/core/contract/smart_contract';
export type {AssetIssueContract as IToken} from '../proto/core/contract/asset_issue_contract';

export type MakeSigned<T> = T extends string ? T : T & {signature: string[]};

export type IBroadcastResult = {
    code: string;
    message: string;
} & (
    | {result: true; transaction: ISignedTransaction; txid: string}
    | {result: false}
);
export type IBroadcastHexResult = {
    code: string;
    message: string;
} & (
    | {result: true; transaction: ISignedTransaction; hexTransaction: string}
    | {result: false}
);

export interface IAddressOrPk {
    privateKey?: string;
    address?: string;
}

function toHex(value: string): string {
    return TronWeb.address.toHex(value);
}

const INVALID_ADDRESS_MSG = 'Invalid address provided';
const INVALID_TOKEN_ID_MSG = 'Invalid token ID provided';
const TOKEN_DOES_NOT_EXIST_MSG = 'Token does not exist';
const INVALID_TRANSACTION_MSG = 'Invalid transaction provided';
const INVALID_AMOUNT_MSG = 'Invalid amount provided';
const NEED_PK_OR_ADDRESS_MSG =
    'Function requires either a private key or address to be set';

export default class Trx extends WithTronwebAndInjectpromise {
    cache: {contracts: Record<string, ISmartContract>};
    validator: Validator;

    constructor(tronWeb: TronWeb) {
        super(tronWeb);
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

    getCurrentBlock(callback?: undefined): Promise<IBlockExtention>;
    getCurrentBlock(callback: _CallbackT<IBlockExtention>): void;
    getCurrentBlock(
        callback?: _CallbackT<IBlockExtention>,
    ): void | Promise<IBlockExtention> {
        if (!callback) return this.injectPromise(this.getCurrentBlock);
        this.tronWeb.fullNode
            .request('wallet/getnowblock')
            .then((block) => {
                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    getConfirmedCurrentBlock(callback?: undefined): Promise<IBlockExtention>;
    getConfirmedCurrentBlock(callback: _CallbackT<IBlockExtention>): void;
    getConfirmedCurrentBlock(
        callback?: _CallbackT<IBlockExtention>,
    ): void | Promise<IBlockExtention> {
        if (!callback) return this.injectPromise(this.getConfirmedCurrentBlock);
        this.tronWeb.solidityNode
            .request('walletsolidity/getnowblock')
            .then((block) => {
                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    getBlock(
        block?: BlockT | null,
        callback?: undefined,
    ): Promise<IBlockExtention>;
    getBlock(
        block: BlockT | null | undefined,
        callback: _CallbackT<IBlockExtention>,
    ): void;
    getBlock(
        block: BlockT | null = this.tronWeb.defaultBlock,
        callback?: _CallbackT<IBlockExtention>,
    ): void | Promise<IBlockExtention> {
        if (!callback) return this.injectPromise(this.getBlock, block);

        if (block === null) return callback('No block identifier provided');

        if (block === 'earliest') block = 0;
        if (block === 'latest') return this.getCurrentBlock(callback);

        // TODO: can we drop this weird isNaN for string?..
        // if (isNaN(block as any as number) && utils.isHex(block))
        if (utils.isHex(block)) return this.getBlockByHash(block, callback);

        this.getBlockByNumber(block, callback);
    }

    getBlockByHash(
        blockHash: string,
        callback?: undefined,
    ): Promise<IBlockExtention>;
    getBlockByHash(
        blockHash: string,
        callback: _CallbackT<IBlockExtention>,
    ): void;
    getBlockByHash(
        blockHash: string,
        callback?: _CallbackT<IBlockExtention>,
    ): void | Promise<IBlockExtention> {
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

    getBlockByNumber(
        blockID: number,
        callback?: undefined,
    ): Promise<IBlockExtention>;
    getBlockByNumber(
        blockID: number,
        callback: _CallbackT<IBlockExtention>,
    ): void;
    getBlockByNumber(
        blockID: number,
        callback?: _CallbackT<IBlockExtention>,
    ): void | Promise<IBlockExtention> {
        if (!callback)
            return this.injectPromise(this.getBlockByNumber, blockID);

        if (!utils.isInteger(blockID) || blockID < 0)
            return callback('Invalid block number provided');

        this.tronWeb.fullNode
            .request(
                'wallet/getblockbynum',
                {num: parseInt(blockID.toString())},
                'post',
            )
            .then((block) => {
                if (!Object.keys(block).length)
                    return callback('Block not found');

                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    getBlockTransactionCount(
        block?: BlockT | null | undefined,
    ): Promise<number>;
    getBlockTransactionCount(
        block: BlockT | null | undefined,
        callback: _CallbackT<number>,
    ): void;
    getBlockTransactionCount(
        block: BlockT | null = this.tronWeb.defaultBlock,
        callback?: _CallbackT<number>,
    ): void | Promise<number> {
        if (!callback)
            return this.injectPromise(this.getBlockTransactionCount, block);

        this.getBlock(block)
            .then(({transactions = []}) => {
                callback(null, transactions.length);
            })
            .catch((err) => callback(err));
    }

    getTransactionFromBlock(block?: BlockT | null): Promise<ITransaction[]>;
    getTransactionFromBlock(
        block: BlockT | null | undefined,
        index: number,
    ): Promise<ITransaction>;
    getTransactionFromBlock(
        block: BlockT | null | undefined,
        index: null | undefined,
        callback: _CallbackT<ITransaction[]>,
    ): void;
    getTransactionFromBlock(
        block: BlockT | null | undefined,
        index: number,
        callback: _CallbackT<ITransaction>,
    ): void;
    getTransactionFromBlock(
        block: BlockT | null = this.tronWeb.defaultBlock,
        index?: number | null,
        callback?: _CallbackT<ITransaction> | _CallbackT<ITransaction[]>,
    ): void | Promise<ITransaction> | Promise<ITransaction[]> {
        if (!callback)
            return this.injectPromise(
                this.getTransactionFromBlock,
                block,
                index,
            );

        this.getBlock(block)
            .then(({transactions}) => {
                if (!transactions) callback('Transaction not found in block');
                else if (typeof index === 'number')
                    if (index >= 0 && index < transactions.length)
                        callback(null, transactions[index] as any);
                    else callback('Invalid transaction index provided');
                else callback(null, transactions as any);
            })
            .catch((err) => callback(err));
    }

    getTransaction(
        transactionID: string,
        callback?: undefined,
    ): Promise<ITransaction>;
    getTransaction(
        transactionID: string,
        callback: _CallbackT<ITransaction>,
    ): void;
    getTransaction(
        transactionID: string,
        callback?: _CallbackT<ITransaction>,
    ): void | Promise<ITransaction> {
        if (!callback)
            return this.injectPromise(this.getTransaction, transactionID);

        this.tronWeb.fullNode
            .request(
                'wallet/gettransactionbyid',
                {value: transactionID},
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
        callback: _CallbackT<ITransaction>,
    ): void;
    getConfirmedTransaction(
        transactionID: string,
        callback?: _CallbackT<ITransaction>,
    ): void | Promise<ITransaction> {
        if (!callback)
            return this.injectPromise(
                this.getConfirmedTransaction,
                transactionID,
            );

        this.tronWeb.solidityNode
            .request(
                'walletsolidity/gettransactionbyid',
                {value: transactionID},
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
    ): Promise<ITransactionInfo>;
    getUnconfirmedTransaction(
        transactionID: string,
        callback: _CallbackT<ITransactionInfo>,
    ): void;
    getUnconfirmedTransaction(
        transactionID: string,
        callback?: _CallbackT<ITransactionInfo>,
    ): void | Promise<ITransactionInfo> {
        return this._getTransactionInfoById(
            transactionID,
            {confirmed: false},
            callback as any,
        );
    }

    getTransactionInfo(
        transactionID: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    getTransactionInfo(
        transactionID: string,
        callback: _CallbackT<ITransactionInfo>,
    ): void;
    getTransactionInfo(
        transactionID: string,
        callback?: _CallbackT<ITransactionInfo>,
    ): void | Promise<ITransactionInfo> {
        return this._getTransactionInfoById(
            transactionID,
            {confirmed: true},
            callback as any,
        );
    }

    _getTransactionInfoById(
        transactionID: string,
        options: {confirmed: boolean},
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    _getTransactionInfoById(
        transactionID: string,
        options: {confirmed: boolean},
        callback: _CallbackT<ITransactionInfo>,
    ): void;
    _getTransactionInfoById(
        transactionID: string,
        options: {confirmed: boolean},
        callback?: _CallbackT<ITransactionInfo>,
    ): void | Promise<ITransactionInfo> {
        if (!callback)
            return this.injectPromise(
                this._getTransactionInfoById,
                transactionID,
                options,
            );

        if (options.confirmed)
            this.tronWeb.solidityNode
                .request(
                    'wallet/gettransactioninfobyid',
                    {value: transactionID},
                    'post',
                )
                .then((transaction) => {
                    callback(null, transaction);
                })
                .catch((err) => callback(err));
        else
            this.tronWeb.fullNode
                .request(
                    'walletsolidity/gettransactioninfobyid',
                    {value: transactionID},
                    'post',
                )
                .then((transaction) => {
                    callback(null, transaction);
                })
                .catch((err) => callback(err));
    }

    /**
     * @deprecated This api is no longer supported in the latest version
     * You can use the central node api: 47.90.247.237:8091/walletextension/gettransactionsfromthis
     */
    async getTransactionsToAddress(
        address?: string,
        limit?: number,
        offset?: number,
        callback?: undefined,
    ): Promise<ITransactionExtention[]>;
    async getTransactionsToAddress(
        address: string | undefined,
        limit: number | undefined,
        offset: number | undefined,
        callback: _CallbackT<ITransactionExtention[]>,
    ): Promise<void>;
    async getTransactionsToAddress(
        address: string = this.tronWeb.defaultAddress.hex,
        limit = 30,
        offset = 0,
        callback?: _CallbackT<ITransactionExtention[]>,
    ): Promise<void | ITransactionExtention[]> {
        return this.getTransactionsRelated(
            address,
            'to',
            limit,
            offset,
            callback as any,
        );
    }

    /**
     * @deprecated This api is no longer supported in the latest version
     * You can use the central node api: 47.90.247.237:8091/walletextension/gettransactionsfromthis
     */
    async getTransactionsFromAddress(
        address?: string,
        limit?: number,
        offset?: number,
        callback?: undefined,
    ): Promise<ITransactionExtention[]>;
    async getTransactionsFromAddress(
        address: string | undefined,
        limit: number | undefined,
        offset: number | undefined,
        callback: _CallbackT<ITransactionExtention[]>,
    ): Promise<void>;
    async getTransactionsFromAddress(
        address: string = this.tronWeb.defaultAddress.hex,
        limit = 30,
        offset = 0,
        callback?: _CallbackT<ITransactionExtention[]>,
    ): Promise<void | ITransactionExtention[]> {
        return this.getTransactionsRelated(
            address,
            'from',
            limit,
            offset,
            callback as any,
        );
    }

    /**
     * @deprecated This api is no longer supported in the latest version
     * You can use the central node api: 47.90.247.237:8091/walletextension/gettransactionsfromthis
     */
    async getTransactionsRelated(
        address?: string,
        direction?: 'all',
        limit?: number,
        offset?: number,
        callback?: undefined,
    ): Promise<(ITransactionExtention & {direction: 'to' | 'from'})[]>;
    async getTransactionsRelated(
        address?: string,
        direction?: 'to' | 'from',
        limit?: number,
        offset?: number,
        callback?: undefined,
    ): Promise<ITransactionExtention[]>;
    async getTransactionsRelated(
        address: string | undefined,
        direction: 'all' | undefined,
        limit: number | undefined,
        offset: number | undefined,
        callback: _CallbackT<
            (ITransactionExtention & {direction: 'to' | 'from'})[]
        >,
    ): Promise<void>;
    async getTransactionsRelated(
        address: string | undefined,
        direction: 'to' | 'from',
        limit: number | undefined,
        offset: number | undefined,
        callback: _CallbackT<ITransactionExtention[]>,
    ): Promise<void>;
    async getTransactionsRelated(
        address: string = this.tronWeb.defaultAddress.hex,
        direction: 'all' | 'to' | 'from' = 'all',
        limit = 30,
        offset = 0,
        callback?:
            | _CallbackT<(ITransactionExtention & {direction: 'to' | 'from'})[]>
            | _CallbackT<ITransactionExtention[]>,
    ): Promise<
        | void
        | (ITransactionExtention & {direction: 'to' | 'from'})[]
        | ITransactionExtention[]
    > {
        if (!callback)
            return this.injectPromise(
                this.getTransactionsRelated,
                address,
                direction,
                limit,
                offset,
            );

        if (!['to', 'from', 'all'].includes(direction))
            return callback(
                'Invalid direction provided: Expected "to", "from" or "all"',
            );

        if (direction === 'all')
            try {
                const [from, to] = await Promise.all([
                    this.getTransactionsRelated(address, 'from', limit, offset),
                    this.getTransactionsRelated(address, 'to', limit, offset),
                ]);

                return callback(
                    null,
                    [
                        ...from.map((tx: any) => ((tx.direction = 'from'), tx)),
                        ...to.map((tx: any) => ((tx.direction = 'to'), tx)),
                    ].sort((a, b) => {
                        return b.raw_data.timestamp - a.raw_data.timestamp;
                    }),
                );
            } catch (ex) {
                return callback(ex);
            }

        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);

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
                    } as IAccount,
                    offset,
                    limit,
                },
                'post',
            )
            .then(({transaction}) => {
                callback(null, transaction as any);
            })
            .catch((err) => callback(err));
    }

    getAccount(address?: string, callback?: undefined): Promise<IAccount>;
    getAccount(
        address: string | undefined,
        callback: _CallbackT<IAccount>,
    ): void;
    getAccount(
        address: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<IAccount>,
    ): void | Promise<IAccount> {
        if (!callback) return this.injectPromise(this.getAccount, address);

        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);

        address = this.tronWeb.address.toHex(address);

        this.tronWeb.solidityNode
            .request('walletsolidity/getaccount', {address} as IAccount, 'post')
            .then((account) => {
                callback(null, account);
            })
            .catch((err) => callback(err));
    }

    getAccountById(id: string, callback?: undefined): Promise<IAccount>;
    getAccountById(id: string, callback: _CallbackT<IAccount>): void;
    getAccountById(
        id: string,
        callback?: _CallbackT<IAccount>,
    ): void | Promise<IAccount> {
        if (!callback) return this.injectPromise(this.getAccountById, id);
        this.getAccountInfoById(id, {confirmed: true}, callback);
    }

    getAccountInfoById(
        id: string,
        options: {confirmed?: boolean} | undefined,
        callback: _CallbackT<IAccount>,
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

        if (options && options.confirmed)
            this.tronWeb.solidityNode
                .request(
                    'walletsolidity/getaccountbyid',
                    {account_id: id} as IAccount,
                    'post',
                )
                .then((account) => {
                    callback(null, account);
                })
                .catch((err) => callback(err));
        else
            this.tronWeb.fullNode
                .request(
                    'wallet/getaccountbyid',
                    {account_id: id} as IAccount,
                    'post',
                )
                .then((account) => {
                    callback(null, account);
                })
                .catch((err) => callback(err));
    }

    getBalance(address?: string, callback?: undefined): Promise<number>;
    getBalance(address: string, callback: _CallbackT<number>): void;
    getBalance(
        address: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<number>,
    ): void | Promise<number> {
        if (!callback) return this.injectPromise(this.getBalance, address);

        this.getAccount(address)
            .then(({balance = 0}) => {
                callback(null, balance);
            })
            .catch((err) => callback(err));
    }

    getUnconfirmedAccount(
        address?: string,
        callback?: undefined,
    ): Promise<IAccount>;
    getUnconfirmedAccount(
        address: string,
        callback: _CallbackT<IAccount>,
    ): void;
    getUnconfirmedAccount(
        address: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<IAccount>,
    ): void | Promise<IAccount> {
        if (!callback)
            return this.injectPromise(this.getUnconfirmedAccount, address);

        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);

        address = this.tronWeb.address.toHex(address);

        this.tronWeb.fullNode
            .request('wallet/getaccount', {address} as IAccount, 'post')
            .then((account) => {
                callback(null, account);
            })
            .catch((err) => callback(err));
    }

    getUnconfirmedAccountById(
        id: string,
        callback?: undefined,
    ): Promise<IAccount>;
    getUnconfirmedAccountById(id: string, callback: _CallbackT<IAccount>): void;
    getUnconfirmedAccountById(
        id: string,
        callback?: _CallbackT<IAccount>,
    ): void | Promise<IAccount> {
        if (!callback)
            return this.injectPromise(this.getUnconfirmedAccountById, id);
        this.getAccountInfoById(id, {confirmed: false}, callback);
    }

    getUnconfirmedBalance(
        address?: string,
        callback?: undefined,
    ): Promise<number>;
    getUnconfirmedBalance(address: string, callback: _CallbackT<number>): void;
    getUnconfirmedBalance(
        address: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<number>,
    ): void | Promise<number> {
        if (!callback)
            return this.injectPromise(this.getUnconfirmedBalance, address);

        this.getUnconfirmedAccount(address)
            .then(({balance = 0}) => {
                callback(null, balance);
            })
            .catch((err) => callback(err));
    }

    getBandwidth(address?: string, callback?: undefined): Promise<number>;
    getBandwidth(address: string, callback: _CallbackT<number>): void;
    getBandwidth(
        address: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<number>,
    ): void | Promise<number> {
        if (!callback) return this.injectPromise(this.getBandwidth, address);

        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);

        address = this.tronWeb.address.toHex(address);

        this.tronWeb.fullNode
            .request('wallet/getaccountnet', {address} as IAccount, 'post')
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

    getTokensIssuedByAddress(
        address?: string,
        callback?: undefined,
    ): Promise<Record<string, IToken>>;
    getTokensIssuedByAddress(
        address: string,
        callback: _CallbackT<Record<string, IToken>>,
    ): void;
    getTokensIssuedByAddress(
        address: string = this.tronWeb.defaultAddress.hex,
        callback?: _CallbackT<Record<string, IToken>>,
    ): void | Promise<Record<string, IToken>> {
        if (!callback)
            return this.injectPromise(this.getTokensIssuedByAddress, address);

        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);

        address = this.tronWeb.address.toHex(address);

        this.tronWeb.fullNode
            .request(
                'wallet/getassetissuebyaccount',
                {address} as IAccount,
                'post',
            )
            .then(({assetIssue}) => {
                if (!assetIssue) return callback(null, {});

                const tokens = assetIssue
                    .map((token) => this._parseToken(token))
                    .reduce((tokens, token) => {
                        return (tokens[token.name] = token), tokens;
                    }, {} as Record<string, IToken>);

                callback(null, tokens);
            })
            .catch((err) => callback(err));
    }

    getTokenFromID(
        tokenID: string | number,
        callback?: undefined,
    ): Promise<IToken>;
    getTokenFromID(
        tokenID: string | number,
        callback: _CallbackT<IToken>,
    ): void;
    getTokenFromID(
        tokenID: string | number,
        callback?: _CallbackT<IToken>,
    ): void | Promise<IToken> {
        if (!callback) return this.injectPromise(this.getTokenFromID, tokenID);

        if (utils.isInteger(tokenID)) tokenID = tokenID.toString();

        if (!utils.isString(tokenID) || !tokenID.length)
            return callback(INVALID_TOKEN_ID_MSG);

        this.tronWeb.fullNode
            .request(
                'wallet/getassetissuebyname',
                {value: this.tronWeb.fromUtf8(tokenID)},
                'post',
            )
            .then((token) => {
                if (!token.name) return callback(TOKEN_DOES_NOT_EXIST_MSG);

                callback(null, this._parseToken(token));
            })
            .catch((err) => callback(err));
    }

    listNodes(callback?: undefined): Promise<string[]>;
    listNodes(callback: _CallbackT<string[]>): void;
    listNodes(callback?: _CallbackT<string[]>): void | Promise<string[]> {
        if (!callback) return this.injectPromise(this.listNodes);

        this.tronWeb.fullNode
            .request('wallet/listnodes')
            .then(({nodes = []}) => {
                callback(
                    null,
                    nodes.map(
                        ({address: a}) =>
                            `${this.tronWeb.toUtf8(a!.host)}:${a!.port}`,
                    ),
                );
            })
            .catch((err) => callback(err));
    }

    getBlockRange(
        start?: number,
        end?: number,
        callback?: undefined,
    ): Promise<IBlockExtention[]>;
    getBlockRange(
        start: number | undefined,
        end: number | undefined,
        callback: _CallbackT<IBlockExtention[]>,
    ): void;
    getBlockRange(
        start = 0,
        end = 30,
        callback?: _CallbackT<IBlockExtention[]>,
    ): void | Promise<IBlockExtention[]> {
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
            .then(({block = []}) => {
                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    listSuperRepresentatives(callback?: undefined): Promise<IWitness[]>;
    listSuperRepresentatives(callback: _CallbackT<IWitness[]>): void;
    listSuperRepresentatives(
        callback?: _CallbackT<IWitness[]>,
    ): void | Promise<IWitness[]> {
        if (!callback) return this.injectPromise(this.listSuperRepresentatives);

        this.tronWeb.fullNode
            .request('wallet/listwitnesses')
            .then(({witnesses = []}) => {
                callback(null, witnesses);
            })
            .catch((err) => callback(err));
    }

    listTokens(
        limit?: number,
        offset?: number,
        callback?: undefined,
    ): Promise<IToken[]>;
    listTokens(
        limit: number | undefined,
        offset: number | undefined,
        callback: _CallbackT<IToken[]>,
    ): void;
    listTokens(
        limit = 0,
        offset = 0,
        callback?: _CallbackT<IToken[]>,
    ): void | Promise<IToken[]> {
        if (!callback)
            return this.injectPromise(this.listTokens, limit, offset);

        if (!utils.isInteger(limit) || limit < 0 || (offset && limit < 1))
            return callback('Invalid limit provided');

        if (!utils.isInteger(offset) || offset < 0)
            return callback('Invalid offset provided');

        if (!limit)
            return this.tronWeb.fullNode
                .request('wallet/getassetissuelist')
                .then(({assetIssue = [] as IToken[]}) => {
                    callback(
                        null,
                        assetIssue.map((token) => this._parseToken(token)),
                    );
                })
                .catch((err) => callback(err)) as unknown as void;

        this.tronWeb.fullNode
            .request(
                'wallet/getpaginatedassetissuelist',
                {
                    offset: parseInt(offset.toString()),
                    limit: parseInt(limit.toString()),
                },
                'post',
            )
            .then(({assetIssue = []}) => {
                callback(
                    null,
                    assetIssue.map((token) => this._parseToken(token)),
                );
            })
            .catch((err) => callback(err));
    }

    timeUntilNextVoteCycle(callback?: undefined): Promise<number>;
    timeUntilNextVoteCycle(callback: _CallbackT<number>): void;
    timeUntilNextVoteCycle(
        callback?: _CallbackT<number>,
    ): void | Promise<number> {
        if (!callback) return this.injectPromise(this.timeUntilNextVoteCycle);

        this.tronWeb.fullNode
            .request('wallet/getnextmaintenancetime')
            .then(({num = -1}) => {
                if (num === -1)
                    return callback('Failed to get time until next vote cycle');

                callback(null, Math.floor(num / 1000));
            })
            .catch((err) => callback(err));
    }

    getContract(
        contractAddress: string,
        callback?: undefined,
    ): Promise<ISmartContract>;
    getContract(
        contractAddress: string,
        callback: _CallbackT<ISmartContract>,
    ): void;
    getContract(
        contractAddress: string,
        callback?: _CallbackT<ISmartContract>,
    ): void | Promise<ISmartContract> {
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
            .request('wallet/getcontract', {value: contractAddress})
            .then((contract) => {
                if ('Error' in contract)
                    return callback('Contract does not exist');
                this.cache.contracts[contractAddress] = contract;
                callback(null, contract);
            })
            .catch((err) => callback(err));
    }

    async verifyMessage(
        message: string,
        signature: string,
        address?: string,
        useTronHeader?: boolean,
        callback?: undefined,
    ): Promise<boolean>;
    async verifyMessage(
        message: string,
        signature: string,
        address: string | undefined,
        useTronHeader: boolean | undefined,
        callback: _CallbackT<boolean>,
    ): Promise<void>;
    async verifyMessage(
        message: string,
        signature: string,
        address: string = this.tronWeb.defaultAddress.base58,
        useTronHeader: boolean | undefined = true,
        callback?: _CallbackT<boolean>,
    ): Promise<void | boolean> {
        if (!callback)
            return this.injectPromise(
                this.verifyMessage,
                message,
                signature,
                address,
                useTronHeader,
            );

        if (!utils.isHex(message))
            return callback('Expected hex message input');

        if (Trx.verifySignature(message, address, signature, useTronHeader))
            return callback(null, true);

        callback('Signature does not match');
    }

    static verifySignature(
        message: string,
        address: string,
        signature: string,
        useTronHeader: boolean | undefined = true,
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
        options: _CallbackT<string>,
        callback?: undefined,
    ): void;
    verifyMessageV2(
        message: string,
        signature: string,
        options: undefined,
        callback?: undefined,
    ): Promise<string>;
    verifyMessageV2(
        message: string,
        signature: string,
        options: undefined,
        callback: _CallbackT<string>,
    ): void;
    verifyMessageV2(
        message: string,
        signature: string,
        options?: undefined | _CallbackT<string>,
        callback?: _CallbackT<string>,
    ): void | Promise<string> {
        if (utils.isFunction(options))
            return this.verifyMessageV2(message, signature, undefined, options);

        if (!callback)
            return this.injectPromise(
                this.verifyMessageV2,
                message,
                signature,
                options,
            );

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
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
        signature: string,
        address?: string,
        callback?: undefined,
    ): Promise<boolean>;
    verifyTypedData(
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
        signature: string,
        address: string | undefined,
        callback: _CallbackT<boolean>,
    ): void;
    verifyTypedData(
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
        signature: string,
        address: string = this.tronWeb.defaultAddress.base58,
        callback?: _CallbackT<boolean>,
    ): void | Promise<boolean> {
        if (!callback)
            return this.injectPromise(
                this.verifyTypedData,
                domain,
                types,
                value,
                signature,
                address,
            );

        if (Trx.verifyTypedData(domain, types, value, signature, address))
            return callback(null, true);

        callback('Signature does not match');
    }

    static verifyTypedData(
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
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

    async sign<T extends string | ITransaction>(
        transaction: T,
        privateKey?: string,
        useTronHeader?: boolean,
        multisig?: boolean,
        callback?: undefined,
    ): Promise<MakeSigned<T>>;
    async sign<T extends string | ITransaction>(
        transaction: T,
        privateKey: string | undefined,
        useTronHeader: boolean | undefined,
        multisig: boolean | undefined,
        callback: _CallbackT<MakeSigned<T>>,
    ): Promise<void>;
    async sign<T extends string | ITransaction>(
        transaction: T,
        privateKey: string = this.tronWeb.defaultAddress.hex,
        useTronHeader: boolean | undefined = false,
        multisig = false,
        callback?: _CallbackT<MakeSigned<T>>,
    ): Promise<void | MakeSigned<T>> {
        if (!callback)
            return this.injectPromise(
                this.sign,
                transaction,
                privateKey,
                useTronHeader,
                multisig,
            );

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
                return callback(null, signatureHex as MakeSigned<T>);
            } catch (ex) {
                callback(ex);
            }
        }

        if (!utils.isObject(transaction))
            return callback(INVALID_TRANSACTION_MSG);

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
                )
                    return callback(
                        'Private key does not match address in transaction',
                    );
            }
            return callback(
                null,
                utils.crypto.signTransaction(
                    privateKey,
                    transaction,
                ) as unknown as MakeSigned<T>,
            );
        } catch (ex) {
            callback(ex);
        }
    }

    static signString(
        message: string,
        privateKey: string,
        useTronHeader: boolean | undefined = true,
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
        return [
            '0x',
            signature.r.substring(2),
            signature.s.substring(2),
            Number(signature.v).toString(16),
        ].join('');
    }

    signString(
        message: string,
        privateKey: string,
        useTronHeader: boolean | undefined = true,
    ): string {
        return Trx.signString(message, privateKey, useTronHeader);
    }

    /**
     * Sign message v2 for verified header length.
     *
     * @param {message to be signed, should be Bytes or string} message
     * @param {privateKey for signature} privateKey
     * @param {reserved} options
     * @param {callback function} callback
     */
    signMessageV2(
        message: SomeBytes | string,
        privateKey?: string,
        options?: undefined,
        callback?: undefined,
    ): Promise<string>;
    signMessageV2(
        message: SomeBytes | string,
        privateKey: string | undefined,
        options: undefined,
        callback: _CallbackT<string>,
    ): void;
    signMessageV2(
        message: SomeBytes | string,
        privateKey: string = this.tronWeb.defaultPrivateKey,
        options?: undefined | _CallbackT<string>,
        callback?: _CallbackT<string>,
    ): void | Promise<string> {
        if (!callback)
            return this.injectPromise(this.signMessageV2, message, privateKey);

        try {
            const signatureHex = Trx.signMessageV2(message, privateKey);
            return callback(null, signatureHex);
        } catch (ex) {
            callback(ex);
        }
    }

    static signMessageV2(
        message: SomeBytes | string,
        privateKey: string,
    ): string {
        return utils.message.signMessage(message, privateKey);
    }

    _signTypedData(
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
    ): Promise<string>;
    _signTypedData(
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
        privateKey: _CallbackT<string>,
    ): void;
    _signTypedData(
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
        privateKey: string,
        callback?: undefined,
    ): Promise<string>;
    _signTypedData(
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
        privateKey: string,
        callback: _CallbackT<string>,
    ): void;
    _signTypedData(
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
        privateKey: string | _CallbackT<string> = this.tronWeb
            .defaultPrivateKey,
        callback?: _CallbackT<string>,
    ): void | Promise<string> {
        if (utils.isFunction(privateKey))
            return this._signTypedData(
                domain,
                types,
                value,
                this.tronWeb.defaultPrivateKey,
                privateKey,
            );

        if (!callback)
            return this.injectPromise(
                this._signTypedData,
                domain,
                types,
                value,
                privateKey,
            );

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
        domain: IDomain,
        types: TypedDataTypes,
        value: Record<string, unknown>,
        privateKey: string,
    ): string {
        return utils.crypto._signTypedData(domain, types, value, privateKey);
    }

    async multiSign(
        transaction: ITransaction,
        privateKey?: string,
        permissionId?: number,
        callback?: undefined,
    ): Promise<ISignedTransaction>;
    async multiSign(
        transaction: ITransaction,
        privateKey: string | undefined,
        permissionId: number | undefined,
        callback: _CallbackT<ISignedTransaction>,
    ): Promise<void>;
    async multiSign(
        transaction: ITransaction,
        privateKey: string = this.tronWeb.defaultPrivateKey,
        permissionId = 0,
        callback?: _CallbackT<ISignedTransaction>,
    ): Promise<void | ISignedTransaction> {
        if (!callback)
            return this.injectPromise(
                this.multiSign,
                transaction,
                privateKey,
                permissionId,
            );

        if (
            !utils.isObject(transaction) ||
            !transaction.raw_data ||
            !transaction.raw_data.contract
        )
            return callback(INVALID_TRANSACTION_MSG);

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

            let foundKey = false;
            signWeight.permission &&
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
                if (permissionId > 0)
                    transaction.raw_data.contract[0].Permission_id =
                        permissionId;
            } else {
                return callback(INVALID_TRANSACTION_MSG);
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
        callback: _CallbackT<ITransactionApprovedList>,
    ): Promise<void>;
    async getApprovedList(
        transaction: ITransaction,
        callback?: _CallbackT<ITransactionApprovedList>,
    ): Promise<void | ITransactionApprovedList> {
        if (!callback)
            return this.injectPromise(this.getApprovedList, transaction);

        if (!utils.isObject(transaction))
            return callback(INVALID_TRANSACTION_MSG);

        this.tronWeb.fullNode
            .request('wallet/getapprovedlist', transaction, 'post')
            .then((result) => {
                callback(null, result);
            })
            .catch((err) => callback(err));
    }

    async getSignWeight(
        transaction: ITransaction,
        permissionId?: number,
        callback?: undefined,
    ): Promise<ISignWeight>;
    async getSignWeight(
        transaction: ITransaction,
        permissionId: number | undefined,
        callback?: _CallbackT<ISignWeight>,
    ): Promise<void>;
    async getSignWeight(
        transaction: ITransaction,
        permissionId?: number,
        callback?: _CallbackT<ISignWeight>,
    ): Promise<void | ISignWeight> {
        if (!callback)
            return this.injectPromise(
                this.getSignWeight,
                transaction,
                permissionId,
            );

        if (
            !utils.isObject(transaction) ||
            !transaction.raw_data ||
            !transaction.raw_data.contract
        )
            return callback(INVALID_TRANSACTION_MSG);

        if (utils.isInteger(permissionId))
            transaction.raw_data.contract[0].Permission_id = parseInt(
                permissionId.toString(),
            );
        else if (
            typeof transaction.raw_data.contract[0].Permission_id !== 'number'
        )
            transaction.raw_data.contract[0].Permission_id = 0;

        if (!utils.isObject(transaction))
            return callback(INVALID_TRANSACTION_MSG);

        this.tronWeb.fullNode
            .request('wallet/getsignweight', transaction, 'post')
            .then((result) => {
                callback(null, result);
            })
            .catch((err) => callback(err));
    }

    sendRawTransaction(
        signedTransaction: ITransaction,
        options?: undefined,
        callback?: undefined,
    ): Promise<IBroadcastResult>;
    sendRawTransaction(
        signedTransaction: ITransaction,
        options: undefined,
        callback: _CallbackT<IBroadcastResult>,
    ): void;
    sendRawTransaction(
        signedTransaction: ITransaction,
        options?: undefined,
        callback?: _CallbackT<IBroadcastResult>,
    ): void | Promise<IBroadcastResult> {
        if (!callback)
            return this.injectPromise(
                this.sendRawTransaction,
                signedTransaction,
                options,
            );

        if (!utils.isObject(signedTransaction))
            return callback(INVALID_TRANSACTION_MSG);

        if (
            !signedTransaction.signature ||
            !utils.isArray(signedTransaction.signature)
        )
            return callback('Transaction is not signed');

        this.tronWeb.fullNode
            .request('wallet/broadcasttransaction', signedTransaction, 'post')
            .then((result) => {
                const r = result as IBroadcastResult;
                if (r.result) r.transaction = signedTransaction;
                callback(null, r);
            })
            .catch((err) => callback(err));
    }

    /**
     * Broadcast a transaction in hex form
     *  Warning: This method is missing in .proto and absent in docker test node
     */
    sendHexTransaction(
        signedHexTransaction: string,
        options?: undefined,
        callback?: undefined,
    ): Promise<IBroadcastHexResult>;
    sendHexTransaction(
        signedHexTransaction: string,
        options: undefined,
        callback: _CallbackT<IBroadcastHexResult>,
    ): void;
    sendHexTransaction(
        signedHexTransaction: string,
        options?: undefined,
        callback?: _CallbackT<IBroadcastHexResult>,
    ): void | Promise<IBroadcastHexResult> {
        if (!callback)
            return this.injectPromise(
                this.sendHexTransaction,
                signedHexTransaction,
                options,
            );

        if (!utils.isHex(signedHexTransaction))
            return callback('Invalid hex transaction provided');

        const params = {
            transaction: signedHexTransaction,
        };

        this.tronWeb.fullNode
            .request('wallet/broadcasthex' as any, params, 'post')
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
        options?: string | IAddressOrPk,
        callback?: undefined,
    ): Promise<IBroadcastResult>;
    async sendTransaction(
        to: string,
        amount: number,
        options: string | IAddressOrPk | undefined,
        callback?: _CallbackT<IBroadcastResult>,
    ): Promise<void>;
    async sendTransaction(
        to: string,
        amount: number,
        options?: string | IAddressOrPk,
        callback?: _CallbackT<IBroadcastResult>,
    ): Promise<void | IBroadcastResult> {
        if (typeof options === 'string') options = {privateKey: options};

        if (!callback)
            return this.injectPromise(
                this.sendTransaction,
                to,
                amount,
                options,
            );

        if (!this.tronWeb.isAddress(to))
            return callback('Invalid recipient provided');

        if (!utils.isInteger(amount) || amount <= 0)
            return callback(INVALID_AMOUNT_MSG);

        options = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options.privateKey && !options.address)
            return callback(NEED_PK_OR_ADDRESS_MSG);

        try {
            const address = (
                options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address
            ) as string;
            const transaction = await this.tronWeb.transactionBuilder.sendTrx(
                to,
                amount,
                address,
            );
            const signedTransaction = await this.sign(
                transaction,
                options.privateKey || undefined,
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
        options?: string | IAddressOrPk,
        callback?: undefined,
    ): Promise<IBroadcastResult>;
    async sendToken(
        to: string,
        amount: number,
        tokenID: string | number,
        options: string | IAddressOrPk | undefined,
        callback?: _CallbackT<IBroadcastResult>,
    ): Promise<void>;
    async sendToken(
        to: string,
        amount: number,
        tokenID: string | number,
        options?: string | IAddressOrPk | _CallbackT<IBroadcastResult>,
        callback?: _CallbackT<IBroadcastResult>,
    ): Promise<void | IBroadcastResult> {
        if (typeof options === 'string') options = {privateKey: options};

        if (!callback)
            return this.injectPromise(
                this.sendToken,
                to,
                amount,
                tokenID,
                options,
            );

        if (!this.tronWeb.isAddress(to))
            return callback('Invalid recipient provided');

        if (!utils.isInteger(amount) || amount <= 0)
            return callback(INVALID_AMOUNT_MSG);

        if (utils.isInteger(tokenID)) tokenID = tokenID.toString();

        if (!utils.isString(tokenID)) return callback(INVALID_TOKEN_ID_MSG);

        options = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options.privateKey && !options.address)
            return callback(NEED_PK_OR_ADDRESS_MSG);

        try {
            const address = (
                options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address
            ) as string;
            const transaction = await this.tronWeb.transactionBuilder.sendToken(
                to,
                amount,
                tokenID,
                address,
            );
            const signedTransaction = await this.sign(
                transaction,
                options.privateKey || undefined,
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
    async freezeBalance(
        amount: number,
        duration?: number,
        resource?: ResourceT,
        options?: IAddressOrPk | string,
        receiverAddress?: string,
        callback?: undefined,
    ): Promise<IBroadcastResult>;
    async freezeBalance(
        amount: number,
        duration: number | undefined,
        resource: ResourceT | undefined,
        options: IAddressOrPk | string | undefined,
        receiverAddress: string | undefined,
        callback: _CallbackT<IBroadcastResult>,
    ): Promise<void>;
    async freezeBalance(
        amount: number,
        duration = 3,
        resource: ResourceT = 'BANDWIDTH',
        options: IAddressOrPk | string = {},
        receiverAddress?: string | undefined,
        callback?: _CallbackT<IBroadcastResult>,
    ): Promise<void | IBroadcastResult> {
        if (typeof options === 'string') options = {privateKey: options};

        if (!callback)
            return this.injectPromise(
                this.freezeBalance,
                amount,
                duration,
                resource,
                options,
                receiverAddress,
            );

        if (!['BANDWIDTH', 'ENERGY'].includes(resource))
            return callback(
                'Invalid resource provided: Expected "BANDWIDTH" or "ENERGY"',
            );

        if (!utils.isInteger(amount) || amount <= 0)
            return callback(INVALID_AMOUNT_MSG);

        if (!utils.isInteger(duration) || duration < 3)
            return callback('Invalid duration provided, minimum of 3 days');

        options = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options.privateKey && !options.address)
            return callback(NEED_PK_OR_ADDRESS_MSG);

        try {
            const address = (
                options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address
            ) as string;
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
                options.privateKey || undefined,
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
    async unfreezeBalance(
        resource?: ResourceT,
        options?: IAddressOrPk,
        receiverAddress?: string,
        callback?: undefined,
    ): Promise<IBroadcastResult>;
    async unfreezeBalance(
        resource: ResourceT | undefined,
        options: IAddressOrPk | undefined,
        receiverAddress: string | undefined,
        callback: _CallbackT<IBroadcastResult>,
    ): Promise<void>;
    async unfreezeBalance(
        resource: ResourceT = 'BANDWIDTH',
        options: IAddressOrPk = {},
        receiverAddress?: string | undefined,
        callback?: _CallbackT<IBroadcastResult>,
    ): Promise<void | IBroadcastResult> {
        if (typeof options === 'string') options = {privateKey: options};

        if (!callback)
            return this.injectPromise(
                this.unfreezeBalance,
                resource,
                options,
                receiverAddress,
            );

        if (!['BANDWIDTH', 'ENERGY'].includes(resource))
            return callback(
                'Invalid resource provided: Expected "BANDWIDTH" or "ENERGY"',
            );

        options = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options.privateKey && !options.address)
            return callback(NEED_PK_OR_ADDRESS_MSG);

        try {
            const address = (
                options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address
            ) as string;
            const unfreezeBalance =
                await this.tronWeb.transactionBuilder.unfreezeBalance(
                    resource,
                    address,
                    receiverAddress,
                );
            const signedTransaction = await this.sign(
                unfreezeBalance,
                options.privateKey || undefined,
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
        options?: IAddressOrPk,
        callback?: undefined,
    ): Promise<IBroadcastResult>;
    async updateAccount(
        accountName: string,
        options: IAddressOrPk | undefined,
        callback?: _CallbackT<IBroadcastResult>,
    ): Promise<void>;
    async updateAccount(
        accountName: string,
        options?: IAddressOrPk,
        callback?: _CallbackT<IBroadcastResult>,
    ): Promise<void | IBroadcastResult> {
        if (typeof options === 'string') options = {privateKey: options};

        if (!callback)
            return this.injectPromise(this.updateAccount, accountName, options);

        if (!utils.isString(accountName) || !accountName.length)
            return callback('Name must be a string');

        options = {
            privateKey: this.tronWeb.defaultPrivateKey,
            address: this.tronWeb.defaultAddress.hex,
            ...options,
        };

        if (!options.privateKey && !options.address)
            return callback(NEED_PK_OR_ADDRESS_MSG);

        try {
            const address = (
                options.privateKey
                    ? this.tronWeb.address.fromPrivateKey(options.privateKey)
                    : options.address
            ) as string;
            const updateAccount =
                await this.tronWeb.transactionBuilder.updateAccount(
                    accountName,
                    address,
                );
            const signedTransaction = await this.sign(
                updateAccount,
                options.privateKey || undefined,
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
    getUnconfirmedTransactionInfo: Trx['getUnconfirmedTransaction'] =
        this.getUnconfirmedTransaction.bind(this);

    /**
     * Gets a network modification proposal by ID.
     */
    getProposal(proposalID: number, callback?: undefined): Promise<IProposal>;
    getProposal(proposalID: number, callback: _CallbackT<IProposal>): void;
    getProposal(
        proposalID: number,
        callback?: _CallbackT<IProposal>,
    ): void | Promise<IProposal> {
        if (!callback) return this.injectPromise(this.getProposal, proposalID);

        if (!utils.isInteger(proposalID) || proposalID < 0)
            return callback('Invalid proposalID provided');

        this.tronWeb.fullNode
            .request(
                'wallet/getproposalbyid',
                {id: parseInt(proposalID.toString())},
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
    listProposals(callback: _CallbackT<IProposal[]>): void;
    listProposals(
        callback?: _CallbackT<IProposal[]>,
    ): void | Promise<IProposal[]> {
        if (!callback) return this.injectPromise(this.listProposals);

        this.tronWeb.fullNode
            .request('wallet/listproposals', {}, 'post')
            .then(({proposals = []}) => {
                callback(null, proposals);
            })
            .catch((err) => callback(err));
    }

    /**
     * Lists all parameters available for network modification proposals.
     */
    getChainParameters(callback?: undefined): Promise<IChainParameter[]>;
    getChainParameters(callback: _CallbackT<IChainParameter[]>): void;
    getChainParameters(
        callback?: _CallbackT<IChainParameter[]>,
    ): void | Promise<IChainParameter[]> {
        if (!callback) return this.injectPromise(this.getChainParameters);

        this.tronWeb.fullNode
            .request('wallet/getchainparameters', {}, 'post')
            .then(({chainParameter = []}) => {
                callback(null, chainParameter);
            })
            .catch((err) => callback(err));
    }

    /**
     * Get the account resources
     */
    getAccountResources(
        address: string,
        callback?: undefined,
    ): Promise<IAccountResource>;
    getAccountResources(
        address: string,
        callback: _CallbackT<IAccountResource>,
    ): void;
    getAccountResources(
        address: string,
        callback?: _CallbackT<IAccountResource>,
    ): void | Promise<IAccountResource> {
        if (!callback)
            return this.injectPromise(this.getAccountResources, address);

        if (!this.tronWeb.isAddress(address))
            return callback(INVALID_ADDRESS_MSG);

        this.tronWeb.fullNode
            .request(
                'wallet/getaccountresource',
                {address: this.tronWeb.address.toHex(address)} as IAccount,
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
    getExchangeByID(exchangeID: number, callback: _CallbackT<IExchange>): void;
    getExchangeByID(
        exchangeID: number,
        callback?: _CallbackT<IExchange>,
    ): void | Promise<IExchange> {
        if (!callback)
            return this.injectPromise(this.getExchangeByID, exchangeID);

        if (!utils.isInteger(exchangeID) || exchangeID < 0)
            return callback('Invalid exchangeID provided');

        this.tronWeb.fullNode
            .request('wallet/getexchangebyid', {id: exchangeID}, 'post')
            .then((exchange) => {
                callback(null, exchange);
            })
            .catch((err) => callback(err));
    }

    /**
     * Lists the exchanges
     */
    listExchanges(callback?: undefined): Promise<IExchange[]>;
    listExchanges(callback: _CallbackT<IExchange[]>): void;
    listExchanges(
        callback?: _CallbackT<IExchange[]>,
    ): void | Promise<IExchange[]> {
        if (!callback) return this.injectPromise(this.listExchanges);

        this.tronWeb.fullNode
            .request('wallet/listexchanges', {}, 'post')
            .then(({exchanges = []}) => {
                callback(null, exchanges);
            })
            .catch((err) => callback(err));
    }

    /**
     * Lists all network modification proposals.
     */
    listExchangesPaginated(
        limit?: number,
        offset?: number,
        callback?: undefined,
    ): Promise<IExchange[]>;
    listExchangesPaginated(
        limit: number | undefined,
        offset: number | undefined,
        callback: _CallbackT<IExchange[]>,
    ): void;
    listExchangesPaginated(
        limit = 0,
        offset = 0,
        callback?: _CallbackT<IExchange[]>,
    ): void | Promise<IExchange[]> {
        if (!callback)
            return this.injectPromise(
                this.listExchangesPaginated,
                limit,
                offset,
            );

        this.tronWeb.fullNode
            .request('wallet/getpaginatedexchangelist', {limit, offset}, 'post')
            .then(({exchanges = []}) => {
                callback(null, exchanges);
            })
            .catch((err) => callback(err));
    }

    /**
     * Get info about the node
     */
    getNodeInfo(callback?: undefined): Promise<INodeInfo>;
    getNodeInfo(callback: _CallbackT<INodeInfo>): void;
    getNodeInfo(callback?: _CallbackT<INodeInfo>): void | Promise<INodeInfo> {
        if (!callback) return this.injectPromise(this.getNodeInfo);

        this.tronWeb.fullNode
            .request('wallet/getnodeinfo', {}, 'post')
            .then((info) => {
                callback(null, info);
            })
            .catch((err) => callback(err));
    }

    getTokenListByName(
        tokenID: string | number,
        callback?: undefined,
    ): Promise<IToken[]>;
    getTokenListByName(
        tokenID: string | number,
        callback: _CallbackT<IToken[]>,
    ): void;
    getTokenListByName(
        tokenID: string | number,
        callback?: _CallbackT<IToken[]>,
    ): void | Promise<IToken[]> {
        if (!callback)
            return this.injectPromise(this.getTokenListByName, tokenID);

        if (utils.isInteger(tokenID)) tokenID = tokenID.toString();

        if (!utils.isString(tokenID) || !tokenID.length)
            return callback(INVALID_TOKEN_ID_MSG);

        this.tronWeb.fullNode
            .request(
                'wallet/getassetissuelistbyname',
                {value: this.tronWeb.fromUtf8(tokenID)},
                'post',
            )
            .then((token) => {
                if (Array.isArray(token.assetIssue))
                    return callback(
                        null,
                        token.assetIssue.map((t) => this._parseToken(t)),
                    );
                else if (!('name' in token) || !(token as any).name)
                    return callback(TOKEN_DOES_NOT_EXIST_MSG);
                // TODO: borrowed from old impl. This should never happen
                else return callback(null, [this._parseToken(token as any)]);
            })
            .catch((err) => callback(err));
    }

    getTokenByID(
        tokenID: string | number,
        callback?: undefined,
    ): Promise<IToken>;
    getTokenByID(tokenID: string | number, callback: _CallbackT<IToken>): void;
    getTokenByID(
        tokenID: string | number,
        callback?: _CallbackT<IToken>,
    ): void | Promise<IToken> {
        if (!callback) return this.injectPromise(this.getTokenByID, tokenID);

        if (utils.isInteger(tokenID)) tokenID = tokenID.toString();

        if (!utils.isString(tokenID) || !tokenID.length)
            return callback(INVALID_TOKEN_ID_MSG);

        this.tronWeb.fullNode
            .request('wallet/getassetissuebyid', {value: tokenID}, 'post')
            .then((token) => {
                if (!token.name) return callback(TOKEN_DOES_NOT_EXIST_MSG);

                callback(null, this._parseToken(token));
            })
            .catch((err) => callback(err));
    }

    async getReward(
        address: string,
        options?: {confirmed?: boolean},
        callback?: undefined,
    ): Promise<number>;
    async getReward(
        address: string,
        options: {confirmed?: boolean},
        callback: _CallbackT<number>,
    ): Promise<void>;
    async getReward(
        address: string,
        options: {confirmed?: boolean} = {},
        callback?: _CallbackT<number>,
    ): Promise<void | number> {
        options.confirmed = true;
        return this._getReward(address, options, callback as any);
    }

    async getUnconfirmedReward(
        address: string,
        options?: {confirmed?: boolean},
        callback?: undefined,
    ): Promise<number>;
    async getUnconfirmedReward(
        address: string,
        options: {confirmed?: boolean},
        callback: _CallbackT<number>,
    ): Promise<void>;
    async getUnconfirmedReward(
        address: string,
        options: {confirmed?: boolean} = {},
        callback?: _CallbackT<number>,
    ): Promise<void | number> {
        options.confirmed = false;
        return this._getReward(address, options, callback as any);
    }

    async getBrokerage(
        address: string,
        options?: {confirmed?: boolean},
        callback?: undefined,
    ): Promise<number>;
    async getBrokerage(
        address: string,
        options: {confirmed?: boolean},
        callback: _CallbackT<number>,
    ): Promise<void>;
    async getBrokerage(
        address: string,
        options: {confirmed?: boolean} = {},
        callback?: _CallbackT<number>,
    ): Promise<void | number> {
        options.confirmed = true;
        return this._getBrokerage(address, options, callback as any);
    }

    async getUnconfirmedBrokerage(
        address: string,
        options?: {confirmed?: boolean},
        callback?: undefined,
    ): Promise<number>;
    async getUnconfirmedBrokerage(
        address: string,
        options: {confirmed?: boolean},
        callback: _CallbackT<number>,
    ): Promise<void>;
    async getUnconfirmedBrokerage(
        address: string,
        options: {confirmed?: boolean} = {},
        callback?: _CallbackT<number>,
    ): Promise<void | number> {
        options.confirmed = false;
        return this._getBrokerage(address, options, callback as any);
    }

    async _getReward(
        address?: string,
        options?: {confirmed?: boolean},
        callback?: undefined,
    ): Promise<number>;
    async _getReward(
        address: string | undefined,
        options: {confirmed?: boolean} | undefined,
        callback: _CallbackT<number>,
    ): Promise<void>;
    async _getReward(
        address: string = this.tronWeb.defaultAddress.hex,
        options: {confirmed?: boolean} = {},
        callback?: _CallbackT<number>,
    ): Promise<void | number> {
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

        const data = {address: toHex(address)};

        (options.confirmed
            ? this.tronWeb.solidityNode.request(
                  'walletsolidity/getReward',
                  data,
                  'post',
              )
            : this.tronWeb.fullNode.request('wallet/getReward', data, 'post')
        )
            .then((result = {}) => {
                if (typeof result.reward === 'undefined')
                    return callback('Not found.');

                callback(null, result.reward);
            })
            .catch((err) => callback(err));
    }

    async _getBrokerage(
        address?: string,
        options?: {confirmed?: boolean},
        callback?: undefined,
    ): Promise<number>;
    async _getBrokerage(
        address: string | undefined,
        options: {confirmed?: boolean} | undefined,
        callback: _CallbackT<number>,
    ): Promise<void>;
    async _getBrokerage(
        address: string = this.tronWeb.defaultAddress.hex,
        options: {confirmed?: boolean} = {},
        callback?: _CallbackT<number>,
    ): Promise<void | number> {
        if (!callback)
            return this.injectPromise(this._getBrokerage, address, options);
        if (!utils.isString(address))
            return callback(`Invalid address: ${address}.`);

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

        const data = {address: toHex(address)};

        (options.confirmed
            ? this.tronWeb.solidityNode.request(
                  'walletsolidity/getBrokerage',
                  data,
                  'post',
              )
            : this.tronWeb.fullNode.request('wallet/getBrokerage', data, 'post')
        )
            .then((result) => {
                if (typeof result.brokerage === 'undefined')
                    return callback('Not found.');

                callback(null, result.brokerage);
            })
            .catch((err) => callback(err));
    }
}
