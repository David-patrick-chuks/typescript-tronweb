/* eslint-disable */

export const protobufPackage = 'protocol';

export interface AssetIssueContract {
    id: string;
    owner_address: string;
    name: string;
    abbr: string;
    total_supply: number;
    frozen_supply: AssetIssueContract_FrozenSupply;
    trx_num: number;
    precision: number;
    num: number;
    start_time: number;
    end_time: number;
    /** useless */
    order: number;
    vote_score: number;
    description: string;
    url: string;
    free_asset_net_limit: number;
    public_free_asset_net_limit: number;
    public_free_asset_net_usage: number;
    public_latest_free_net_time: number;
}

export interface AssetIssueContract_FrozenSupply {
    frozen_amount: number;
    frozen_days: number;
}

export interface TransferAssetContract {
    /** this field is token name before the proposal ALLOW_SAME_TOKEN_NAME is active, otherwise it is token id and token is should be in string format. */
    asset_name: string;
    owner_address: string;
    to_address: string;
    amount: number;
}

export interface UnfreezeAssetContract {
    owner_address: string;
}

export interface UpdateAssetContract {
    owner_address: string;
    description: string;
    url: string;
    new_limit: number;
    new_public_limit: number;
}

export interface ParticipateAssetIssueContract {
    owner_address: string;
    to_address: string;
    /** this field is token name before the proposal ALLOW_SAME_TOKEN_NAME is active, otherwise it is token id and token is should be in string format. */
    asset_name: string;
    /** the amount of drops */
    amount: number;
}
