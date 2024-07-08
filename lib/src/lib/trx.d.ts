import TronWeb from '..';
import { WithTronwebAndInjectpromise } from '../../src/utils/_base';
import Validator from '../paramValidator';
import type { AccountResourceMessage as IAccountResource, BlockExtention as IBlockExtention, TransactionSignWeight as ISignWeight, TransactionApprovedList as ITransactionApprovedList, TransactionExtention as ITransactionExtention } from '../proto/api/api';
import type { Account as IAccount, ChainParameters_ChainParameter as IChainParameter, Exchange as IExchange, NodeInfo as INodeInfo, Proposal as IProposal, TransactionInfo as ITransactionInfo, Witness as IWitness } from '../proto/core/Tron';
import type { AssetIssueContract as IToken } from '../proto/core/contract/asset_issue_contract';
import { ResourceCode as ResourceT } from '../proto/core/contract/common';
import type { SmartContract as ISmartContract } from '../proto/core/contract/smart_contract';
import type { SomeBytes } from '../utils/bytes';
import type { TypedDataTypes } from '../utils/crypto';
import type { IDomain } from '../utils/typedData';
import type _CallbackT from '../utils/typing';
import type { ISignedTransaction, Transaction as ITransaction } from './transactionBuilder';
export { ResourceCode as ResourceT } from '../proto/core/contract/common';
export declare type BlockT = number | 'latest' | 'earliest' | string;
export type { Block as IBlock, TransactionInfo_Log as ILog, TransactionInfo as ITransactionInfo, Account as IAccount, Proposal as IProposal, Exchange as IExchange, Witness as IWitness, ChainParameters_ChainParameter as IChainParameter, NodeInfo as INodeInfo, } from '../proto/core/Tron';
export type { TransactionExtention as ITransactionExtention, TransactionSignWeight as ISignWeight, BlockExtention as IBlockExtention, TransactionApprovedList as ITransactionApprovedList, AccountResourceMessage as IAccountResource, } from '../proto/api/api';
export type { SmartContract as ISmartContract } from '../proto/core/contract/smart_contract';
export type { AssetIssueContract as IToken } from '../proto/core/contract/asset_issue_contract';
export declare type MakeSigned<T> = T extends string ? T : T & {
    signature: string[];
};
export declare type IBroadcastResult = {
    code: string;
    message: string;
} & ({
    result: true;
    transaction: ISignedTransaction;
    txid: string;
} | {
    result: false;
});
export declare type IBroadcastHexResult = {
    code: string;
    message: string;
} & ({
    result: true;
    transaction: ISignedTransaction;
    hexTransaction: string;
} | {
    result: false;
});
export interface IAddressOrPk {
    privateKey?: string;
    address?: string;
}
export default class Trx extends WithTronwebAndInjectpromise {
    cache: {
        contracts: Record<string, ISmartContract>;
    };
    validator: Validator;
    constructor(tronWeb: TronWeb);
    _parseToken(token: IToken): IToken;
    getCurrentBlock(callback?: undefined): Promise<IBlockExtention>;
    getCurrentBlock(callback: _CallbackT<IBlockExtention>): void;
    getConfirmedCurrentBlock(callback?: undefined): Promise<IBlockExtention>;
    getConfirmedCurrentBlock(callback: _CallbackT<IBlockExtention>): void;
    getBlock(block?: BlockT | null, callback?: undefined): Promise<IBlockExtention>;
    getBlock(block: BlockT | null | undefined, callback: _CallbackT<IBlockExtention>): void;
    getBlockByHash(blockHash: string, callback?: undefined): Promise<IBlockExtention>;
    getBlockByHash(blockHash: string, callback: _CallbackT<IBlockExtention>): void;
    getBlockByNumber(blockID: number, callback?: undefined): Promise<IBlockExtention>;
    getBlockByNumber(blockID: number, callback: _CallbackT<IBlockExtention>): void;
    getBlockTransactionCount(block?: BlockT | null | undefined): Promise<number>;
    getBlockTransactionCount(block: BlockT | null | undefined, callback: _CallbackT<number>): void;
    getTransactionFromBlock(block?: BlockT | null): Promise<ITransaction[]>;
    getTransactionFromBlock(block: BlockT | null | undefined, index: number): Promise<ITransaction>;
    getTransactionFromBlock(block: BlockT | null | undefined, index: null | undefined, callback: _CallbackT<ITransaction[]>): void;
    getTransactionFromBlock(block: BlockT | null | undefined, index: number, callback: _CallbackT<ITransaction>): void;
    getTransaction(transactionID: string, callback?: undefined): Promise<ITransaction>;
    getTransaction(transactionID: string, callback: _CallbackT<ITransaction>): void;
    getConfirmedTransaction(transactionID: string, callback?: undefined): Promise<ITransaction>;
    getConfirmedTransaction(transactionID: string, callback: _CallbackT<ITransaction>): void;
    getUnconfirmedTransaction(transactionID: string, callback?: undefined): Promise<ITransactionInfo>;
    getUnconfirmedTransaction(transactionID: string, callback: _CallbackT<ITransactionInfo>): void;
    getTransactionInfo(transactionID: string, callback?: undefined): Promise<ITransactionInfo>;
    getTransactionInfo(transactionID: string, callback: _CallbackT<ITransactionInfo>): void;
    _getTransactionInfoById(transactionID: string, options: {
        confirmed: boolean;
    }, callback?: undefined): Promise<ITransactionInfo>;
    _getTransactionInfoById(transactionID: string, options: {
        confirmed: boolean;
    }, callback: _CallbackT<ITransactionInfo>): void;
    /**
     * @deprecated This api is no longer supported in the latest version
     * You can use the central node api: 47.90.247.237:8091/walletextension/gettransactionsfromthis
     */
    getTransactionsToAddress(address?: string, limit?: number, offset?: number, callback?: undefined): Promise<ITransactionExtention[]>;
    getTransactionsToAddress(address: string | undefined, limit: number | undefined, offset: number | undefined, callback: _CallbackT<ITransactionExtention[]>): Promise<void>;
    /**
     * @deprecated This api is no longer supported in the latest version
     * You can use the central node api: 47.90.247.237:8091/walletextension/gettransactionsfromthis
     */
    getTransactionsFromAddress(address?: string, limit?: number, offset?: number, callback?: undefined): Promise<ITransactionExtention[]>;
    getTransactionsFromAddress(address: string | undefined, limit: number | undefined, offset: number | undefined, callback: _CallbackT<ITransactionExtention[]>): Promise<void>;
    /**
     * @deprecated This api is no longer supported in the latest version
     * You can use the central node api: 47.90.247.237:8091/walletextension/gettransactionsfromthis
     */
    getTransactionsRelated(address?: string, direction?: 'all', limit?: number, offset?: number, callback?: undefined): Promise<(ITransactionExtention & {
        direction: 'to' | 'from';
    })[]>;
    getTransactionsRelated(address?: string, direction?: 'to' | 'from', limit?: number, offset?: number, callback?: undefined): Promise<ITransactionExtention[]>;
    getTransactionsRelated(address: string | undefined, direction: 'all' | undefined, limit: number | undefined, offset: number | undefined, callback: _CallbackT<(ITransactionExtention & {
        direction: 'to' | 'from';
    })[]>): Promise<void>;
    getTransactionsRelated(address: string | undefined, direction: 'to' | 'from', limit: number | undefined, offset: number | undefined, callback: _CallbackT<ITransactionExtention[]>): Promise<void>;
    getAccount(address?: string, callback?: undefined): Promise<IAccount>;
    getAccount(address: string | undefined, callback: _CallbackT<IAccount>): void;
    getAccountById(id: string, callback?: undefined): Promise<IAccount>;
    getAccountById(id: string, callback: _CallbackT<IAccount>): void;
    getAccountInfoById(id: string, options: {
        confirmed?: boolean;
    } | undefined, callback: _CallbackT<IAccount>): void;
    getBalance(address?: string, callback?: undefined): Promise<number>;
    getBalance(address: string, callback: _CallbackT<number>): void;
    getUnconfirmedAccount(address?: string, callback?: undefined): Promise<IAccount>;
    getUnconfirmedAccount(address: string, callback: _CallbackT<IAccount>): void;
    getUnconfirmedAccountById(id: string, callback?: undefined): Promise<IAccount>;
    getUnconfirmedAccountById(id: string, callback: _CallbackT<IAccount>): void;
    getUnconfirmedBalance(address?: string, callback?: undefined): Promise<number>;
    getUnconfirmedBalance(address: string, callback: _CallbackT<number>): void;
    getBandwidth(address?: string, callback?: undefined): Promise<number>;
    getBandwidth(address: string, callback: _CallbackT<number>): void;
    getTokensIssuedByAddress(address?: string, callback?: undefined): Promise<Record<string, IToken>>;
    getTokensIssuedByAddress(address: string, callback: _CallbackT<Record<string, IToken>>): void;
    getTokenFromID(tokenID: string | number, callback?: undefined): Promise<IToken>;
    getTokenFromID(tokenID: string | number, callback: _CallbackT<IToken>): void;
    listNodes(callback?: undefined): Promise<string[]>;
    listNodes(callback: _CallbackT<string[]>): void;
    getBlockRange(start?: number, end?: number, callback?: undefined): Promise<IBlockExtention[]>;
    getBlockRange(start: number | undefined, end: number | undefined, callback: _CallbackT<IBlockExtention[]>): void;
    listSuperRepresentatives(callback?: undefined): Promise<IWitness[]>;
    listSuperRepresentatives(callback: _CallbackT<IWitness[]>): void;
    listTokens(limit?: number, offset?: number, callback?: undefined): Promise<IToken[]>;
    listTokens(limit: number | undefined, offset: number | undefined, callback: _CallbackT<IToken[]>): void;
    timeUntilNextVoteCycle(callback?: undefined): Promise<number>;
    timeUntilNextVoteCycle(callback: _CallbackT<number>): void;
    getContract(contractAddress: string, callback?: undefined): Promise<ISmartContract>;
    getContract(contractAddress: string, callback: _CallbackT<ISmartContract>): void;
    verifyMessage(message: string, signature: string, address?: string, useTronHeader?: boolean, callback?: undefined): Promise<boolean>;
    verifyMessage(message: string, signature: string, address: string | undefined, useTronHeader: boolean | undefined, callback: _CallbackT<boolean>): Promise<void>;
    static verifySignature(message: string, address: string, signature: string, useTronHeader?: boolean | undefined): boolean;
    verifyMessageV2(message: string, signature: string, options: _CallbackT<string>, callback?: undefined): void;
    verifyMessageV2(message: string, signature: string, options: undefined, callback?: undefined): Promise<string>;
    verifyMessageV2(message: string, signature: string, options: undefined, callback: _CallbackT<string>): void;
    static verifyMessageV2(message: string, signature: string): string;
    verifyTypedData(domain: IDomain, types: TypedDataTypes, value: Record<string, unknown>, signature: string, address?: string, callback?: undefined): Promise<boolean>;
    verifyTypedData(domain: IDomain, types: TypedDataTypes, value: Record<string, unknown>, signature: string, address: string | undefined, callback: _CallbackT<boolean>): void;
    static verifyTypedData(domain: IDomain, types: TypedDataTypes, value: Record<string, unknown>, signature: string, address: string): boolean;
    sign<T extends string | ITransaction>(transaction: T, privateKey?: string, useTronHeader?: boolean, multisig?: boolean, callback?: undefined): Promise<MakeSigned<T>>;
    sign<T extends string | ITransaction>(transaction: T, privateKey: string | undefined, useTronHeader: boolean | undefined, multisig: boolean | undefined, callback: _CallbackT<MakeSigned<T>>): Promise<void>;
    static signString(message: string, privateKey: string, useTronHeader?: boolean | undefined): string;
    signString(message: string, privateKey: string, useTronHeader?: boolean | undefined): string;
    /**
     * Sign message v2 for verified header length.
     *
     * @param {message to be signed, should be Bytes or string} message
     * @param {privateKey for signature} privateKey
     * @param {reserved} options
     * @param {callback function} callback
     */
    signMessageV2(message: SomeBytes | string, privateKey?: string, options?: undefined, callback?: undefined): Promise<string>;
    signMessageV2(message: SomeBytes | string, privateKey: string | undefined, options: undefined, callback: _CallbackT<string>): void;
    static signMessageV2(message: SomeBytes | string, privateKey: string): string;
    _signTypedData(domain: IDomain, types: TypedDataTypes, value: Record<string, unknown>): Promise<string>;
    _signTypedData(domain: IDomain, types: TypedDataTypes, value: Record<string, unknown>, privateKey: _CallbackT<string>): void;
    _signTypedData(domain: IDomain, types: TypedDataTypes, value: Record<string, unknown>, privateKey: string, callback?: undefined): Promise<string>;
    _signTypedData(domain: IDomain, types: TypedDataTypes, value: Record<string, unknown>, privateKey: string, callback: _CallbackT<string>): void;
    static _signTypedData(domain: IDomain, types: TypedDataTypes, value: Record<string, unknown>, privateKey: string): string;
    multiSign(transaction: ITransaction, privateKey?: string, permissionId?: number, callback?: undefined): Promise<ISignedTransaction>;
    multiSign(transaction: ITransaction, privateKey: string | undefined, permissionId: number | undefined, callback: _CallbackT<ISignedTransaction>): Promise<void>;
    getApprovedList(transaction: ITransaction, callback?: undefined): Promise<any>;
    getApprovedList(transaction: ITransaction, callback: _CallbackT<ITransactionApprovedList>): Promise<void>;
    getSignWeight(transaction: ITransaction, permissionId?: number, callback?: undefined): Promise<ISignWeight>;
    getSignWeight(transaction: ITransaction, permissionId: number | undefined, callback?: _CallbackT<ISignWeight>): Promise<void>;
    sendRawTransaction(signedTransaction: ITransaction, options?: undefined, callback?: undefined): Promise<IBroadcastResult>;
    sendRawTransaction(signedTransaction: ITransaction, options: undefined, callback: _CallbackT<IBroadcastResult>): void;
    /**
     * Broadcast a transaction in hex form
     *  Warning: This method is missing in .proto and absent in docker test node
     */
    sendHexTransaction(signedHexTransaction: string, options?: undefined, callback?: undefined): Promise<IBroadcastHexResult>;
    sendHexTransaction(signedHexTransaction: string, options: undefined, callback: _CallbackT<IBroadcastHexResult>): void;
    sendTransaction(to: string, amount: number, options?: string | IAddressOrPk, callback?: undefined): Promise<IBroadcastResult>;
    sendTransaction(to: string, amount: number, options: string | IAddressOrPk | undefined, callback?: _CallbackT<IBroadcastResult>): Promise<void>;
    sendToken(to: string, amount: number, tokenID: string | number, options?: string | IAddressOrPk, callback?: undefined): Promise<IBroadcastResult>;
    sendToken(to: string, amount: number, tokenID: string | number, options: string | IAddressOrPk | undefined, callback?: _CallbackT<IBroadcastResult>): Promise<void>;
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
    freezeBalance(amount: number, duration?: number, resource?: ResourceT, options?: IAddressOrPk | string, receiverAddress?: string, callback?: undefined): Promise<IBroadcastResult>;
    freezeBalance(amount: number, duration: number | undefined, resource: ResourceT | undefined, options: IAddressOrPk | string | undefined, receiverAddress: string | undefined, callback: _CallbackT<IBroadcastResult>): Promise<void>;
    /**
     * Unfreeze TRX that has passed the minimum freeze duration.
     * Unfreezing will remove bandwidth and TRON Power.
     *
     * @param resource - is the type, must be either "ENERGY" or "BANDWIDTH"
     * @param options
     * @param callback
     */
    unfreezeBalance(resource?: ResourceT, options?: IAddressOrPk, receiverAddress?: string, callback?: undefined): Promise<IBroadcastResult>;
    unfreezeBalance(resource: ResourceT | undefined, options: IAddressOrPk | undefined, receiverAddress: string | undefined, callback: _CallbackT<IBroadcastResult>): Promise<void>;
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
    updateAccount(accountName: string, options?: IAddressOrPk, callback?: undefined): Promise<IBroadcastResult>;
    updateAccount(accountName: string, options: IAddressOrPk | undefined, callback?: _CallbackT<IBroadcastResult>): Promise<void>;
    signMessage: Trx['sign'];
    sendAsset: Trx['sendToken'];
    send: Trx['sendTransaction'];
    sendTrx: Trx['sendTransaction'];
    broadcast: Trx['sendRawTransaction'];
    broadcastHex: Trx['sendHexTransaction'];
    signTransaction: Trx['sign'];
    getUnconfirmedTransactionInfo: Trx['getUnconfirmedTransaction'];
    /**
     * Gets a network modification proposal by ID.
     */
    getProposal(proposalID: number, callback?: undefined): Promise<IProposal>;
    getProposal(proposalID: number, callback: _CallbackT<IProposal>): void;
    /**
     * Lists all network modification proposals.
     */
    listProposals(callback?: undefined): Promise<IProposal[]>;
    listProposals(callback: _CallbackT<IProposal[]>): void;
    /**
     * Lists all parameters available for network modification proposals.
     */
    getChainParameters(callback?: undefined): Promise<IChainParameter[]>;
    getChainParameters(callback: _CallbackT<IChainParameter[]>): void;
    /**
     * Get the account resources
     */
    getAccountResources(address: string, callback?: undefined): Promise<IAccountResource>;
    getAccountResources(address: string, callback: _CallbackT<IAccountResource>): void;
    /**
     * Get the exchange ID.
     */
    getExchangeByID(exchangeID: number, callback?: undefined): Promise<IExchange>;
    getExchangeByID(exchangeID: number, callback: _CallbackT<IExchange>): void;
    /**
     * Lists the exchanges
     */
    listExchanges(callback?: undefined): Promise<IExchange[]>;
    listExchanges(callback: _CallbackT<IExchange[]>): void;
    /**
     * Lists all network modification proposals.
     */
    listExchangesPaginated(limit?: number, offset?: number, callback?: undefined): Promise<IExchange[]>;
    listExchangesPaginated(limit: number | undefined, offset: number | undefined, callback: _CallbackT<IExchange[]>): void;
    /**
     * Get info about the node
     */
    getNodeInfo(callback?: undefined): Promise<INodeInfo>;
    getNodeInfo(callback: _CallbackT<INodeInfo>): void;
    getTokenListByName(tokenID: string | number, callback?: undefined): Promise<IToken[]>;
    getTokenListByName(tokenID: string | number, callback: _CallbackT<IToken[]>): void;
    getTokenByID(tokenID: string | number, callback?: undefined): Promise<IToken>;
    getTokenByID(tokenID: string | number, callback: _CallbackT<IToken>): void;
    getReward(address: string, options?: {
        confirmed?: boolean;
    }, callback?: undefined): Promise<number>;
    getReward(address: string, options: {
        confirmed?: boolean;
    }, callback: _CallbackT<number>): Promise<void>;
    getUnconfirmedReward(address: string, options?: {
        confirmed?: boolean;
    }, callback?: undefined): Promise<number>;
    getUnconfirmedReward(address: string, options: {
        confirmed?: boolean;
    }, callback: _CallbackT<number>): Promise<void>;
    getBrokerage(address: string, options?: {
        confirmed?: boolean;
    }, callback?: undefined): Promise<number>;
    getBrokerage(address: string, options: {
        confirmed?: boolean;
    }, callback: _CallbackT<number>): Promise<void>;
    getUnconfirmedBrokerage(address: string, options?: {
        confirmed?: boolean;
    }, callback?: undefined): Promise<number>;
    getUnconfirmedBrokerage(address: string, options: {
        confirmed?: boolean;
    }, callback: _CallbackT<number>): Promise<void>;
    _getReward(address?: string, options?: {
        confirmed?: boolean;
    }, callback?: undefined): Promise<number>;
    _getReward(address: string | undefined, options: {
        confirmed?: boolean;
    } | undefined, callback: _CallbackT<number>): Promise<void>;
    _getBrokerage(address?: string, options?: {
        confirmed?: boolean;
    }, callback?: undefined): Promise<number>;
    _getBrokerage(address: string | undefined, options: {
        confirmed?: boolean;
    } | undefined, callback: _CallbackT<number>): Promise<void>;
}
//# sourceMappingURL=trx.d.ts.map