/* eslint-disable */

export const protobufPackage = 'protocol';

export interface ExchangeCreateContract {
    owner_address: string;
    first_token_id: string;
    first_token_balance: number;
    second_token_id: string;
    second_token_balance: number;
}

export interface ExchangeInjectContract {
    owner_address: string;
    exchange_id: number;
    token_id: string;
    quant: number;
}

export interface ExchangeWithdrawContract {
    owner_address: string;
    exchange_id: number;
    token_id: string;
    quant: number;
}

export interface ExchangeTransactionContract {
    owner_address: string;
    exchange_id: number;
    token_id: string;
    quant: number;
    expected: number;
}
