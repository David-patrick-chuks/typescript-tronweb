import axios from 'axios';
import type {AxiosInstance, Method} from 'axios';

import type {
    Wallet,
    WalletExtension,
    WalletSolidity,
} from '../../proto/api/api';
import type {Transaction as ITransaction} from '../../proto/core/Tron';
import utils from '../../utils';
import type {IEventResponse} from '../event';
import {
    serviceToUrl,
    walletExtensionMethods,
    walletMethods,
    walletSolidityMethods,
} from './serviceToUrl';

export class HttpProvider {
    host: string;
    timeout: number;
    user: string | undefined;
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
        payload: Parameters<Wallet[typeof walletMethods[T]]>[0],
        method?: Method,
    ): ReturnType<Wallet[typeof walletMethods[T]]>;
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
        payload: Parameters<WalletSolidity[typeof walletSolidityMethods[T]]>[0],
        method?: Method,
    ): ReturnType<WalletSolidity[typeof walletSolidityMethods[T]]>;
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
        payload: Parameters<
            WalletExtension[typeof walletExtensionMethods[T]]
        >[0],
        method?: Method,
    ): ReturnType<WalletExtension[typeof walletExtensionMethods[T]]>;
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
