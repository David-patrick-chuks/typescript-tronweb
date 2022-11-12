/* eslint-disable */
import type {Transaction} from '../core/Tron';

export const protobufPackage = 'protocol';

export interface ZksnarkRequest {
    transaction: Transaction | undefined;
    sighash: string;
    valueBalance: number;
    txId: string;
}

export interface ZksnarkResponse {
    code: ZksnarkResponse_Code;
}

export const ZksnarkResponse_Code = {
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
} as const;

export type ZksnarkResponse_Code =
    typeof ZksnarkResponse_Code[keyof typeof ZksnarkResponse_Code];

export interface TronZksnark {
    CheckZksnarkProof(request: ZksnarkRequest): Promise<ZksnarkResponse>;
}
