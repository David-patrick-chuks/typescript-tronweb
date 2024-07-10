import type { AxiosInstance, Method } from 'axios';
import type { Wallet, WalletExtension, WalletSolidity } from '../../proto/api/api';
import type { Transaction as ITransaction } from '../../proto/core/Tron';
import type { IEventResponse } from '../event';
import { walletExtensionMethods, walletMethods, walletSolidityMethods } from './serviceToUrl';
export declare class HttpProvider {
    host: string;
    timeout: number;
    user: string | undefined;
    password: string | undefined;
    headers: Record<string, string>;
    statusPage: string;
    instance: AxiosInstance;
    constructor(host: string, timeout?: number, user?: string | undefined, password?: string | undefined, headers?: Record<string, string>, statusPage?: string);
    setStatusPage(statusPage?: string): void;
    isConnected(statusPage?: string): Promise<boolean>;
    request<T extends string & keyof typeof walletMethods>(serviceName: `wallet/${T}` | `/wallet/${T}`, payload?: undefined, method?: 'get' | 'GET'): ReturnType<Wallet[typeof walletMethods[T]]>;
    request<T extends string & keyof typeof walletMethods>(serviceName: `wallet/${T}` | `/wallet/${T}`, payload: Parameters<Wallet[typeof walletMethods[T]]>[0], method?: 'post' | 'POST'): ReturnType<Wallet[typeof walletMethods[T]]>;
    request<T extends string & keyof typeof walletMethods>(serviceName: `wallet/${T}` | `/wallet/${T}`, payload?: Parameters<Wallet[typeof walletMethods[T]]>[0] extends ITransaction ? Parameters<Wallet[typeof walletMethods[T]]>[0] : never, method?: Method): ReturnType<Wallet[typeof walletMethods[T]]>;
    request<T extends string & keyof typeof walletMethods>(serviceName: `wallet/${T}` | `/wallet/${T}`, payload: Parameters<Wallet[typeof walletMethods[T]]>[0], method?: Method): ReturnType<Wallet[typeof walletMethods[T]]>;
    request<T extends string & keyof typeof walletSolidityMethods>(serviceName: `walletsolidity/${T}` | `/walletsolidity/${T}`, payload?: undefined, method?: 'get' | 'GET'): ReturnType<WalletSolidity[typeof walletSolidityMethods[T]]>;
    request<T extends string & keyof typeof walletSolidityMethods>(serviceName: `walletsolidity/${T}` | `/walletsolidity/${T}`, payload?: Parameters<WalletSolidity[typeof walletSolidityMethods[T]]>[0] extends ITransaction ? Parameters<WalletSolidity[typeof walletSolidityMethods[T]]>[0] : never, method?: Method): ReturnType<WalletSolidity[typeof walletSolidityMethods[T]]>;
    request<T extends string & keyof typeof walletSolidityMethods>(serviceName: `walletsolidity/${T}` | `/walletsolidity/${T}`, payload: Parameters<WalletSolidity[typeof walletSolidityMethods[T]]>[0], method?: Method): ReturnType<WalletSolidity[typeof walletSolidityMethods[T]]>;
    request<T extends string & keyof typeof walletExtensionMethods>(serviceName: `walletextension/${T}` | `/walletextension/${T}`, payload?: undefined, method?: 'get' | 'GET'): ReturnType<WalletExtension[typeof walletExtensionMethods[T]]>;
    request<T extends string & keyof typeof walletExtensionMethods>(serviceName: `walletextension/${T}` | `/walletextension/${T}`, payload?: Parameters<WalletExtension[typeof walletExtensionMethods[T]]>[0] extends ITransaction ? Parameters<WalletExtension[typeof walletExtensionMethods[T]]>[0] : never, method?: Method): ReturnType<WalletExtension[typeof walletExtensionMethods[T]]>;
    request<T extends string & keyof typeof walletExtensionMethods>(serviceName: `walletextension/${T}` | `/walletextension/${T}`, payload: Parameters<WalletExtension[typeof walletExtensionMethods[T]]>[0], method?: Method): ReturnType<WalletExtension[typeof walletExtensionMethods[T]]>;
    request<T extends string, Q extends 'transaction' | 'contract'>(serviceName: `event/${Q}/${T}` | `/event/${Q}/${T}`, payload?: undefined, method?: 'get' | 'GET'): Promise<IEventResponse[]>;
    request(serviceName: string, payload?: undefined, method?: Method): Promise<unknown>;
}
//# sourceMappingURL=HttpProvider.d.ts.map