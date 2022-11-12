/* eslint-disable */

export const protobufPackage = 'protocol';

export interface AuthenticationPath {
    value: boolean[];
}

export interface MerklePath {
    authentication_paths: AuthenticationPath[];
    index: boolean[];
    rt: string;
}

export interface OutputPoint {
    hash: string;
    index: number;
}

export interface OutputPointInfo {
    out_points: OutputPoint[];
    block_num: number;
}

export interface PedersenHash {
    content: string;
}

export interface IncrementalMerkleTree {
    left: PedersenHash | undefined;
    right: PedersenHash | undefined;
    parents: PedersenHash[];
}

export interface IncrementalMerkleVoucher {
    tree: IncrementalMerkleTree | undefined;
    filled: PedersenHash[];
    cursor: IncrementalMerkleTree | undefined;
    cursor_depth: number;
    rt: string;
    output_point: OutputPoint | undefined;
}

export interface IncrementalMerkleVoucherInfo {
    vouchers: IncrementalMerkleVoucher[];
    paths: string[];
}

export interface SpendDescription {
    value_commitment: string;
    /** merkle root */
    anchor: string;
    /** used for check double spend */
    nullifier: string;
    /** used for check spend authority signature */
    rk: string;
    zkproof: string;
    spend_authority_signature: string;
}

export interface ReceiveDescription {
    value_commitment: string;
    note_commitment: string;
    /** for Encryption */
    epk: string;
    /** Encryption for incoming, decrypt it with ivk */
    c_enc: string;
    /** Encryption for audit, decrypt it with ovk */
    c_out: string;
    zkproof: string;
}

export interface ShieldedTransferContract {
    /** transparent address */
    transparent_from_address: string;
    from_amount: number;
    spend_description: SpendDescription[];
    receive_description: ReceiveDescription[];
    binding_signature: string;
    /** transparent address */
    transparent_to_address: string;
    /** the amount to transparent to_address */
    to_amount: number;
}
