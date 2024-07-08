import type { Transaction } from '../core/Tron';
export declare const protobufPackage = "protocol";
export interface ZksnarkRequest {
    transaction: Transaction | undefined;
    sighash: string;
    valueBalance: number;
    txId: string;
}
export interface ZksnarkResponse {
    code: ZksnarkResponse_Code;
}
export declare const ZksnarkResponse_Code: {
    readonly SUCCESS: "SUCCESS";
    readonly FAILED: "FAILED";
};
export declare type ZksnarkResponse_Code = typeof ZksnarkResponse_Code[keyof typeof ZksnarkResponse_Code];
export interface TronZksnark {
    CheckZksnarkProof(request: ZksnarkRequest): Promise<ZksnarkResponse>;
}
//# sourceMappingURL=zksnark.d.ts.map