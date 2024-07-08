"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBFTMessage_DataType = exports.PBFTMessage_MsgType = exports.Items_ItemType = exports.Inventory_InventoryType = exports.BlockInventory_Type = exports.TransactionInfo_code = exports.Transaction_Result_contractResult = exports.Transaction_Result_code = exports.Transaction_Contract_ContractType = exports.Permission_PermissionType = exports.MarketOrder_State = exports.Proposal_State = exports.ReasonCode = exports.AccountType = exports.protobufPackage = void 0;
exports.protobufPackage = 'protocol';
exports.AccountType = {
    Normal: 'Normal',
    AssetIssue: 'AssetIssue',
    Contract: 'Contract',
};
exports.ReasonCode = {
    REQUESTED: 'REQUESTED',
    BAD_PROTOCOL: 'BAD_PROTOCOL',
    TOO_MANY_PEERS: 'TOO_MANY_PEERS',
    DUPLICATE_PEER: 'DUPLICATE_PEER',
    INCOMPATIBLE_PROTOCOL: 'INCOMPATIBLE_PROTOCOL',
    NULL_IDENTITY: 'NULL_IDENTITY',
    PEER_QUITING: 'PEER_QUITING',
    UNEXPECTED_IDENTITY: 'UNEXPECTED_IDENTITY',
    LOCAL_IDENTITY: 'LOCAL_IDENTITY',
    PING_TIMEOUT: 'PING_TIMEOUT',
    USER_REASON: 'USER_REASON',
    RESET: 'RESET',
    SYNC_FAIL: 'SYNC_FAIL',
    FETCH_FAIL: 'FETCH_FAIL',
    BAD_TX: 'BAD_TX',
    BAD_BLOCK: 'BAD_BLOCK',
    FORKED: 'FORKED',
    UNLINKABLE: 'UNLINKABLE',
    INCOMPATIBLE_VERSION: 'INCOMPATIBLE_VERSION',
    INCOMPATIBLE_CHAIN: 'INCOMPATIBLE_CHAIN',
    TIME_OUT: 'TIME_OUT',
    CONNECT_FAIL: 'CONNECT_FAIL',
    TOO_MANY_PEERS_WITH_SAME_IP: 'TOO_MANY_PEERS_WITH_SAME_IP',
    LIGHT_NODE_SYNC_FAIL: 'LIGHT_NODE_SYNC_FAIL',
    UNKNOWN: 'UNKNOWN',
};
exports.Proposal_State = {
    PENDING: 'PENDING',
    DISAPPROVED: 'DISAPPROVED',
    APPROVED: 'APPROVED',
    CANCELED: 'CANCELED',
};
exports.MarketOrder_State = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    CANCELED: 'CANCELED',
};
exports.Permission_PermissionType = {
    Owner: 0,
    Witness: 1,
    Active: 2,
};
exports.Transaction_Contract_ContractType = {
    AccountCreateContract: 'AccountCreateContract',
    TransferContract: 'TransferContract',
    TransferAssetContract: 'TransferAssetContract',
    VoteAssetContract: 'VoteAssetContract',
    VoteWitnessContract: 'VoteWitnessContract',
    WitnessCreateContract: 'WitnessCreateContract',
    AssetIssueContract: 'AssetIssueContract',
    WitnessUpdateContract: 'WitnessUpdateContract',
    ParticipateAssetIssueContract: 'ParticipateAssetIssueContract',
    AccountUpdateContract: 'AccountUpdateContract',
    FreezeBalanceContract: 'FreezeBalanceContract',
    UnfreezeBalanceContract: 'UnfreezeBalanceContract',
    WithdrawBalanceContract: 'WithdrawBalanceContract',
    UnfreezeAssetContract: 'UnfreezeAssetContract',
    UpdateAssetContract: 'UpdateAssetContract',
    ProposalCreateContract: 'ProposalCreateContract',
    ProposalApproveContract: 'ProposalApproveContract',
    ProposalDeleteContract: 'ProposalDeleteContract',
    SetAccountIdContract: 'SetAccountIdContract',
    CustomContract: 'CustomContract',
    CreateSmartContract: 'CreateSmartContract',
    TriggerSmartContract: 'TriggerSmartContract',
    GetContract: 'GetContract',
    UpdateSettingContract: 'UpdateSettingContract',
    ExchangeCreateContract: 'ExchangeCreateContract',
    ExchangeInjectContract: 'ExchangeInjectContract',
    ExchangeWithdrawContract: 'ExchangeWithdrawContract',
    ExchangeTransactionContract: 'ExchangeTransactionContract',
    UpdateEnergyLimitContract: 'UpdateEnergyLimitContract',
    AccountPermissionUpdateContract: 'AccountPermissionUpdateContract',
    ClearABIContract: 'ClearABIContract',
    UpdateBrokerageContract: 'UpdateBrokerageContract',
    ShieldedTransferContract: 'ShieldedTransferContract',
    MarketSellAssetContract: 'MarketSellAssetContract',
    MarketCancelOrderContract: 'MarketCancelOrderContract',
};
exports.Transaction_Result_code = {
    SUCESS: 'SUCESS',
    FAILED: 'FAILED',
};
exports.Transaction_Result_contractResult = {
    DEFAULT: 'DEFAULT',
    SUCCESS: 'SUCCESS',
    REVERT: 'REVERT',
    BAD_JUMP_DESTINATION: 'BAD_JUMP_DESTINATION',
    OUT_OF_MEMORY: 'OUT_OF_MEMORY',
    PRECOMPILED_CONTRACT: 'PRECOMPILED_CONTRACT',
    STACK_TOO_SMALL: 'STACK_TOO_SMALL',
    STACK_TOO_LARGE: 'STACK_TOO_LARGE',
    ILLEGAL_OPERATION: 'ILLEGAL_OPERATION',
    STACK_OVERFLOW: 'STACK_OVERFLOW',
    OUT_OF_ENERGY: 'OUT_OF_ENERGY',
    OUT_OF_TIME: 'OUT_OF_TIME',
    JVM_STACK_OVER_FLOW: 'JVM_STACK_OVER_FLOW',
    UNKNOWN: 'UNKNOWN',
    TRANSFER_FAILED: 'TRANSFER_FAILED',
    INVALID_CODE: 'INVALID_CODE',
};
exports.TransactionInfo_code = {
    SUCESS: 'SUCESS',
    FAILED: 'FAILED',
};
exports.BlockInventory_Type = {
    SYNC: 'SYNC',
    ADVTISE: 'ADVTISE',
    FETCH: 'FETCH',
};
exports.Inventory_InventoryType = { TRX: 'TRX', BLOCK: 'BLOCK' };
exports.Items_ItemType = {
    ERR: 'ERR',
    TRX: 'TRX',
    BLOCK: 'BLOCK',
    BLOCKHEADER: 'BLOCKHEADER',
};
exports.PBFTMessage_MsgType = {
    VIEW_CHANGE: 'VIEW_CHANGE',
    REQUEST: 'REQUEST',
    PREPREPARE: 'PREPREPARE',
    PREPARE: 'PREPARE',
    COMMIT: 'COMMIT',
};
exports.PBFTMessage_DataType = { BLOCK: 'BLOCK', SRL: 'SRL' };
//# sourceMappingURL=Tron.js.map