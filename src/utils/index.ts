import BigNumber from 'bignumber.js';
import validator from 'validator';

import type {IAbiItem} from '../lib/contract/index';
import type {IEvent, IEventResponse} from '../lib/event';
import * as abi from './abi';
import * as accounts from './accounts';
import {ADDRESS_PREFIX} from './address';
import * as base58 from './base58';
import * as bytes from './bytes';
import * as code from './code';
import * as crypto from './crypto';
import * as ethersUtils from './ethersUtils';
import * as message from './message';
import {TypedDataEncoder as _TypedDataEncoder} from './typedData';

const utils = {
    isValidURL(url: any): url is string {
        if (typeof url !== 'string') return false;
        return validator.isURL(url.toString(), {
            protocols: ['http', 'https'],
            require_tld: false,
        });
    },

    isObject<T extends object>(obj: unknown): obj is T {
        return (
            obj === Object(obj) &&
            Object.prototype.toString.call(obj) !== '[object Array]'
        );
    },

    isArray(array: any): array is unknown[] {
        return Array.isArray(array);
    },

    isJson(string: any): boolean {
        try {
            return !!JSON.parse(string);
        } catch (ex) {
            return false;
        }
    },

    isBoolean(bool: any): bool is boolean {
        return typeof bool === 'boolean';
    },

    isBigNumber(number: any): number is BigNumber {
        return (
            number &&
            (number instanceof BigNumber ||
                (number.constructor && number.constructor.name === 'BigNumber'))
        );
    },

    isString(string: any): string is string {
        return (
            typeof string === 'string' ||
            (string &&
                string.constructor &&
                string.constructor.name === 'String')
        );
    },

    // eslint-disable-next-line @typescript-eslint/ban-types
    isFunction(obj: any): obj is Function {
        return typeof obj === 'function';
    },

    isHex(string: any): string is string {
        return (
            typeof string === 'string' &&
            !isNaN(parseInt(string, 16)) &&
            /^(0x|)[a-fA-F0-9]+$/.test(string)
        );
    },

    isInteger(number: any): number is number {
        if (number === null) return false;
        return Number.isInteger(Number(number));
    },

    hasProperty(obj: any, property: string): boolean {
        return Object.prototype.hasOwnProperty.call(obj, property);
    },

    hasProperties(obj: any, ...properties: string[]): boolean {
        return (
            !!properties.length &&
            !properties
                .map((property) => {
                    return this.hasProperty(obj, property);
                })
                .includes(false)
        );
    },

    mapEvent(event: IEventResponse): IEvent {
        const data = {
            block: event.block_number,
            timestamp: event.block_timestamp,
            contract: event.contract_address,
            name: event.event_name,
            transaction: event.transaction_id,
            result: event.result,
            resourceNode:
                event.resource_Node ||
                (event._unconfirmed ? 'fullNode' : 'solidityNode'),
        } as any;
        if (event._unconfirmed) data.unconfirmed = event._unconfirmed;
        if (event._fingerprint) data.fingerprint = event._fingerprint;
        return data;
    },

    parseEvent(event: IEvent, {inputs: abi}: {inputs: IAbiItem[]}): IEvent {
        if (!event.result) return event;

        if (this.isArray(event.result))
            event.result = event.result.reduce(
                (obj: Record<string, unknown>, result, index) => {
                    const {name, type} = abi[index];

                    if (type === 'address')
                        result =
                            ADDRESS_PREFIX +
                            (result as string).substr(2).toLowerCase();

                    obj[name] = result;

                    return obj;
                },
                {},
            );
        else if (this.isObject(event.result))
            for (let i = 0; i < abi.length; i++) {
                const obj = abi[i];
                if (obj.type === 'address' && obj.name in event.result)
                    event.result[obj.name] =
                        ADDRESS_PREFIX +
                        (event.result[obj.name] as string)
                            .substr(2)
                            .toLowerCase();
            }

        return event;
    },

    padLeft(input: any, padding: string, amount: number): string {
        let res = input.toString();
        while (res.length < amount) res = padding + res;
        return res;
    },

    isNotNullOrUndefined<T>(
        val: T,
    ): val is Exclude<Exclude<T, null>, undefined> {
        return val !== null && typeof val !== 'undefined';
    },

    async sleep(millis = 1000): Promise<never> {
        return new Promise((resolve) => setTimeout(resolve, millis));
    },
};

export default {
    ...utils,
    code,
    accounts,
    base58,
    bytes,
    crypto,
    abi,
    message,
    _TypedDataEncoder,
    ethersUtils,
};
