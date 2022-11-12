/* eslint-disable */

export const protobufPackage = 'protocol';

export const ResourceCode = {
    BANDWIDTH: 'BANDWIDTH',
    ENERGY: 'ENERGY',
    TRON_POWER: 'TRON_POWER',
} as const;

export type ResourceCode = typeof ResourceCode[keyof typeof ResourceCode];
