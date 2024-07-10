import TronWeb from '..';
import Validator from '../paramValidator';
import type { Permission as IPermissions, Transaction, EstimateEnergyResponse } from '../proto/core/Tron';
import { WithTronwebAndInjectpromise } from '../utils/_base';
import type _CallbackT from '../utils/typing';
import type { IAbi } from './contract';
import type { ILog } from './trx';
import { ResourceT } from './trx';
export type { Transaction, Permission as IPermissions } from '../proto/core/Tron';
export interface IPermissionsMinimal extends IPermissions {
    id?: number;
    parent_id?: number;
    operations?: string;
}
export declare type ITransaction = Transaction;
export interface ISignedTransaction extends ITransaction {
    signature: string[];
}
export interface BaseOptions {
    feeLimit?: number;
    userFeePercentage?: number;
    originEnergyLimit?: number;
    callValue?: any;
    tokenValue?: number;
    tokenId?: number | string;
    token_id?: number;
    funcABIV2?: any;
    parametersV2?: any;
    permissionId?: number;
    rawParameter?: string;
    shieldedParameter?: string;
    confirmed?: boolean;
    estimateEnergy?: boolean;
}
export interface ContractOptions extends BaseOptions {
    abi: string | {
        entrys: IAbi[];
    } | IAbi[];
    bytecode: string;
    parameters?: any[] | string;
    shouldPollResponse?: boolean;
    name?: string;
}
export interface ITriggerContractOptions extends BaseOptions {
    _isConstant?: boolean;
}
export interface ITriggerContractEnergyOptions extends BaseOptions {
    estimateEnergy?: boolean;
}
interface IPermissionId {
    permissionId?: number;
}
export interface IUpdateTokenOptions extends IPermissionId {
    description: string;
    url: string;
    freeBandwidth?: number | string;
    freeBandwidthLimit?: number | string;
}
export interface ICreateTokenOptions extends IUpdateTokenOptions {
    name: string;
    abbreviation: string;
    totalSupply: number | string;
    voteScore?: number | string;
    precision?: number | string;
    saleStart?: number | string;
    saleEnd: number | string;
    trxRatio?: number | string;
    tokenRatio?: number | string;
    frozenAmount?: number | string;
    frozenDuration?: number | string;
}
declare type IResources = any;
export interface ITriggerSmartContract {
    transaction: ITransaction;
    result: {
        result: boolean;
    };
}
export interface ITriggerConstantContract extends ITriggerSmartContract {
    energy_used: number;
    constant_result: string[];
    logs: ILog[];
}
export default class TransactionBuilder extends WithTronwebAndInjectpromise {
    validator: Validator;
    constructor(tronWeb: TronWeb);
    sendTrx(to: string, amount?: string | number, from?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    sendTrx(to: string, amount: string | number | undefined, from: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    sendToken(to: string, amount: number | string | undefined, tokenID: string, from?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    sendToken(to: string, amount: number | string | undefined, tokenID: string, from: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    purchaseToken(issuerAddress: string, tokenID: string, amount?: number, buyer?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    purchaseToken(issuerAddress: string, tokenID: string, amount: number | undefined, buyer: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    freezeBalance(amount: number, duration: number, resource?: ResourceT, address?: string, receiverAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    freezeBalance(amount: number, duration: number, resource: ResourceT | undefined, address: string | undefined, receiverAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    unfreezeBalance(resource?: ResourceT, address?: string, receiverAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    unfreezeBalance(resource: ResourceT | undefined, address: string | undefined, receiverAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    withdrawBlockRewards(address?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    withdrawBlockRewards(address: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    applyForSR(address: string | undefined, url: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    applyForSR(address: string | undefined, url: string, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    vote(votes: Record<string, number>, voterAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    vote(votes: Record<string, number>, voterAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    createSmartContract(options: ContractOptions, issuerAddress?: string, callback?: undefined): Promise<ITransaction & {
        contract_address: string;
    }>;
    createSmartContract(options: ContractOptions, issuerAddress: string | undefined, callback?: _CallbackT<ITransaction & {
        contract_address: string;
    }>): void;
    triggerSmartContract(contractAddress: string, functionSelector: string, options: ITriggerContractOptions, parameters?: {
        type: string;
        value: any;
    }[] | undefined, issuerAddress?: string | undefined, callback?: undefined): Promise<ITriggerSmartContract>;
    triggerSmartContract(contractAddress: string, functionSelector: string, options: ITriggerContractOptions, parameters: {
        type: string;
        value: any;
    }[] | undefined, issuerAddress: string | undefined, callback: _CallbackT<ITriggerSmartContract>): void;
    triggerConstantContract(contractAddress: string, functionSelector: string, options: ITriggerContractOptions, parameters?: {
        type: string;
        value: any;
    }[], issuerAddress?: string, callback?: undefined): Promise<ITriggerConstantContract>;
    triggerConstantContract(contractAddress: string, functionSelector: string, options: ITriggerContractOptions, parameters: {
        type: string;
        value: any;
    }[] | undefined, issuerAddress: string | undefined, callback: _CallbackT<ITriggerConstantContract>): void;
    triggerConfirmedConstantContract(contractAddress: string, functionSelector: string, options: ITriggerContractOptions, parameters?: {
        type: string;
        value: any;
    }[], issuerAddress?: string, callback?: undefined): Promise<ITriggerConstantContract>;
    triggerConfirmedConstantContract(contractAddress: string, functionSelector: string, options: ITriggerContractOptions, parameters: {
        type: string;
        value: any;
    }[] | undefined, issuerAddress: string | undefined, callback: _CallbackT<ITriggerConstantContract>): void;
    estimateEnergy(...params: any[]): void | Promise<EstimateEnergyResponse>;
    _triggerSmartContract(contractAddress: string, functionSelector: string, options: ITriggerContractOptions, parameters?: {
        type: string;
        value: any;
    }[], issuerAddress?: string, callback?: undefined): Promise<ITriggerSmartContract>;
    _triggerSmartContract(contractAddress: string, functionSelector: string, options: ITriggerContractOptions, parameters: {
        type: string;
        value: any;
    }[] | undefined, issuerAddress: string | undefined, callback: _CallbackT<ITriggerSmartContract>): void;
    _estimateEnergyCall(contractAddress: string, functionSelector: string, options: ITriggerContractEnergyOptions, parameters: {
        type: string;
        value: any;
    }[], issuerAddress: string, callback?: _CallbackT<EstimateEnergyResponse>): void | Promise<EstimateEnergyResponse>;
    clearABI(contractAddress: string, ownerAddress?: string, callback?: undefined): void | Promise<ITransaction>;
    clearABI(contractAddress: string, ownerAddress: string | undefined, callback: _CallbackT<ITransaction>): void | Promise<ITransaction>;
    updateBrokerage(brokerage: number, ownerAddress?: string, callback?: undefined): void | Promise<ITransaction>;
    updateBrokerage(brokerage: number, ownerAddress: string | undefined, callback: _CallbackT<ITransaction>): void | Promise<ITransaction>;
    createToken(options: ICreateTokenOptions, issuerAddress?: string, callback?: undefined): Promise<ITransaction>;
    createToken(options: ICreateTokenOptions, issuerAddress: string | undefined, callback: _CallbackT<ITransaction>): void;
    updateAccount(accountName: string, address?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    updateAccount(accountName: string, address: string | undefined, options: IPermissionId, callback: _CallbackT<ITransaction>): Promise<ITransaction>;
    setAccountId(accountId: string, address?: string, callback?: undefined): Promise<ITransaction>;
    setAccountId(accountId: string, address: string | undefined, callback: _CallbackT<ITransaction>): void;
    updateToken(options: IUpdateTokenOptions & IPermissionId, issuerAddress?: string, callback?: undefined): Promise<ITransaction>;
    updateToken(options: IUpdateTokenOptions & IPermissionId, issuerAddress: string | undefined, callback: _CallbackT<ITransaction>): void;
    sendAsset: TransactionBuilder['sendToken'];
    purchaseAsset: TransactionBuilder['purchaseToken'];
    createAsset: TransactionBuilder['createToken'];
    updateAsset: TransactionBuilder['updateToken'];
    /**
     * Creates a proposal to modify the network.
     * Can only be created by a current Super Representative.
     */
    createProposal(parameters: {
        key: number;
        value: number;
    } | {
        key: number;
        value: number;
    }[], issuerAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    createProposal(parameters: {
        key: number;
        value: number;
    } | {
        key: number;
        value: number;
    }[], issuerAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    /**
     * Deletes a network modification proposal that the owner issued.
     * Only current Super Representative can vote on a proposal.
     */
    deleteProposal(proposalID: number, issuerAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    deleteProposal(proposalID: number, issuerAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    /**
     * Adds a vote to an issued network modification proposal.
     * Only current Super Representative can vote on a proposal.
     */
    voteProposal(proposalID: number, isApproval: boolean, voterAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    voteProposal(proposalID: number, isApproval: boolean, voterAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    /**
     * Create an exchange between a token and TRX.
     * Token Name should be a CASE SENSITIVE string.
     * PLEASE VERIFY THIS ON TRONSCAN.
     */
    createTRXExchange(tokenName: string, tokenBalance: number, trxBalance: number, ownerAddress?: string, options?: IPermissionId, callback?: undefined): Promise<IResources>;
    createTRXExchange(tokenName: string, tokenBalance: number, trxBalance: number, ownerAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<IResources>): void;
    /**
     * Create an exchange between a token and another token.
     * DO NOT USE THIS FOR TRX.
     * Token Names should be a CASE SENSITIVE string.
     * PLEASE VERIFY THIS ON TRONSCAN.
     */
    createTokenExchange(firstTokenName: string, firstTokenBalance: number, secondTokenName: string, secondTokenBalance: number, ownerAddress?: string, options?: IPermissionId, callback?: undefined): Promise<IResources>;
    createTokenExchange(firstTokenName: string, firstTokenBalance: number, secondTokenName: string, secondTokenBalance: number, ownerAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<IResources>): void;
    /**
     * Adds tokens into a bancor style exchange.
     * Will add both tokens at market rate.
     * Use "_" for the constant value for TRX.
     */
    injectExchangeTokens(exchangeID: number, tokenName: string, tokenAmount: number, ownerAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    injectExchangeTokens(exchangeID: number, tokenName: string, tokenAmount: number, ownerAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    /**
     * Withdraws tokens from a bancor style exchange.
     * Will withdraw at market rate both tokens.
     * Use "_" for the constant value for TRX.
     */
    withdrawExchangeTokens(exchangeID: number, tokenName: string, tokenAmount: number, ownerAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    withdrawExchangeTokens(exchangeID: number, tokenName: string, tokenAmount: number, ownerAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    /**
     * Trade tokens on a bancor style exchange.
     * Expected value is a validation and used to cap the total amt of token 2 spent.
     * Use "_" for the constant value for TRX.
     */
    tradeExchangeTokens(exchangeID: number, tokenName: string, tokenAmountSold: number, tokenAmountExpected: number, ownerAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    tradeExchangeTokens(exchangeID: number, tokenName: string, tokenAmountSold: number, tokenAmountExpected: number, ownerAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    /**
     * Update userFeePercentage.
     */
    updateSetting(contractAddress: string, userFeePercentage: number, ownerAddress?: string, options?: IPermissionId, callback?: undefined): Promise<ITransaction>;
    updateSetting(contractAddress: string, userFeePercentage: number, ownerAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    /**
     * Update energy limit.
     */
    updateEnergyLimit(contractAddress: string, originEnergyLimit: number, ownerAddress?: string, options?: IPermissionId, callback?: unknown): Promise<ITransaction>;
    updateEnergyLimit(contractAddress: string, originEnergyLimit: number, ownerAddress: string | undefined, options: IPermissionId | undefined, callback: _CallbackT<ITransaction>): void;
    checkPermissions(permissions: IPermissionsMinimal | null | undefined, type: number): boolean;
    updateAccountPermissions(ownerAddress?: string, ownerPermissions?: IPermissionsMinimal, witnessPermissions?: IPermissionsMinimal, activesPermissions?: IPermissionsMinimal | (IPermissionsMinimal | undefined)[], callback?: unknown): Promise<ITransaction>;
    updateAccountPermissions(ownerAddress: string | undefined, ownerPermissions: IPermissionsMinimal | undefined, witnessPermissions: IPermissionsMinimal | undefined, activesPermissions: IPermissionsMinimal | (IPermissionsMinimal | undefined)[] | undefined, callback: _CallbackT<ITransaction>): void;
    newTxID(transaction: ITransaction, callback?: undefined): Promise<ITransaction>;
    newTxID(transaction: ITransaction, callback: _CallbackT<ITransaction>): Promise<void>;
    alterTransaction(transaction: ITransaction, options: ({} | {
        data: unknown;
        dataFormat?: string;
    }) & {
        extension?: number;
    }, callback?: undefined): Promise<ITransaction>;
    alterTransaction(transaction: ITransaction, options: ({} | {
        data: unknown;
        dataFormat?: string;
    }) & {
        extension?: number;
    }, callback: _CallbackT<ITransaction>): Promise<void>;
    extendExpiration(transaction: ITransaction, extension: number, callback?: undefined): Promise<ITransaction>;
    extendExpiration(transaction: ITransaction, extension: number, callback: _CallbackT<ITransaction>): Promise<void>;
    addUpdateData(transaction: ITransaction, data: string, dataFormat?: string, callback?: undefined): Promise<ITransaction>;
    addUpdateData(transaction: ITransaction, data: string, dataFormat: string | undefined, callback: _CallbackT<ITransaction>): Promise<void>;
}
//# sourceMappingURL=transactionBuilder.d.ts.map