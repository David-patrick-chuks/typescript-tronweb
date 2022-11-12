import querystring from 'querystring';

import {WithTronwebAndInjectpromise} from '../../src/utils/_base';
import utils from '../utils';
import _CallbackT from '../utils/typing';
import {ContractOptions} from './contract';
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
    setServer(
        eventServer: string | providers.HttpProvider | null | undefined,
        healthcheck = 'healthcheck',
    ): void {
        // tronWeb instance attrs are handled in a weird way
        // All usages do not check for undefined, but allow to set
        // attrs to undefined regularly.
        // FIXME: should it be allowed?
        // @ts-ignore
        if (!eventServer) return (this.tronWeb.eventServer = undefined);

        if (utils.isString(eventServer))
            eventServer = new providers.HttpProvider(eventServer);

        if (!this.tronWeb.isValidProvider(eventServer))
            throw new Error('Invalid event server provided');

        this.tronWeb.eventServer = eventServer;
        this.tronWeb.eventServer.isConnected = () =>
            this.tronWeb.eventServer
                .request(healthcheck)
                .then(() => true)
                .catch(() => false);
    }

    getEventsByContractAddress(
        contractAddress: string,
        options?: ContractOptions & {rawResponse: true},
        callback?: undefined,
    ): Promise<IEventResponse[]>;
    getEventsByContractAddress(
        contractAddress: string,
        options?: ContractOptions & {rawResponse?: false},
        callback?: undefined,
    ): Promise<IEvent[]>;
    getEventsByContractAddress(
        contractAddress: string,
        options: ContractOptions & {rawResponse: true},
        callback: _CallbackT<IEventResponse[]>,
    ): void;
    getEventsByContractAddress(
        contractAddress: string,
        options: ContractOptions & {rawResponse?: false},
        callback: _CallbackT<IEvent[]>,
    ): void;
    getEventsByContractAddress(
        contractAddress: string,
        options: ContractOptions = {},
        callback?: _CallbackT<IEventResponse[]> | _CallbackT<IEvent[]>,
    ): void | Promise<IEventResponse[]> | Promise<IEvent[]> {
        /* eslint-disable prefer-const */
        let {
            sinceTimestamp,
            since,
            fromTimestamp,
            eventName,
            blockNumber,
            size,
            page,
            onlyConfirmed,
            onlyUnconfirmed,
            previousLastEventFingerprint,
            previousFingerprint,
            fingerprint,
            rawResponse,
            sort,
            filters,
        } = Object.assign(
            {
                sinceTimestamp: 0,
                eventName: false,
                blockNumber: false,
                size: 20,
                page: 1,
            },
            options,
        ) as ContractOptions;
        /* eslint-enable prefer-const */

        if (!callback)
            return this.injectPromise(
                this.getEventsByContractAddress,
                contractAddress,
                options,
            );

        fromTimestamp = fromTimestamp || sinceTimestamp || since;

        if (!this.tronWeb.eventServer)
            return callback('No event server configured');

        const routeParams: (string | number)[] = [];

        if (!this.tronWeb.isAddress(contractAddress))
            return callback('Invalid contract address provided');

        if (eventName && !contractAddress)
            return callback(
                'Usage of event name filtering requires a contract address',
            );

        if (
            typeof fromTimestamp !== 'undefined' &&
            !utils.isInteger(fromTimestamp)
        )
            return callback('Invalid fromTimestamp provided');

        if (!utils.isInteger(size)) return callback('Invalid size provided');

        if (size > 200) {
            console.warn('Defaulting to maximum accepted size: 200');
            size = 200;
        }

        if (!utils.isInteger(page)) return callback('Invalid page provided');

        if (blockNumber && !eventName)
            return callback(
                'Usage of block number filtering requires an event name',
            );

        if (contractAddress)
            routeParams.push(this.tronWeb.address.fromHex(contractAddress));

        if (eventName) routeParams.push(eventName);

        if (blockNumber) routeParams.push(blockNumber);

        const qs: Record<string, string | number | boolean> = {
            size,
            page,
        };

        if (
            filters != null &&
            typeof filters === 'object' &&
            Object.keys(filters).length > 0
        )
            qs.filters = JSON.stringify(filters);

        if (fromTimestamp) qs.fromTimestamp = qs.since = fromTimestamp;

        if (onlyConfirmed) qs.only_confirmed = onlyConfirmed;

        if (onlyUnconfirmed && !onlyConfirmed)
            qs.only_unconfirmed = onlyUnconfirmed;

        if (sort) qs.sort = sort;

        fingerprint =
            fingerprint || previousFingerprint || previousLastEventFingerprint;
        if (fingerprint) qs.fingerprint = fingerprint;

        return this.tronWeb.eventServer
            .request(
                `event/contract/${routeParams.join(
                    '/',
                )}?${querystring.stringify(qs)}`,
            )
            .then((data) => {
                if (!data) return callback('Unknown error occurred');
                if (!utils.isArray(data)) return callback(data);

                if (rawResponse) return callback(null, data as any);
                else
                    return callback(
                        null,
                        data.map((event) => utils.mapEvent(event)) as any,
                    );
            })
            .catch((err: any) =>
                callback((err.response && err.response.data) || err),
            ) as unknown as void;
    }

    getEventsByTransactionID(
        transactionID: string,
        options?: {rawResponse: true},
        callback?: undefined,
    ): Promise<IEventResponse[]>;
    getEventsByTransactionID(
        transactionID: string,
        options?: {rawResponse?: false},
        callback?: undefined,
    ): Promise<IEvent[]>;
    getEventsByTransactionID(
        transactionID: string,
        options: {rawResponse: true},
        callback: _CallbackT<IEventResponse[]>,
    ): void;
    getEventsByTransactionID(
        transactionID: string,
        options: {rawResponse?: false},
        callback: _CallbackT<IEvent[]>,
    ): void;
    getEventsByTransactionID(
        transactionID: string,
        options: {rawResponse?: boolean} = {},
        callback?: _CallbackT<IEventResponse[]> | _CallbackT<IEvent[]>,
    ): void | Promise<IEventResponse[]> | Promise<IEvent[]> {
        if (!callback || !utils.isFunction(callback))
            return this.injectPromise(
                this.getEventsByTransactionID,
                transactionID,
                options,
            );

        if (!this.tronWeb.eventServer)
            return callback('No event server configured');

        return this.tronWeb.eventServer
            .request(`event/transaction/${transactionID}`)
            .then((data) => {
                if (!callback) return null;

                if (!data) return callback('Unknown error occurred');
                if (!utils.isArray(data)) return callback(data);

                return callback(
                    null,
                    options.rawResponse === true
                        ? data
                        : (data.map((event) => utils.mapEvent(event)) as any),
                );
            })
            .catch(
                (err: any) =>
                    callback &&
                    callback((err.response && err.response.data) || err),
            ) as unknown as void;
    }
}
