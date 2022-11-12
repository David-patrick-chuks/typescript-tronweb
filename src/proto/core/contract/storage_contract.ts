/* eslint-disable */

export const protobufPackage = 'protocol';

export interface BuyStorageBytesContract {
    owner_address: string;
    /** storage bytes for buy */
    bytes: number;
}

export interface BuyStorageContract {
    owner_address: string;
    /** trx quantity for buy storage (sun) */
    quant: number;
}

export interface SellStorageContract {
    owner_address: string;
    storage_bytes: number;
}

export interface UpdateBrokerageContract {
    owner_address: string;
    /** 1 mean 1% */
    brokerage: number;
}
