import { WithTronwebAndInjectpromise } from '../../src/utils/_base';
import type _CallbackT from '../utils/typing';
import type { ContractEventOptions } from './contract';
import * as providers from './providers';
export interface IEventResponse {
    block_number: number;
    block_timestamp: number;
    contract_address: string;
    event_name: string;
    transaction_id: string;
    result: Record<string, unknown> | unknown[];
    resource_Node?: string;
    _unconfirmed?: boolean;
    _fingerprint?: string;
}
export interface IEvent {
    block: number;
    timestamp: number;
    contract: string;
    name: string;
    transaction: string;
    result: Record<string, unknown> | unknown[];
    resourceNode?: string;
    unconfirmed?: boolean;
    fingerprint?: string;
}
export default class Event extends WithTronwebAndInjectpromise {
    setServer(eventServer: string | providers.HttpProvider | null | undefined, healthcheck?: string): void;
    getEventsByContractAddress(contractAddress: string, options?: ContractEventOptions & {
        rawResponse: true;
    }, callback?: undefined): Promise<IEventResponse[]>;
    getEventsByContractAddress(contractAddress: string, options?: ContractEventOptions & {
        rawResponse?: false;
    }, callback?: undefined): Promise<IEvent[]>;
    getEventsByContractAddress(contractAddress: string, options: ContractEventOptions & {
        rawResponse: true;
    }, callback: _CallbackT<IEventResponse[]>): void;
    getEventsByContractAddress(contractAddress: string, options: ContractEventOptions & {
        rawResponse?: false;
    }, callback: _CallbackT<IEvent[]>): void;
    getEventsByTransactionID(transactionID: string, options?: {
        rawResponse: true;
    }, callback?: undefined): Promise<IEventResponse[]>;
    getEventsByTransactionID(transactionID: string, options?: {
        rawResponse?: false;
    }, callback?: undefined): Promise<IEvent[]>;
    getEventsByTransactionID(transactionID: string, options: {
        rawResponse: true;
    }, callback: _CallbackT<IEventResponse[]>): void;
    getEventsByTransactionID(transactionID: string, options: {
        rawResponse?: false;
    }, callback: _CallbackT<IEvent[]>): void;
}
//# sourceMappingURL=event.d.ts.map