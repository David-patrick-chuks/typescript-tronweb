import axios from 'axios';
import {AxiosInstance, Method} from 'axios';

import {Wallet, WalletExtension, WalletSolidity} from '../../proto/api/api';
import {TransactionExtention as ITransactionExtention} from '../../proto/api/api';
import {Transaction as ITransaction} from '../../proto/core/Tron';
import utils from '../../utils';
import {IEventResponse} from '../event';
import {
    serviceToUrl,
    walletExtensionMethods,
    walletMethods,
    walletSolidityMethods,
} from './serviceToUrl';

type NoTransactionExtention<T> = T extends ITransactionExtention
    ? ITransaction
    : T extends ITransactionExtention[]
    ? ITransaction[]
    : T;

// type Primitive = string | number | bigint | boolean | null | undefined | symbol;
// type Replaced<T, TReplace, TWith, TKeep = Primitive, Q = any> = T extends TReplace | TKeep
//     ? (T extends TReplace
//         ? TWith | Exclude<T, TReplace>
//         : T)
//     : (
//         T extends Promise<infer Q>
//         ? Promise<Replaced<Q, TReplace, TWith, TKeep>>
//         : {
//             [P in keyof T]: Replaced<T[P], TReplace, TWith, TKeep>
//         }
//     );
// type NoTransactionExtention<T> = Replaced<T, ITransactionExtention, ITransaction>

export class HttpProvider {
    host: string;
    timeout: number;
    user: string | undefined; // FIXME: type
    password: string | undefined;
    headers: Record<string, string>;
    statusPage: string;
    instance: AxiosInstance;

    constructor(
        host: string,
        timeout = 30000,
        user: string | undefined = undefined,
        password: string | undefined = undefined,
        headers: Record<string, string> = {},
        statusPage = '/',
    ) {
        if (!utils.isValidURL(host))
            throw new Error('Invalid URL provided to HttpProvider');

        if (isNaN(timeout) || timeout < 0)
            throw new Error('Invalid timeout duration provided');

        if (!utils.isObject(headers))
            throw new Error('Invalid headers object provided');

        host = host.replace(/\/+$/, '');

        this.host = host;
        this.timeout = timeout;
        this.user = user;
        this.password = password;
        this.headers = headers;
        this.statusPage = statusPage;

        this.instance = axios.create({
            baseURL: host,
            timeout: timeout,
            headers: headers,
            // TODO: was it a typo? was `user` before, and axios refuse to accept it
            auth:
                user && password
                    ? {
                          // user,
                          username: user,
                          password,
                      }
                    : undefined,
        });
    }

    setStatusPage(statusPage = '/') {
        this.statusPage = statusPage;
    }

    async isConnected(statusPage = this.statusPage) {
        return this.request(statusPage)
            .then((data) => {
                return utils.hasProperties(data, 'blockID', 'block_header');
            })
            .catch(() => false);
    }

