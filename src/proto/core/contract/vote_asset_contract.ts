/* eslint-disable */

export const protobufPackage = 'protocol';

export interface VoteAssetContract {
    owner_address: string;
    vote_address: string[];
    support: boolean;
    count: number;
}
