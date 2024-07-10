import type { Any } from '../google/protobuf/any';
import type { Endpoint } from './Discover';
export declare const protobufPackage = "protocol";
export declare const AccountType: {
    readonly Normal: "Normal";
    readonly AssetIssue: "AssetIssue";
    readonly Contract: "Contract";
};
export declare type AccountType = typeof AccountType[keyof typeof AccountType];
export declare const ReasonCode: {
    readonly REQUESTED: "REQUESTED";
    readonly BAD_PROTOCOL: "BAD_PROTOCOL";
    readonly TOO_MANY_PEERS: "TOO_MANY_PEERS";
    readonly DUPLICATE_PEER: "DUPLICATE_PEER";
    readonly INCOMPATIBLE_PROTOCOL: "INCOMPATIBLE_PROTOCOL";
    readonly NULL_IDENTITY: "NULL_IDENTITY";
    readonly PEER_QUITING: "PEER_QUITING";
    readonly UNEXPECTED_IDENTITY: "UNEXPECTED_IDENTITY";
    readonly LOCAL_IDENTITY: "LOCAL_IDENTITY";
    readonly PING_TIMEOUT: "PING_TIMEOUT";
    readonly USER_REASON: "USER_REASON";
    readonly RESET: "RESET";
    readonly SYNC_FAIL: "SYNC_FAIL";
    readonly FETCH_FAIL: "FETCH_FAIL";
    readonly BAD_TX: "BAD_TX";
    readonly BAD_BLOCK: "BAD_BLOCK";
    readonly FORKED: "FORKED";
    readonly UNLINKABLE: "UNLINKABLE";
    readonly INCOMPATIBLE_VERSION: "INCOMPATIBLE_VERSION";
    readonly INCOMPATIBLE_CHAIN: "INCOMPATIBLE_CHAIN";
    readonly TIME_OUT: "TIME_OUT";
    readonly CONNECT_FAIL: "CONNECT_FAIL";
    readonly TOO_MANY_PEERS_WITH_SAME_IP: "TOO_MANY_PEERS_WITH_SAME_IP";
    readonly LIGHT_NODE_SYNC_FAIL: "LIGHT_NODE_SYNC_FAIL";
    readonly UNKNOWN: "UNKNOWN";
};
export declare type ReasonCode = typeof ReasonCode[keyof typeof ReasonCode];
/** AccountId, (name, address) use name, (null, address) use address, (name, null) use name, */
export interface AccountId {
    name: string;
    address: string;
}
/** vote message */
export interface Vote {
    /** the super rep address */
    vote_address: string;
    /** the vote num to this super rep. */
    vote_count: number;
}
/** Proposal */
export interface Proposal {
    proposal_id: number;
    proposer_address: string;
    parameters: {
        key: number;
        value: number;
    }[];
    expiration_time: number;
    create_time: number;
    approvals: string[];
    state: Proposal_State;
}
export declare const Proposal_State: {
    readonly PENDING: "PENDING";
    readonly DISAPPROVED: "DISAPPROVED";
    readonly APPROVED: "APPROVED";
    readonly CANCELED: "CANCELED";
};
export declare type Proposal_State = typeof Proposal_State[keyof typeof Proposal_State];
export interface Proposal_ParametersEntry {
    key: number;
    value: number;
}
/** Exchange */
export interface Exchange {
    exchange_id: number;
    creator_address: string;
    create_time: number;
    first_token_id: string;
    first_token_balance: number;
    second_token_id: string;
    second_token_balance: number;
}
/** market */
export interface MarketOrder {
    order_id: string;
    owner_address: string;
    create_time: number;
    sell_token_id: string;
    sell_token_quantity: number;
    buy_token_id: string;
    /** min to receive */
    buy_token_quantity: number;
    sell_token_quantity_remain: number;
    /**
     * When state != ACTIVE and sell_token_quantity_return !=0,
     * it means that some sell tokens are returned to the account due to insufficient remaining amount
     */
    sell_token_quantity_return: number;
    state: MarketOrder_State;
    prev: string;
    next: string;
}
export declare const MarketOrder_State: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly CANCELED: "CANCELED";
};
export declare type MarketOrder_State = typeof MarketOrder_State[keyof typeof MarketOrder_State];
export interface MarketOrderList {
    orders: MarketOrder[];
}
export interface MarketOrderPairList {
    orderPair: MarketOrderPair[];
}
export interface MarketOrderPair {
    sell_token_id: string;
    buy_token_id: string;
}
export interface MarketAccountOrder {
    owner_address: string;
    /** order_id list */
    orders: string[];
    /** active count */
    count: number;
    total_count: number;
}
export interface MarketPrice {
    sell_token_quantity: number;
    buy_token_quantity: number;
}
export interface MarketPriceList {
    sell_token_id: string;
    buy_token_id: string;
    prices: MarketPrice[];
}
export interface MarketOrderIdList {
    head: string;
    tail: string;
}
export interface ChainParameters {
    chainParameter: ChainParameters_ChainParameter[];
}
export interface ChainParameters_ChainParameter {
    key: string;
    value: number;
}
/** Account */
export interface Account {
    /** account nick name */
    account_name: string;
    type: AccountType;
    /** the create address */
    address: string;
    /** the trx balance */
    balance: number;
    /** the votes */
    votes: Vote[];
    /** the other asset owned by this account */
    asset: {
        key: string;
        value: number;
    }[];
    /** the other asset owned by this account，key is assetId */
    assetV2: {
        key: string;
        value: number;
    }[];
    /** the frozen balance for bandwidth */
    frozen: Account_Frozen[];
    /** bandwidth, get from frozen */
    net_usage: number;
    /** Frozen balance provided by other accounts to this account */
    acquired_delegated_frozen_balance_for_bandwidth: number;
    /** Freeze and provide balances to other accounts */
    delegated_frozen_balance_for_bandwidth: number;
    old_tron_power: number;
    tron_power: Account_Frozen | undefined;
    asset_optimized: boolean;
    /** this account create time */
    create_time: number;
    /** this last operation time, including transfer, voting and so on. //FIXME fix grammar */
    latest_opration_time: number;
    /** witness block producing allowance */
    allowance: number;
    /** last withdraw time */
    latest_withdraw_time: number;
    /** not used so far */
    code: string;
    is_witness: boolean;
    is_committee: boolean;
    /** frozen asset(for asset issuer) */
    frozen_supply: Account_Frozen[];
    /** asset_issued_name */
    asset_issued_name: string;
    asset_issued_ID: string;
    latest_asset_operation_time: {
        key: string;
        value: number;
    }[];
    latest_asset_operation_timeV2: {
        key: string;
        value: number;
    }[];
    free_net_usage: number;
    free_asset_net_usage: {
        key: string;
        value: number;
    }[];
    free_asset_net_usageV2: {
        key: string;
        value: number;
    }[];
    latest_consume_time: number;
    latest_consume_free_time: number;
    /** the identity of this account, case insensitive */
    account_id: string;
    account_resource: Account_AccountResource | undefined;
    codeHash: string;
    owner_permission: Permission | undefined;
    witness_permission: Permission | undefined;
    active_permission: Permission[];
}
/** frozen balance */
export interface Account_Frozen {
    /** the frozen trx balance */
    frozen_balance: number;
    /** the expire time */
    expire_time: number;
}
export interface Account_AssetEntry {
    key: string;
    value: number;
}
export interface Account_AssetV2Entry {
    key: string;
    value: number;
}
export interface Account_LatestAssetOperationTimeEntry {
    key: string;
    value: number;
}
export interface Account_LatestAssetOperationTimeV2Entry {
    key: string;
    value: number;
}
export interface Account_FreeAssetNetUsageEntry {
    key: string;
    value: number;
}
export interface Account_FreeAssetNetUsageV2Entry {
    key: string;
    value: number;
}
export interface Account_AccountResource {
    /** energy resource, get from frozen */
    energy_usage: number;
    /** the frozen balance for energy */
    frozen_balance_for_energy: Account_Frozen | undefined;
    latest_consume_time_for_energy: number;
    /** Frozen balance provided by other accounts to this account */
    acquired_delegated_frozen_balance_for_energy: number;
    /** Frozen balances provided to other accounts */
    delegated_frozen_balance_for_energy: number;
    /** storage resource, get from market */
    storage_limit: number;
    storage_usage: number;
    latest_exchange_storage_time: number;
}
export interface Key {
    address: string;
    weight: number;
}
export interface DelegatedResource {
    from: string;
    to: string;
    frozen_balance_for_bandwidth: number;
    frozen_balance_for_energy: number;
    expire_time_for_bandwidth: number;
    expire_time_for_energy: number;
}
export interface authority {
    account: AccountId | undefined;
    permission_name: string;
}
export interface Permission {
    type: Permission_PermissionType;
    /** Owner id=0, Witness id=1, Active id start by 2 */
    id: number;
    permission_name: string;
    threshold: number;
    parent_id: number;
    /** 1 bit 1 contract */
    operations: string;
    keys: Key[];
}
export declare const Permission_PermissionType: {
    readonly Owner: 0;
    readonly Witness: 1;
    readonly Active: 2;
};
export declare type Permission_PermissionType = typeof Permission_PermissionType[keyof typeof Permission_PermissionType];
/** Witness */
export interface Witness {
    address: string;
    voteCount: number;
    pubKey: string;
    url: string;
    totalProduced: number;
    totalMissed: number;
    latestBlockNum: number;
    latestSlotNum: number;
    isJobs: boolean;
}
/** Vote Change */
export interface Votes {
    address: string;
    old_votes: Vote[];
    new_votes: Vote[];
}
export interface TXOutput {
    value: number;
    pubKeyHash: string;
}
export interface TXInput {
    raw_data: TXInput_raw | undefined;
    signature: string;
}
export interface TXInput_raw {
    txID: string;
    vout: number;
    pubKey: string;
}
export interface TXOutputs {
    outputs: TXOutput[];
}
export interface ResourceReceipt {
    energy_usage: number;
    energy_fee: number;
    origin_energy_usage: number;
    energy_usage_total: number;
    net_usage: number;
    net_fee: number;
    result: Transaction_Result_contractResult;
}
export interface MarketOrderDetail {
    makerOrderId: string;
    takerOrderId: string;
    fillSellQuantity: number;
    fillBuyQuantity: number;
}
export interface Transaction {
    raw_data: Transaction_raw;
    /** only support size = 1,  repeated list here for muti-sig extension */
    signature: string[];
    ret: Transaction_Result[];
    visible?: boolean;
    txID: string;
    raw_data_hex: string;
}
export interface EstimateEnergyResponse {
    result: Object | string;
    energy_required: string;
}
export interface EstimatePrices {
    prices: MarketPrice[];
}
export interface Transaction_Contract {
    type: Transaction_Contract_ContractType;
    parameter: Any;
    provider: string;
    ContractName: string;
    Permission_id: number;
}
export declare const Transaction_Contract_ContractType: {
    readonly AccountCreateContract: "AccountCreateContract";
    readonly TransferContract: "TransferContract";
    readonly TransferAssetContract: "TransferAssetContract";
    readonly VoteAssetContract: "VoteAssetContract";
    readonly VoteWitnessContract: "VoteWitnessContract";
    readonly WitnessCreateContract: "WitnessCreateContract";
    readonly AssetIssueContract: "AssetIssueContract";
    readonly WitnessUpdateContract: "WitnessUpdateContract";
    readonly ParticipateAssetIssueContract: "ParticipateAssetIssueContract";
    readonly AccountUpdateContract: "AccountUpdateContract";
    readonly FreezeBalanceContract: "FreezeBalanceContract";
    readonly UnfreezeBalanceContract: "UnfreezeBalanceContract";
    readonly WithdrawBalanceContract: "WithdrawBalanceContract";
    readonly UnfreezeAssetContract: "UnfreezeAssetContract";
    readonly UpdateAssetContract: "UpdateAssetContract";
    readonly ProposalCreateContract: "ProposalCreateContract";
    readonly ProposalApproveContract: "ProposalApproveContract";
    readonly ProposalDeleteContract: "ProposalDeleteContract";
    readonly SetAccountIdContract: "SetAccountIdContract";
    readonly CustomContract: "CustomContract";
    readonly CreateSmartContract: "CreateSmartContract";
    readonly TriggerSmartContract: "TriggerSmartContract";
    readonly GetContract: "GetContract";
    readonly UpdateSettingContract: "UpdateSettingContract";
    readonly ExchangeCreateContract: "ExchangeCreateContract";
    readonly ExchangeInjectContract: "ExchangeInjectContract";
    readonly ExchangeWithdrawContract: "ExchangeWithdrawContract";
    readonly ExchangeTransactionContract: "ExchangeTransactionContract";
    readonly UpdateEnergyLimitContract: "UpdateEnergyLimitContract";
    readonly AccountPermissionUpdateContract: "AccountPermissionUpdateContract";
    readonly ClearABIContract: "ClearABIContract";
    readonly UpdateBrokerageContract: "UpdateBrokerageContract";
    readonly ShieldedTransferContract: "ShieldedTransferContract";
    readonly MarketSellAssetContract: "MarketSellAssetContract";
    readonly MarketCancelOrderContract: "MarketCancelOrderContract";
};
export declare type Transaction_Contract_ContractType = typeof Transaction_Contract_ContractType[keyof typeof Transaction_Contract_ContractType];
export interface Transaction_Result {
    fee: number;
    ret: Transaction_Result_code;
    contractRet: Transaction_Result_contractResult;
    assetIssueID: string;
    withdraw_amount: number;
    unfreeze_amount: number;
    exchange_received_amount: number;
    exchange_inject_another_amount: number;
    exchange_withdraw_another_amount: number;
    exchange_id: number;
    shielded_transaction_fee: number;
    orderId: string;
    orderDetails: MarketOrderDetail[];
}
export declare const Transaction_Result_code: {
    readonly SUCESS: "SUCESS";
    readonly FAILED: "FAILED";
};
export declare type Transaction_Result_code = typeof Transaction_Result_code[keyof typeof Transaction_Result_code];
export declare const Transaction_Result_contractResult: {
    readonly DEFAULT: "DEFAULT";
    readonly SUCCESS: "SUCCESS";
    readonly REVERT: "REVERT";
    readonly BAD_JUMP_DESTINATION: "BAD_JUMP_DESTINATION";
    readonly OUT_OF_MEMORY: "OUT_OF_MEMORY";
    readonly PRECOMPILED_CONTRACT: "PRECOMPILED_CONTRACT";
    readonly STACK_TOO_SMALL: "STACK_TOO_SMALL";
    readonly STACK_TOO_LARGE: "STACK_TOO_LARGE";
    readonly ILLEGAL_OPERATION: "ILLEGAL_OPERATION";
    readonly STACK_OVERFLOW: "STACK_OVERFLOW";
    readonly OUT_OF_ENERGY: "OUT_OF_ENERGY";
    readonly OUT_OF_TIME: "OUT_OF_TIME";
    readonly JVM_STACK_OVER_FLOW: "JVM_STACK_OVER_FLOW";
    readonly UNKNOWN: "UNKNOWN";
    readonly TRANSFER_FAILED: "TRANSFER_FAILED";
    readonly INVALID_CODE: "INVALID_CODE";
};
export declare type Transaction_Result_contractResult = typeof Transaction_Result_contractResult[keyof typeof Transaction_Result_contractResult];
export interface Transaction_raw {
    ref_block_bytes: string;
    ref_block_num: number;
    ref_block_hash: string;
    expiration: number;
    auths: authority[];
    /** data not used */
    data: string;
    /** only support size = 1,  repeated list here for extension */
    contract: Transaction_Contract[];
    /** scripts not used */
    scripts: string;
    timestamp: number;
    fee_limit: number;
}
export interface TransactionInfo {
    id: string;
    fee: number;
    blockNumber: number;
    blockTimeStamp: number;
    contractResult: string[];
    contract_address: string;
    receipt: ResourceReceipt | undefined;
    log: TransactionInfo_Log[];
    result?: TransactionInfo_code;
    resMessage?: string;
    assetIssueID?: string;
    withdraw_amount?: number;
    unfreeze_amount?: number;
    internal_transactions?: InternalTransaction[];
    exchange_received_amount?: number;
    exchange_inject_another_amount?: number;
    exchange_withdraw_another_amount?: number;
    exchange_id?: number;
    shielded_transaction_fee?: number;
    orderId?: string;
    orderDetails?: MarketOrderDetail[];
    packingFee?: number;
}
export declare const TransactionInfo_code: {
    readonly SUCESS: "SUCESS";
    readonly FAILED: "FAILED";
};
export declare type TransactionInfo_code = typeof TransactionInfo_code[keyof typeof TransactionInfo_code];
export interface TransactionInfo_Log {
    address: string;
    topics: string[];
    data: string;
}
export interface TransactionRet {
    blockNumber: number;
    blockTimeStamp: number;
    transactioninfo: TransactionInfo[];
}
export interface Transactions {
    transactions: Transaction[];
}
export interface TransactionSign {
    transaction: Transaction | undefined;
    privateKey: string;
}
export interface BlockHeader {
    raw_data: BlockHeader_raw;
    witness_signature: string;
}
export interface BlockHeader_raw {
    timestamp: number;
    txTrieRoot: string;
    parentHash: string;
    /**
     * bytes nonce = 5;
     * bytes difficulty = 6;
     */
    number: number;
    witness_id: number;
    witness_address: string;
    version: number;
    accountStateRoot: string;
}
/** block */
export interface Block {
    transactions: Transaction[];
    block_header: BlockHeader | undefined;
}
export interface ChainInventory {
    ids: ChainInventory_BlockId[];
    remain_num: number;
}
export interface ChainInventory_BlockId {
    hash: string;
    number: number;
}
/** Inventory */
export interface BlockInventory {
    ids: BlockInventory_BlockId[];
    type: BlockInventory_Type;
}
export declare const BlockInventory_Type: {
    readonly SYNC: "SYNC";
    readonly ADVTISE: "ADVTISE";
    readonly FETCH: "FETCH";
};
export declare type BlockInventory_Type = typeof BlockInventory_Type[keyof typeof BlockInventory_Type];
export interface BlockInventory_BlockId {
    hash: string;
    number: number;
}
export interface Inventory {
    type: Inventory_InventoryType;
    ids: string[];
}
export declare const Inventory_InventoryType: {
    readonly TRX: "TRX";
    readonly BLOCK: "BLOCK";
};
export declare type Inventory_InventoryType = typeof Inventory_InventoryType[keyof typeof Inventory_InventoryType];
export interface Items {
    type: Items_ItemType;
    blocks: Block[];
    block_headers: BlockHeader[];
    transactions: Transaction[];
}
export declare const Items_ItemType: {
    readonly ERR: "ERR";
    readonly TRX: "TRX";
    readonly BLOCK: "BLOCK";
    readonly BLOCKHEADER: "BLOCKHEADER";
};
export declare type Items_ItemType = typeof Items_ItemType[keyof typeof Items_ItemType];
/** DynamicProperties */
export interface DynamicProperties {
    last_solidity_block_num: number;
}
export interface DisconnectMessage {
    reason: ReasonCode;
}
export interface HelloMessage {
    from: Endpoint | undefined;
    version: number;
    timestamp: number;
    genesisBlockId: HelloMessage_BlockId | undefined;
    solidBlockId: HelloMessage_BlockId | undefined;
    headBlockId: HelloMessage_BlockId | undefined;
    address: string;
    signature: string;
    nodeType: number;
    lowestBlockNum: number;
}
export interface HelloMessage_BlockId {
    hash: string;
    number: number;
}
export interface InternalTransaction {
    /**
     * internalTransaction identity, the root InternalTransaction hash
     * should equals to root transaction id.
     */
    hash: string;
    /** the one send trx (TBD: or token) via function */
    caller_address: string;
    /** the one recieve trx (TBD: or token) via function */
    transferTo_address: string;
    callValueInfo: InternalTransaction_CallValueInfo[];
    note: string;
    rejected: boolean;
    extra: string;
}
export interface InternalTransaction_CallValueInfo {
    /** trx (TBD: or token) value */
    callValue: number;
    /** TBD: tokenName, trx should be empty */
    tokenId: string;
}
export interface DelegatedResourceAccountIndex {
    account: string;
    fromAccounts: string[];
    toAccounts: string[];
}
export interface NodeInfo {
    beginSyncNum: number;
    block: string;
    solidityBlock: string;
    /** connect information */
    currentConnectCount: number;
    activeConnectCount: number;
    passiveConnectCount: number;
    totalFlow: number;
    peerInfoList: NodeInfo_PeerInfo[];
    configNodeInfo: NodeInfo_ConfigNodeInfo | undefined;
    machineInfo: NodeInfo_MachineInfo | undefined;
    cheatWitnessInfoMap: {
        key: string;
        value: string;
    }[];
}
export interface NodeInfo_CheatWitnessInfoMapEntry {
    key: string;
    value: string;
}
export interface NodeInfo_PeerInfo {
    lastSyncBlock: string;
    remainNum: number;
    lastBlockUpdateTime: number;
    syncFlag: boolean;
    headBlockTimeWeBothHave: number;
    needSyncFromPeer: boolean;
    needSyncFromUs: boolean;
    host: string;
    port: number;
    nodeId: string;
    connectTime: number;
    avgLatency: number;
    syncToFetchSize: number;
    syncToFetchSizePeekNum: number;
    syncBlockRequestedSize: number;
    unFetchSynNum: number;
    blockInPorcSize: number;
    headBlockWeBothHave: string;
    isActive: boolean;
    score: number;
    nodeCount: number;
    inFlow: number;
    disconnectTimes: number;
    localDisconnectReason: string;
    remoteDisconnectReason: string;
}
export interface NodeInfo_ConfigNodeInfo {
    codeVersion: string;
    p2pVersion: string;
    listenPort: number;
    discoverEnable: boolean;
    activeNodeSize: number;
    passiveNodeSize: number;
    sendNodeSize: number;
    maxConnectCount: number;
    sameIpMaxConnectCount: number;
    backupListenPort: number;
    backupMemberSize: number;
    backupPriority: number;
    dbVersion: number;
    minParticipationRate: number;
    supportConstant: boolean;
    minTimeRatio: number;
    maxTimeRatio: number;
    allowCreationOfContracts: number;
    allowAdaptiveEnergy: number;
}
export interface NodeInfo_MachineInfo {
    threadCount: number;
    deadLockThreadCount: number;
    cpuCount: number;
    totalMemory: number;
    freeMemory: number;
    cpuRate: number;
    javaVersion: string;
    osName: string;
    jvmTotalMemory: number;
    jvmFreeMemory: number;
    processCpuRate: number;
    memoryDescInfoList: NodeInfo_MachineInfo_MemoryDescInfo[];
    deadLockThreadInfoList: NodeInfo_MachineInfo_DeadLockThreadInfo[];
}
export interface NodeInfo_MachineInfo_MemoryDescInfo {
    name: string;
    initSize: number;
    useSize: number;
    maxSize: number;
    useRate: number;
}
export interface NodeInfo_MachineInfo_DeadLockThreadInfo {
    name: string;
    lockName: string;
    lockOwner: string;
    state: string;
    blockTime: number;
    waitTime: number;
    stackTrace: string;
}
export interface MetricsInfo {
    interval: number;
    node: MetricsInfo_NodeInfo | undefined;
    blockchain: MetricsInfo_BlockChainInfo | undefined;
    net: MetricsInfo_NetInfo | undefined;
}
export interface MetricsInfo_NodeInfo {
    ip: string;
    nodeType: number;
    version: string;
    backupStatus: number;
}
export interface MetricsInfo_BlockChainInfo {
    headBlockNum: number;
    headBlockTimestamp: number;
    headBlockHash: string;
    forkCount: number;
    failForkCount: number;
    blockProcessTime: MetricsInfo_RateInfo | undefined;
    tps: MetricsInfo_RateInfo | undefined;
    transactionCacheSize: number;
    missedTransaction: MetricsInfo_RateInfo | undefined;
    witnesses: MetricsInfo_BlockChainInfo_Witness[];
    failProcessBlockNum: number;
    failProcessBlockReason: string;
    dupWitness: MetricsInfo_BlockChainInfo_DupWitness[];
}
export interface MetricsInfo_BlockChainInfo_Witness {
    address: string;
    version: number;
}
export interface MetricsInfo_BlockChainInfo_DupWitness {
    address: string;
    blockNum: number;
    count: number;
}
export interface MetricsInfo_RateInfo {
    count: number;
    meanRate: number;
    oneMinuteRate: number;
    fiveMinuteRate: number;
    fifteenMinuteRate: number;
}
export interface MetricsInfo_NetInfo {
    errorProtoCount: number;
    api: MetricsInfo_NetInfo_ApiInfo | undefined;
    connectionCount: number;
    validConnectionCount: number;
    tcpInTraffic: MetricsInfo_RateInfo | undefined;
    tcpOutTraffic: MetricsInfo_RateInfo | undefined;
    disconnectionCount: number;
    disconnectionDetail: MetricsInfo_NetInfo_DisconnectionDetailInfo[];
    udpInTraffic: MetricsInfo_RateInfo | undefined;
    udpOutTraffic: MetricsInfo_RateInfo | undefined;
    latency: MetricsInfo_NetInfo_LatencyInfo | undefined;
}
export interface MetricsInfo_NetInfo_ApiInfo {
    qps: MetricsInfo_RateInfo | undefined;
    failQps: MetricsInfo_RateInfo | undefined;
    outTraffic: MetricsInfo_RateInfo | undefined;
    detail: MetricsInfo_NetInfo_ApiInfo_ApiDetailInfo[];
}
export interface MetricsInfo_NetInfo_ApiInfo_ApiDetailInfo {
    name: string;
    qps: MetricsInfo_RateInfo | undefined;
    failQps: MetricsInfo_RateInfo | undefined;
    outTraffic: MetricsInfo_RateInfo | undefined;
}
export interface MetricsInfo_NetInfo_DisconnectionDetailInfo {
    reason: string;
    count: number;
}
export interface MetricsInfo_NetInfo_LatencyInfo {
    top99: number;
    top95: number;
    top75: number;
    totalCount: number;
    delay1S: number;
    delay2S: number;
    delay3S: number;
    detail: MetricsInfo_NetInfo_LatencyInfo_LatencyDetailInfo[];
}
export interface MetricsInfo_NetInfo_LatencyInfo_LatencyDetailInfo {
    witness: string;
    top99: number;
    top95: number;
    top75: number;
    count: number;
    delay1S: number;
    delay2S: number;
    delay3S: number;
}
export interface PBFTMessage {
    raw_data: PBFTMessage_Raw | undefined;
    signature: string;
}
export declare const PBFTMessage_MsgType: {
    readonly VIEW_CHANGE: "VIEW_CHANGE";
    readonly REQUEST: "REQUEST";
    readonly PREPREPARE: "PREPREPARE";
    readonly PREPARE: "PREPARE";
    readonly COMMIT: "COMMIT";
};
export declare type PBFTMessage_MsgType = typeof PBFTMessage_MsgType[keyof typeof PBFTMessage_MsgType];
export declare const PBFTMessage_DataType: {
    readonly BLOCK: "BLOCK";
    readonly SRL: "SRL";
};
export declare type PBFTMessage_DataType = typeof PBFTMessage_DataType[keyof typeof PBFTMessage_DataType];
export interface PBFTMessage_Raw {
    msg_type: PBFTMessage_MsgType;
    data_type: PBFTMessage_DataType;
    view_n: number;
    epoch: number;
    data: string;
}
export interface PBFTCommitResult {
    data: string;
    signature: string[];
}
export interface SRL {
    srAddress: string[];
}
//# sourceMappingURL=Tron.d.ts.map