    // request(url: 'wallet/getacccount', payload: Parameters<Wallet['GetAccount']>[0], method: 'post'): ReturnType<Wallet['GetAccount']>;
    // request(url: 'wallet/getacccountbyid', payload: Parameters<Wallet['GetAccountById']>[0], method: 'post'): ReturnType<Wallet['GetAccountById']>;
    // request(url: 'wallet/getacccountbalance', payload: Parameters<Wallet['GetAccountBalance']>[0], method: 'post'): ReturnType<Wallet['GetAccountBalance']>;
    // request(url: 'wallet/getblockbalancetrace', payload: Parameters<Wallet['GetBlockBalanceTrace']>[0], method: 'post'): ReturnType<Wallet['GetBlockBalanceTrace']>;
    // request(url: 'wallet/createtransaction', payload: Parameters<Wallet['CreateTransaction2']>[0], method: 'post'): ReturnType<Wallet['CreateTransaction2']>;
    // request(url: 'wallet/broadcasttransaction', payload: Parameters<Wallet['BroadcastTransaction']>[0], method: 'post'): ReturnType<Wallet['BroadcastTransaction']>;
    // request(url: 'wallet/updateaccount', payload: Parameters<Wallet['UpdateAccount2']>[0], method: 'post'): ReturnType<Wallet['UpdateAccount2']>;
    // request(url: 'wallet/setaccountid', payload: Parameters<Wallet['SetAccountId']>[0], method: 'post'): ReturnType<Wallet['SetAccountId']>;
    // request(url: 'wallet/votewitnessaccount', payload: Parameters<Wallet['VoteWitnessAccount2']>[0], method: 'post'): ReturnType<Wallet['VoteWitnessAccount2']>;
    // request(url: 'wallet/updatesetting', payload: Parameters<Wallet['UpdateSetting']>[0], method: 'post'): ReturnType<Wallet['UpdateSetting']>;
    // request(url: 'wallet/updateenergylimit', payload: Parameters<Wallet['UpdateEnergyLimit']>[0], method: 'post'): ReturnType<Wallet['UpdateEnergyLimit']>;
    // request(url: 'wallet/createassetissue', payload: Parameters<Wallet['CreateAssetIssue2']>[0], method: 'post'): ReturnType<Wallet['CreateAssetIssue2']>;
    // request(url: 'wallet/updatewitness', payload: Parameters<Wallet['UpdateWitness2']>[0], method: 'post'): ReturnType<Wallet['UpdateWitness2']>;
    // request(url: 'wallet/createwitness', payload: Parameters<Wallet['CreateWitness2']>[0], method: 'post'): ReturnType<Wallet['CreateWitness2']>;
    // request(url: 'wallet/createaccount', payload: Parameters<Wallet['CreateAccount2']>[0], method: 'post'): ReturnType<Wallet['CreateAccount2']>;
    // request(url: 'wallet/transferasset', payload: Parameters<Wallet['TransferAsset2']>[0], method: 'post'): ReturnType<Wallet['TransferAsset2']>;
    // request(url: 'wallet/participateassetissue', payload: Parameters<Wallet['ParticipateAssetIssue2']>[0], method: 'post'): ReturnType<Wallet['ParticipateAssetIssue2']>;
    // request(url: 'wallet/freezebalance', payload: Parameters<Wallet['FreezeBalance2']>[0], method: 'post'): ReturnType<Wallet['FreezeBalance2']>;
    // request(url: 'wallet/unfreezebalance', payload: Parameters<Wallet['UnfreezeBalance2']>[0], method: 'post'): ReturnType<Wallet['UnfreezeBalance2']>;
    // request(url: 'wallet/unfreezeasset', payload: Parameters<Wallet['UnfreezeAsset2']>[0], method: 'post'): ReturnType<Wallet['UnfreezeAsset2']>;
    // request(url: 'wallet/withdrawbalance', payload: Parameters<Wallet['WithdrawBalance2']>[0], method: 'post'): ReturnType<Wallet['WithdrawBalance2']>;
    // request(url: 'wallet/updateasset', payload: Parameters<Wallet['UpdateAsset2']>[0], method: 'post'): ReturnType<Wallet['UpdateAsset2']>;
    // request(url: 'wallet/proposalcreate', payload: Parameters<Wallet['ProposalCreate']>[0], method: 'post'): ReturnType<Wallet['ProposalCreate']>;
    // request(url: 'wallet/proposalapprove', payload: Parameters<Wallet['ProposalApprove']>[0], method: 'post'): ReturnType<Wallet['ProposalApprove']>;
    // request(url: 'wallet/proposaldelete', payload: Parameters<Wallet['ProposalDelete']>[0], method: 'post'): ReturnType<Wallet['ProposalDelete']>;
    // request(url: 'wallet/buystorage', payload: Parameters<Wallet['BuyStorage']>[0], method: 'post'): ReturnType<Wallet['BuyStorage']>;
    request<T extends string & keyof typeof walletMethods>(
        serviceName: `wallet/${T}` | `/wallet/${T}`,
        payload?: undefined,
        method?: 'get' | 'GET',
    ): ReturnType<Wallet[typeof walletMethods[T]]>;
    request<T extends string & keyof typeof walletMethods>(
        serviceName: `wallet/${T}` | `/wallet/${T}`,
        payload?: Parameters<
            Wallet[typeof walletMethods[T]]
        >[0] extends ITransaction
            ? Parameters<Wallet[typeof walletMethods[T]]>[0]
            : never,
        method?: Method,
    ): ReturnType<Wallet[typeof walletMethods[T]]>;
    request<T extends string & keyof typeof walletMethods>(
        serviceName: `wallet/${T}` | `/wallet/${T}`,
        payload: NoTransactionExtention<
            Parameters<Wallet[typeof walletMethods[T]]>[0]
        >,
        method?: Method,
    ): NoTransactionExtention<ReturnType<Wallet[typeof walletMethods[T]]>>;
    request<T extends string & keyof typeof walletSolidityMethods>(
        serviceName: `walletsolidity/${T}` | `/walletsolidity/${T}`,
        payload?: undefined,
        method?: 'get' | 'GET',
    ): ReturnType<WalletSolidity[typeof walletSolidityMethods[T]]>;
    request<T extends string & keyof typeof walletSolidityMethods>(
        serviceName: `walletsolidity/${T}` | `/walletsolidity/${T}`,
        payload?: Parameters<
            WalletSolidity[typeof walletSolidityMethods[T]]
        >[0] extends ITransaction
            ? Parameters<WalletSolidity[typeof walletSolidityMethods[T]]>[0]
            : never,
        method?: Method,
    ): ReturnType<WalletSolidity[typeof walletSolidityMethods[T]]>;
    request<T extends string & keyof typeof walletSolidityMethods>(
        serviceName: `walletsolidity/${T}` | `/walletsolidity/${T}`,
        payload: NoTransactionExtention<
            Parameters<WalletSolidity[typeof walletSolidityMethods[T]]>[0]
        >,
        method?: Method,
    ): NoTransactionExtention<
        ReturnType<WalletSolidity[typeof walletSolidityMethods[T]]>
    >;
    request<T extends string & keyof typeof walletExtensionMethods>(
        serviceName: `walletextension/${T}` | `/walletextension/${T}`,
        payload?: undefined,
        method?: 'get' | 'GET',
    ): ReturnType<WalletExtension[typeof walletExtensionMethods[T]]>;
    request<T extends string & keyof typeof walletExtensionMethods>(
        serviceName: `walletextension/${T}` | `/walletextension/${T}`,
        payload?: Parameters<
            WalletExtension[typeof walletExtensionMethods[T]]
        >[0] extends ITransaction
            ? Parameters<WalletExtension[typeof walletExtensionMethods[T]]>[0]
            : never,
        method?: Method,
    ): ReturnType<WalletExtension[typeof walletExtensionMethods[T]]>;
    request<T extends string & keyof typeof walletExtensionMethods>(
        serviceName: `walletextension/${T}` | `/walletextension/${T}`,
        payload: NoTransactionExtention<
            Parameters<WalletExtension[typeof walletExtensionMethods[T]]>[0]
        >,
        method?: Method,
    ): NoTransactionExtention<
        ReturnType<WalletExtension[typeof walletExtensionMethods[T]]>
    >;
    request<T extends string, Q extends 'transaction' | 'contract'>(
        serviceName: `event/${Q}/${T}` | `/event/${Q}/${T}`,
        payload?: undefined,
        method?: 'get' | 'GET',
    ): Promise<IEventResponse[]>;
    request(
        serviceName: string,
        payload?: undefined,
        method?: Method,
    ): Promise<unknown>;
    request(serviceName: string, payload = {}, method: Method = 'get') {
        method = method.toLowerCase() as Method;

        return this.instance
            .request({
                data:
                    method === 'post' && Object.keys(payload).length
                        ? payload
                        : null,
                params: method === 'get' && payload,
                url: serviceToUrl(serviceName),
                method,
            })
            .then(({data}) => data);
    }
}
