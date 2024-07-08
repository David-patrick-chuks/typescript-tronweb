import type { ResourceCode } from './common';
export declare const protobufPackage = "protocol";
export interface FreezeBalanceContract {
    owner_address: string;
    frozen_balance: number;
    frozen_duration: number;
    resource: ResourceCode;
    receiver_address?: string | undefined;
}
export interface UnfreezeBalanceContract {
    owner_address: string;
    resource: ResourceCode;
    receiver_address?: string | undefined;
}
export interface WithdrawBalanceContract {
    owner_address: string;
}
export interface TransferContract {
    owner_address: string;
    to_address: string;
    amount: number;
}
export interface TransactionBalanceTrace {
    transaction_identifier: string;
    operation: TransactionBalanceTrace_Operation[];
    type: string;
    status: string;
}
export interface TransactionBalanceTrace_Operation {
    operation_identifier: number;
    address: string;
    amount: number;
}
export interface BlockBalanceTrace {
    block_identifier: BlockBalanceTrace_BlockIdentifier | undefined;
    timestamp: number;
    /** BlockIdentifier parent_block_identifier = 4; */
    transaction_balance_trace: TransactionBalanceTrace[];
}
export interface BlockBalanceTrace_BlockIdentifier {
    hash: string;
    number: number;
}
export interface AccountTrace {
    balance: number;
    placeholder: number;
}
export interface AccountIdentifier {
    address: string;
}
export interface AccountBalanceRequest {
    account_identifier: AccountIdentifier | undefined;
    block_identifier: BlockBalanceTrace_BlockIdentifier | undefined;
}
export interface AccountBalanceResponse {
    balance: number;
    block_identifier: BlockBalanceTrace_BlockIdentifier | undefined;
}
//# sourceMappingURL=balance_contract.d.ts.map