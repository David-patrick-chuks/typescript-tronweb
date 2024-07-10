/* eslint-disable */
import type {
    Account,
    Block,
    BlockHeader,
    ChainParameters,
    DelegatedResource,
    DelegatedResourceAccountIndex,
    DynamicProperties,
    EstimateEnergyResponse,
    EstimatePrices,
    Exchange,
    InternalTransaction,
    MarketOrder,
    MarketOrderList,
    MarketOrderPair,
    MarketOrderPairList,
    MarketPriceList,
    MetricsInfo,
    NodeInfo,
    Permission,
    Proposal,
    Transaction,
    TransactionInfo,
    TransactionInfo_Log,
    TransactionSign,
    Witness,
} from '../core/Tron';
import type {
    AccountCreateContract,
    AccountPermissionUpdateContract,
    AccountUpdateContract,
    SetAccountIdContract,
} from '../core/contract/account_contract';
import type {
    AssetIssueContract,
    EnergyEstimateContract,
    ParticipateAssetIssueContract,
    TransferAssetContract,
    UnfreezeAssetContract,
    UpdateAssetContract,
} from '../core/contract/asset_issue_contract';
import type {
    AccountBalanceRequest,
    AccountBalanceResponse,
    BlockBalanceTrace,
    BlockBalanceTrace_BlockIdentifier,
    FreezeBalanceContract,
    TransferContract,
    UnfreezeBalanceContract,
    WithdrawBalanceContract,
} from '../core/contract/balance_contract';
import type {
    ExchangeCreateContract,
    ExchangeInjectContract,
    ExchangeTransactionContract,
    ExchangeWithdrawContract,
} from '../core/contract/exchange_contract';
import type {
    MarketCancelOrderContract,
    MarketSellAssetContract,
} from '../core/contract/market_contract';
import type {
    ProposalApproveContract,
    ProposalCreateContract,
    ProposalDeleteContract,
} from '../core/contract/proposal_contract';
import type {
    IncrementalMerkleTree,
    IncrementalMerkleVoucher,
    IncrementalMerkleVoucherInfo,
    OutputPointInfo,
    ReceiveDescription,
    SpendDescription,
} from '../core/contract/shield_contract';
import type {
    FundInjectContract,
    SideChainProposalCreateContract,
} from '../core/contract/sidechain';
import type {
    ClearABIContract,
    CreateSmartContract,
    SmartContract,
    SmartContractDataWrapper,
    TriggerSmartContract,
    UpdateEnergyLimitContract,
    UpdateSettingContract,
} from '../core/contract/smart_contract';
import type {
    BuyStorageBytesContract,
    BuyStorageContract,
    SellStorageContract,
    UpdateBrokerageContract,
} from '../core/contract/storage_contract';
import type {
    VoteWitnessContract,
    WitnessCreateContract,
    WitnessUpdateContract,
} from '../core/contract/witness_contract';

export const protobufPackage = 'protocol';

export interface Return {
    result: boolean;
    code: Return_response_code;
    message: string;
}

export const Return_response_code = {
    SUCCESS: 'SUCCESS',
    /** SIGERROR - error in signature */
    SIGERROR: 'SIGERROR',
    CONTRACT_VALIDATE_ERROR: 'CONTRACT_VALIDATE_ERROR',
    CONTRACT_EXE_ERROR: 'CONTRACT_EXE_ERROR',
    BANDWITH_ERROR: 'BANDWITH_ERROR',
    DUP_TRANSACTION_ERROR: 'DUP_TRANSACTION_ERROR',
    TAPOS_ERROR: 'TAPOS_ERROR',
    TOO_BIG_TRANSACTION_ERROR: 'TOO_BIG_TRANSACTION_ERROR',
    TRANSACTION_EXPIRATION_ERROR: 'TRANSACTION_EXPIRATION_ERROR',
    SERVER_BUSY: 'SERVER_BUSY',
    NO_CONNECTION: 'NO_CONNECTION',
    NOT_ENOUGH_EFFECTIVE_CONNECTION: 'NOT_ENOUGH_EFFECTIVE_CONNECTION',
    OTHER_ERROR: 'OTHER_ERROR',
} as const;

export type Return_response_code =
    typeof Return_response_code[keyof typeof Return_response_code];

export interface BlockReference {
    block_num: number;
    block_hash: string;
}

export interface WitnessList {
    witnesses: Witness[];
}

export interface ProposalList {
    proposals: Proposal[];
}

export interface ExchangeList {
    exchanges: Exchange[];
}

export interface AssetIssueList {
    assetIssue: AssetIssueContract[];
}

export interface BlockList {
    block: Block[];
}

export interface TransactionList {
    transaction: Transaction[];
}

export interface TransactionIdList {
    txId: string[];
}

export interface DelegatedResourceMessage {
    fromAddress: string;
    toAddress: string;
}

export interface DelegatedResourceList {
    delegatedResource: DelegatedResource[];
}

/** Gossip node list */
export interface NodeList {
    nodes: Node[];
}

/** Gossip node */
export interface Node {
    address: Address | undefined;
}

/** Gossip node address */
export interface Address {
    host: string;
    port: number;
}

export interface EmptyMessage {}

export interface NumberMessage {
    num: number;
}

export interface BytesMessage {
    value: string;
}

export interface AddressMessage {
    address: string;
}

export interface BrokerageMessage {
    brokerage: number;
}

export interface RewardMessage {
    reward?: number;
}

export interface NumberIdMessage {
    id: number;
}

export interface TimeMessage {
    beginInMilliseconds: number;
    endInMilliseconds: number;
}

export interface BlockReq {
    id_or_num: string;
    detail: boolean;
}

export interface BlockLimit {
    startNum: number;
    endNum: number;
}

export interface TransactionLimit {
    transactionId: string;
    limitNum: number;
}

export interface AccountPaginated {
    account: Account | undefined;
    offset: number;
    limit: number;
}

export interface TimePaginatedMessage {
    timeMessage: TimeMessage | undefined;
    offset: number;
    limit: number;
}

/** deprecated */
export interface AccountNetMessage {
    freeNetUsed: number;
    freeNetLimit: number;
    NetUsed: number;
    NetLimit: number;
    assetNetUsed: {key: string; value: number}[];
    assetNetLimit: {key: string; value: number}[];
    TotalNetLimit: number;
    TotalNetWeight: number;
}

export interface AccountNetMessage_AssetNetUsedEntry {
    key: string;
    value: number;
}

export interface AccountNetMessage_AssetNetLimitEntry {
    key: string;
    value: number;
}

export interface AccountResourceMessage {
    freeNetUsed: number;
    freeNetLimit: number;
    NetUsed: number;
    NetLimit: number;
    assetNetUsed: {key: string; value: number}[];
    assetNetLimit: {key: string; value: number}[];
    TotalNetLimit: number;
    TotalNetWeight: number;
    TotalTronPowerWeight: number;
    tronPowerUsed: number;
    tronPowerLimit: number;
    EnergyUsed: number;
    EnergyLimit: number;
    TotalEnergyLimit: number;
    TotalEnergyWeight: number;
    storageUsed: number;
    storageLimit: number;
}

export interface AccountResourceMessage_AssetNetUsedEntry {
    key: string;
    value: number;
}

export interface AccountResourceMessage_AssetNetLimitEntry {
    key: string;
    value: number;
}

export interface PaginatedMessage {
    offset: number;
    limit: number;
}

export interface EasyTransferMessage {
    passPhrase: string;
    toAddress: string;
    amount: number;
}

export interface EasyTransferAssetMessage {
    passPhrase: string;
    toAddress: string;
    assetId: string;
    amount: number;
}

export interface EasyTransferByPrivateMessage {
    privateKey: string;
    toAddress: string;
    amount: number;
}

export interface EasyTransferAssetByPrivateMessage {
    privateKey: string;
    toAddress: string;
    assetId: string;
    amount: number;
}

export interface EasyTransferResponse {
    transaction: Transaction | undefined;
    result: Return;
    /** transaction id =  sha256(transaction.rowdata) */
    txid: string;
}

export interface AddressPrKeyPairMessage {
    address: string;
    privateKey: string;
}

export interface TransactionExtention {
    transaction: Transaction | undefined;
    /** transaction id =  sha256(transaction.rowdata) */
    txid: string;
    constant_result: string[];
    result: Return;
    energy_used: number;
    logs: TransactionInfo_Log[];
    internal_transactions: InternalTransaction[];
}

export interface BlockExtention {
    transactions: TransactionExtention[];
    block_header: BlockHeader;
    blockID: string;
}

export interface BlockListExtention {
    block: BlockExtention[];
}

export interface TransactionListExtention {
    transaction: TransactionExtention[];
}

export interface BlockIncrementalMerkleTree {
    number: number;
    merkleTree: IncrementalMerkleTree;
}

export interface TransactionSignWeight {
    permission: Permission | undefined;
    approved_list: string[];
    current_weight: number;
    result: TransactionSignWeight_Result;
    transaction: TransactionExtention | undefined;
}

export interface TransactionSignWeight_Result {
    code: TransactionSignWeight_Result_response_code;
    message: string;
}

export const TransactionSignWeight_Result_response_code = {
    ENOUGH_PERMISSION: 'ENOUGH_PERMISSION',
    /** NOT_ENOUGH_PERMISSION - error in */
    NOT_ENOUGH_PERMISSION: 'NOT_ENOUGH_PERMISSION',
    SIGNATURE_FORMAT_ERROR: 'SIGNATURE_FORMAT_ERROR',
    COMPUTE_ADDRESS_ERROR: 'COMPUTE_ADDRESS_ERROR',
    /** PERMISSION_ERROR - The key is not in permission */
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    OTHER_ERROR: 'OTHER_ERROR',
} as const;

export type TransactionSignWeight_Result_response_code =
    typeof TransactionSignWeight_Result_response_code[keyof typeof TransactionSignWeight_Result_response_code];

export interface TransactionApprovedList {
    approved_list: string[];
    result: TransactionApprovedList_Result;
    transaction: TransactionExtention | undefined;
}

export interface TransactionApprovedList_Result {
    code: TransactionApprovedList_Result_response_code;
    message: string;
}

export const TransactionApprovedList_Result_response_code = {
    SUCCESS: 'SUCCESS',
    SIGNATURE_FORMAT_ERROR: 'SIGNATURE_FORMAT_ERROR',
    COMPUTE_ADDRESS_ERROR: 'COMPUTE_ADDRESS_ERROR',
    OTHER_ERROR: 'OTHER_ERROR',
} as const;

export type TransactionApprovedList_Result_response_code =
    typeof TransactionApprovedList_Result_response_code[keyof typeof TransactionApprovedList_Result_response_code];

export interface IvkDecryptParameters {
    start_block_index: number;
    end_block_index: number;
    ivk: string;
}

export interface IvkDecryptAndMarkParameters {
    start_block_index: number;
    end_block_index: number;
    ivk: string;
    ak: string;
    nk: string;
}

export interface OvkDecryptParameters {
    start_block_index: number;
    end_block_index: number;
    ovk: string;
}

export interface DecryptNotes {
    noteTxs: DecryptNotes_NoteTx[];
}

export interface DecryptNotes_NoteTx {
    note: Note | undefined;
    /** transaction id =  sha256(transaction.rowdata) */
    txid: string;
    /** the index of note in receive */
    index: number;
}

export interface DecryptNotesMarked {
    noteTxs: DecryptNotesMarked_NoteTx[];
}

export interface DecryptNotesMarked_NoteTx {
    note: Note | undefined;
    /** transaction id =  sha256(transaction.rowdata) */
    txid: string;
    /** the index of note in receive */
    index: number;
    is_spend: boolean;
}

export interface Note {
    value: number;
    payment_address: string;
    /** random 32 */
    rcm: string;
    memo: string;
}

export interface SpendNote {
    note: Note | undefined;
    /** random number for spend authority signature */
    alpha: string;
    voucher: IncrementalMerkleVoucher | undefined;
    /** path for cm from leaf to root in merkle tree */
    path: string;
}

export interface ReceiveNote {
    note: Note | undefined;
}

export interface PrivateParameters {
    transparent_from_address: string;
    ask: string;
    nsk: string;
    ovk: string;
    from_amount: number;
    shielded_spends: SpendNote[];
    shielded_receives: ReceiveNote[];
    transparent_to_address: string;
    to_amount: number;
    /** timeout in seconds, it works only when it bigger than 0 */
    timeout: number;
}

export interface PrivateParametersWithoutAsk {
    transparent_from_address: string;
    ak: string;
    nsk: string;
    ovk: string;
    from_amount: number;
    shielded_spends: SpendNote[];
    shielded_receives: ReceiveNote[];
    transparent_to_address: string;
    to_amount: number;
    /** timeout in seconds, it works only when it bigger than 0 */
    timeout: number;
}

export interface SpendAuthSigParameters {
    ask: string;
    tx_hash: string;
    alpha: string;
}

export interface NfParameters {
    note: Note | undefined;
    voucher: IncrementalMerkleVoucher | undefined;
    ak: string;
    nk: string;
}

export interface ExpandedSpendingKeyMessage {
    ask: string;
    nsk: string;
    ovk: string;
}

export interface ViewingKeyMessage {
    ak: string;
    nk: string;
}

export interface IncomingViewingKeyMessage {
    ivk: string;
}

export interface DiversifierMessage {
    d: string;
}

export interface IncomingViewingKeyDiversifierMessage {
    ivk: IncomingViewingKeyMessage | undefined;
    d: DiversifierMessage | undefined;
}

export interface PaymentAddressMessage {
    d: DiversifierMessage | undefined;
    pkD: string;
    payment_address: string;
}

export interface ShieldedAddressInfo {
    sk: string;
    ask: string;
    nsk: string;
    ovk: string;
    ak: string;
    nk: string;
    ivk: string;
    d: string;
    pkD: string;
    payment_address: string;
}

export interface NoteParameters {
    ak: string;
    nk: string;
    note: Note | undefined;
    txid: string;
    index: number;
}

export interface SpendResult {
    result: boolean;
    message: string;
}

export interface TransactionInfoList {
    transactionInfo: TransactionInfo[];
}

export interface SpendNoteTRC20 {
    note: Note | undefined;
    alpha: string;
    root: string;
    path: string;
    pos: number;
}

export interface PrivateShieldedTRC20Parameters {
    ask: string;
    nsk: string;
    ovk: string;
    from_amount: string;
    shielded_spends: SpendNoteTRC20[];
    shielded_receives: ReceiveNote[];
    transparent_to_address: string;
    to_amount: string;
    shielded_TRC20_contract_address: string;
}

export interface PrivateShieldedTRC20ParametersWithoutAsk {
    ak: string;
    nsk: string;
    ovk: string;
    from_amount: string;
    shielded_spends: SpendNoteTRC20[];
    shielded_receives: ReceiveNote[];
    transparent_to_address: string;
    to_amount: string;
    shielded_TRC20_contract_address: string;
}

export interface ShieldedTRC20Parameters {
    spend_description: SpendDescription[];
    receive_description: ReceiveDescription[];
    binding_signature: string;
    message_hash: string;
    trigger_contract_input: string;
    parameter_type: string;
}

export interface IvkDecryptTRC20Parameters {
    start_block_index: number;
    end_block_index: number;
    shielded_TRC20_contract_address: string;
    ivk: string;
    ak: string;
    nk: string;
    events: string[];
}

export interface OvkDecryptTRC20Parameters {
    start_block_index: number;
    end_block_index: number;
    ovk: string;
    shielded_TRC20_contract_address: string;
    events: string[];
}

export interface DecryptNotesTRC20 {
    noteTxs: DecryptNotesTRC20_NoteTx[];
}

export interface DecryptNotesTRC20_NoteTx {
    note: Note | undefined;
    position: number;
    is_spent: boolean;
    txid: string;
    /** the index of note in txid */
    index: number;
    to_amount: string;
    transparent_to_address: string;
}

export interface NfTRC20Parameters {
    note: Note | undefined;
    ak: string;
    nk: string;
    position: number;
    shielded_TRC20_contract_address: string;
}

export interface NullifierResult {
    is_spent: boolean;
}

export interface ShieldedTRC20TriggerContractParameters {
    shielded_TRC20_Parameters: ShieldedTRC20Parameters | undefined;
    spend_authority_signature: BytesMessage[];
    amount: string;
    transparent_to_address: string;
}

export interface Wallet {
    GetAccount(request: Account): Promise<Account>;
    GetAccountById(request: Account): Promise<Account>;
    GetAccountBalance(
        request: AccountBalanceRequest,
    ): Promise<AccountBalanceResponse>;
    GetBlockBalanceTrace(
        request: BlockBalanceTrace_BlockIdentifier,
    ): Promise<BlockBalanceTrace>;
    /** Please use CreateTransaction2 instead of this function. */
    CreateTransaction(request: TransferContract): Promise<Transaction>;
    /** Use this function instead of CreateTransaction. */
    CreateTransaction2(
        request: TransferContract,
    ): Promise<TransactionExtention>;
    BroadcastTransaction(request: Transaction): Promise<Return>;
    /** Please use UpdateAccount2 instead of this function. */
    UpdateAccount(request: AccountUpdateContract): Promise<Transaction>;
    SetAccountId(request: SetAccountIdContract): Promise<Transaction>;
    /** Use this function instead of UpdateAccount. */
    UpdateAccount2(
        request: AccountUpdateContract,
    ): Promise<TransactionExtention>;
    /** Please use VoteWitnessAccount2 instead of this function. */
    VoteWitnessAccount(request: VoteWitnessContract): Promise<Transaction>;
    /** modify the consume_user_resource_percent */
    UpdateSetting(
        request: UpdateSettingContract,
    ): Promise<TransactionExtention>;
    /** modify the energy_limit */
    UpdateEnergyLimit(
        request: UpdateEnergyLimitContract,
    ): Promise<TransactionExtention>;
    /** Use this function instead of VoteWitnessAccount. */
    VoteWitnessAccount2(
        request: VoteWitnessContract,
    ): Promise<TransactionExtention>;
    /** Please use CreateAssetIssue2 instead of this function. */
    CreateAssetIssue(request: AssetIssueContract): Promise<Transaction>;
    /** Use this function instead of CreateAssetIssue. */
    CreateAssetIssue2(
        request: AssetIssueContract,
    ): Promise<TransactionExtention>;
    /** Please use UpdateWitness2 instead of this function. */
    UpdateWitness(request: WitnessUpdateContract): Promise<Transaction>;
    /** Use this function instead of UpdateWitness. */
    UpdateWitness2(
        request: WitnessUpdateContract,
    ): Promise<TransactionExtention>;
    /** Please use CreateAccount2 instead of this function. */
    CreateAccount(request: AccountCreateContract): Promise<Transaction>;
    /** Use this function instead of CreateAccount. */
    CreateAccount2(
        request: AccountCreateContract,
    ): Promise<TransactionExtention>;
    /** Please use CreateWitness2 instead of this function. */
    CreateWitness(request: WitnessCreateContract): Promise<Transaction>;
    /** Use this function instead of CreateWitness. */
    CreateWitness2(
        request: WitnessCreateContract,
    ): Promise<TransactionExtention>;
    /** Please use TransferAsset2 instead of this function. */
    TransferAsset(request: TransferAssetContract): Promise<Transaction>;
    /** Use this function instead of TransferAsset. */
    TransferAsset2(
        request: TransferAssetContract,
    ): Promise<TransactionExtention>;
    /** Please use ParticipateAssetIssue2 instead of this function. */
    ParticipateAssetIssue(
        request: ParticipateAssetIssueContract,
    ): Promise<Transaction>;
    /** Use this function instead of ParticipateAssetIssue. */
    ParticipateAssetIssue2(
        request: ParticipateAssetIssueContract,
    ): Promise<TransactionExtention>;
    /** Please use FreezeBalance2 instead of this function. */
    FreezeBalance(request: FreezeBalanceContract): Promise<Transaction>;
    /** Use this function instead of FreezeBalance. */
    FreezeBalance2(
        request: FreezeBalanceContract,
    ): Promise<TransactionExtention>;
    /** Please use UnfreezeBalance2 instead of this function. */
    UnfreezeBalance(request: UnfreezeBalanceContract): Promise<Transaction>;
    /** Use this function instead of UnfreezeBalance. */
    UnfreezeBalance2(
        request: UnfreezeBalanceContract,
    ): Promise<TransactionExtention>;
    /** Please use UnfreezeAsset2 instead of this function. */
    UnfreezeAsset(request: UnfreezeAssetContract): Promise<Transaction>;
    /** Use this function instead of UnfreezeAsset. */
    UnfreezeAsset2(
        request: UnfreezeAssetContract,
    ): Promise<TransactionExtention>;
    /** Please use WithdrawBalance2 instead of this function. */
    WithdrawBalance(request: WithdrawBalanceContract): Promise<Transaction>;
    /** Use this function instead of WithdrawBalance. */
    WithdrawBalance2(
        request: WithdrawBalanceContract,
    ): Promise<TransactionExtention>;
    /** Please use UpdateAsset2 instead of this function. */
    UpdateAsset(request: UpdateAssetContract): Promise<Transaction>;
    /** Use this function instead of UpdateAsset. */
    UpdateAsset2(request: UpdateAssetContract): Promise<TransactionExtention>;
    ProposalCreate(
        request: ProposalCreateContract,
    ): Promise<TransactionExtention>;
    ProposalApprove(
        request: ProposalApproveContract,
    ): Promise<TransactionExtention>;
    ProposalDelete(
        request: ProposalDeleteContract,
    ): Promise<TransactionExtention>;
    BuyStorage(request: BuyStorageContract): Promise<TransactionExtention>;
    BuyStorageBytes(
        request: BuyStorageBytesContract,
    ): Promise<TransactionExtention>;
    SellStorage(request: SellStorageContract): Promise<TransactionExtention>;
    ExchangeCreate(
        request: ExchangeCreateContract,
    ): Promise<TransactionExtention>;
    ExchangeInject(
        request: ExchangeInjectContract,
    ): Promise<TransactionExtention>;
    ExchangeWithdraw(
        request: ExchangeWithdrawContract,
    ): Promise<TransactionExtention>;
    ExchangeTransaction(
        request: ExchangeTransactionContract,
    ): Promise<TransactionExtention>;
    MarketSellAsset(
        request: MarketSellAssetContract,
    ): Promise<TransactionExtention>;
    MarketCancelOrder(
        request: MarketCancelOrderContract,
    ): Promise<TransactionExtention>;
    GetMarketOrderById(request: BytesMessage): Promise<MarketOrder>;
    GetMarketOrderByAccount(request: BytesMessage): Promise<MarketOrderList>;
    GetMarketPriceByPair(request: MarketOrderPair): Promise<MarketPriceList>;
    GetMarketOrderListByPair(
        request: MarketOrderPair,
    ): Promise<MarketOrderList>;
    GetMarketPairList(request: EmptyMessage): Promise<MarketOrderPairList>;
    ListNodes(request: EmptyMessage): Promise<NodeList>;
    GetAssetIssueByAccount(request: Account): Promise<AssetIssueList>;
    GetAccountNet(request: Account): Promise<AccountNetMessage>;
    GetAccountResource(request: Account): Promise<AccountResourceMessage>;
    GetAssetIssueByName(request: BytesMessage): Promise<AssetIssueContract>;
    GetAssetIssueListByName(request: BytesMessage): Promise<AssetIssueList>;
    GetAssetIssueById(request: BytesMessage): Promise<AssetIssueContract>;
    /** Please use GetNowBlock2 instead of this function. */
    GetNowBlock(request: EmptyMessage): Promise<Block>;
    /** Use this function instead of GetNowBlock. */
    GetNowBlock2(request: EmptyMessage): Promise<BlockExtention>;
    /** Please use GetBlockByNum2 instead of this function. */
    GetBlockByNum(request: NumberMessage): Promise<Block>;
    /** Use this function instead of GetBlockByNum. */
    GetBlockByNum2(request: NumberMessage): Promise<BlockExtention>;
    GetTransactionCountByBlockNum(
        request: NumberMessage,
    ): Promise<NumberMessage>;
    GetBlockById(request: BytesMessage): Promise<Block>;
    GetBlockById2(request: BytesMessage): Promise<BlockExtention>;
    /** Please use GetBlockByLimitNext2 instead of this function. */
    GetBlockByLimitNext(request: BlockLimit): Promise<BlockList>;
    /** Use this function instead of GetBlockByLimitNext. */
    GetBlockByLimitNext2(request: BlockLimit): Promise<BlockListExtention>;
    /** Please use GetBlockByLatestNum2 instead of this function. */
    GetBlockByLatestNum(request: NumberMessage): Promise<BlockList>;
    /** Use this function instead of GetBlockByLatestNum. */
    GetBlockByLatestNum2(request: NumberMessage): Promise<BlockListExtention>;
    GetTransactionById(request: BytesMessage): Promise<Transaction>;
    DeployContract(request: CreateSmartContract): Promise<TransactionExtention>;
    GetContract(request: BytesMessage): Promise<SmartContract>;
    GetContractInfo(request: BytesMessage): Promise<SmartContractDataWrapper>;
    TriggerContract(
        request: TriggerSmartContract,
    ): Promise<TransactionExtention>;
    TriggerConstantContract(
        request: TriggerSmartContract,
    ): Promise<TransactionExtention>;
    ClearContractABI(request: ClearABIContract): Promise<TransactionExtention>;
    ListWitnesses(request: EmptyMessage): Promise<WitnessList>;
    GetDelegatedResource(
        request: DelegatedResourceMessage,
    ): Promise<DelegatedResourceList>;
    GetDelegatedResourceAccountIndex(
        request: BytesMessage,
    ): Promise<DelegatedResourceAccountIndex>;
    ListProposals(request: EmptyMessage): Promise<ProposalList>;
    GetPaginatedProposalList(request: PaginatedMessage): Promise<ProposalList>;
    GetProposalById(request: NumberIdMessage): Promise<Proposal>;
    ListExchanges(request: EmptyMessage): Promise<ExchangeList>;
    GetPaginatedExchangeList(request: PaginatedMessage): Promise<ExchangeList>;
    GetExchangeById(request: NumberIdMessage): Promise<Exchange>;
    GetChainParameters(request: EmptyMessage): Promise<ChainParameters>;
    GetAssetIssueList(request: EmptyMessage): Promise<AssetIssueList>;
    GetPaginatedAssetIssueList(
        request: PaginatedMessage,
    ): Promise<AssetIssueList>;
    TotalTransaction(request: EmptyMessage): Promise<NumberMessage>;
    GetNextMaintenanceTime(request: EmptyMessage): Promise<NumberMessage>;
    /**
     * Warning: do not invoke this interface provided by others.
     * Please use GetTransactionSign2 instead of this function.
     */
    GetTransactionSign(request: TransactionSign): Promise<Transaction>;
    /**
     * Warning: do not invoke this interface provided by others.
     * Use this function instead of GetTransactionSign.
     */
    GetTransactionSign2(
        request: TransactionSign,
    ): Promise<TransactionExtention>;
    /** Warning: do not invoke this interface provided by others. */
    CreateAddress(request: BytesMessage): Promise<BytesMessage>;
    /** Warning: do not invoke this interface provided by others. */
    EasyTransferAsset(
        request: EasyTransferAssetMessage,
    ): Promise<EasyTransferResponse>;
    /** Warning: do not invoke this interface provided by others. */
    EasyTransferAssetByPrivate(
        request: EasyTransferAssetByPrivateMessage,
    ): Promise<EasyTransferResponse>;
    /** Warning: do not invoke this interface provided by others. */
    EasyTransfer(request: EasyTransferMessage): Promise<EasyTransferResponse>;
    /** Warning: do not invoke this interface provided by others. */
    EasyTransferByPrivate(
        request: EasyTransferByPrivateMessage,
    ): Promise<EasyTransferResponse>;
    /** Warning: do not invoke this interface provided by others. */
    GenerateAddress(request: EmptyMessage): Promise<AddressPrKeyPairMessage>;
    GetTransactionInfoById(request: BytesMessage): Promise<TransactionInfo>;
    AccountPermissionUpdate(
        request: AccountPermissionUpdateContract,
    ): Promise<TransactionExtention>;
    AddSign(request: TransactionSign): Promise<TransactionExtention>;
    GetTransactionSignWeight(
        request: Transaction,
    ): Promise<TransactionSignWeight>;
    GetTransactionApprovedList(
        request: Transaction,
    ): Promise<TransactionApprovedList>;
    GetNodeInfo(request: EmptyMessage): Promise<NodeInfo>;
    GetRewardInfo(request: AddressMessage): Promise<RewardMessage>;
    GetBrokerageInfo(request: AddressMessage): Promise<BrokerageMessage>;
    UpdateBrokerage(
        request: UpdateBrokerageContract,
    ): Promise<TransactionExtention>;
    /** for shiededTransaction */
    CreateShieldedTransaction(
        request: PrivateParameters,
    ): Promise<TransactionExtention>;
    GetMerkleTreeVoucherInfo(
        request: OutputPointInfo,
    ): Promise<IncrementalMerkleVoucherInfo>;
    ScanNoteByIvk(request: IvkDecryptParameters): Promise<DecryptNotes>;
    ScanAndMarkNoteByIvk(
        request: IvkDecryptAndMarkParameters,
    ): Promise<DecryptNotesMarked>;
    ScanNoteByOvk(request: OvkDecryptParameters): Promise<DecryptNotes>;
    GetSpendingKey(request: EmptyMessage): Promise<BytesMessage>;
    GetExpandedSpendingKey(
        request: BytesMessage,
    ): Promise<ExpandedSpendingKeyMessage>;
    GetAkFromAsk(request: BytesMessage): Promise<BytesMessage>;
    GetNkFromNsk(request: BytesMessage): Promise<BytesMessage>;
    GetIncomingViewingKey(
        request: ViewingKeyMessage,
    ): Promise<IncomingViewingKeyMessage>;
    GetDiversifier(request: EmptyMessage): Promise<DiversifierMessage>;
    GetNewShieldedAddress(request: EmptyMessage): Promise<ShieldedAddressInfo>;
    GetZenPaymentAddress(
        request: IncomingViewingKeyDiversifierMessage,
    ): Promise<PaymentAddressMessage>;
    GetRcm(request: EmptyMessage): Promise<BytesMessage>;
    IsSpend(request: NoteParameters): Promise<SpendResult>;
    CreateShieldedTransactionWithoutSpendAuthSig(
        request: PrivateParametersWithoutAsk,
    ): Promise<TransactionExtention>;
    GetShieldTransactionHash(request: Transaction): Promise<BytesMessage>;
    CreateSpendAuthSig(request: SpendAuthSigParameters): Promise<BytesMessage>;
    CreateShieldNullifier(request: NfParameters): Promise<BytesMessage>;
    /** for shielded contract */
    CreateShieldedContractParameters(
        request: PrivateShieldedTRC20Parameters,
    ): Promise<ShieldedTRC20Parameters>;
    CreateShieldedContractParametersWithoutAsk(
        request: PrivateShieldedTRC20ParametersWithoutAsk,
    ): Promise<ShieldedTRC20Parameters>;
    ScanShieldedTRC20NotesByIvk(
        request: IvkDecryptTRC20Parameters,
    ): Promise<DecryptNotesTRC20>;
    ScanShieldedTRC20NotesByOvk(
        request: OvkDecryptTRC20Parameters,
    ): Promise<DecryptNotesTRC20>;
    IsShieldedTRC20ContractNoteSpent(
        request: NfTRC20Parameters,
    ): Promise<NullifierResult>;
    GetTriggerInputForShieldedTRC20Contract(
        request: ShieldedTRC20TriggerContractParameters,
    ): Promise<BytesMessage>;
    CreateCommonTransaction(
        request: Transaction,
    ): Promise<TransactionExtention>;
    GetTransactionInfoByBlockNum(
        request: NumberMessage,
    ): Promise<TransactionInfoList>;
    GetBurnTrx(request: EmptyMessage): Promise<NumberMessage>;
    GetTransactionFromPending(request: BytesMessage): Promise<Transaction>;
    GetTransactionListFromPending(
        request: EmptyMessage,
    ): Promise<TransactionIdList>;
    GetPendingSize(request: EmptyMessage): Promise<NumberMessage>;
    GetBlock(request: BlockReq): Promise<BlockExtention>;
    SideChainProposalCreate(
        request: SideChainProposalCreateContract,
    ): Promise<Transaction>;
    FundInject(request: FundInjectContract): Promise<Transaction>;
    EstimateEnergy(request: EnergyEstimateContract): Promise<EstimateEnergyResponse>
    GetBandwidthPrices(request: any | undefined): Promise<EstimatePrices>
    GetEnergyPrices(request: any | undefined): Promise<EstimatePrices>
}

export interface WalletSolidity {
    GetAccount(request: Account): Promise<Account>;
    GetAccountById(request: Account): Promise<Account>;
    ListWitnesses(request: EmptyMessage): Promise<WitnessList>;
    GetAssetIssueList(request: EmptyMessage): Promise<AssetIssueList>;
    GetPaginatedAssetIssueList(
        request: PaginatedMessage,
    ): Promise<AssetIssueList>;
    GetAssetIssueByName(request: BytesMessage): Promise<AssetIssueContract>;
    GetAssetIssueListByName(request: BytesMessage): Promise<AssetIssueList>;
    GetAssetIssueById(request: BytesMessage): Promise<AssetIssueContract>;
    /** Please use GetNowBlock2 instead of this function. */
    GetNowBlock(request: EmptyMessage): Promise<Block>;
    /** Use this function instead of GetNowBlock. */
    GetNowBlock2(request: EmptyMessage): Promise<BlockExtention>;
    /** Please use GetBlockByNum2 instead of this function. */
    GetBlockByNum(request: NumberMessage): Promise<Block>;
    /** Use this function instead of GetBlockByNum. */
    GetBlockByNum2(request: NumberMessage): Promise<BlockExtention>;
    GetTransactionCountByBlockNum(
        request: NumberMessage,
    ): Promise<NumberMessage>;
    GetDelegatedResource(
        request: DelegatedResourceMessage,
    ): Promise<DelegatedResourceList>;
    GetDelegatedResourceAccountIndex(
        request: BytesMessage,
    ): Promise<DelegatedResourceAccountIndex>;
    GetExchangeById(request: NumberIdMessage): Promise<Exchange>;
    ListExchanges(request: EmptyMessage): Promise<ExchangeList>;
    GetTransactionById(request: BytesMessage): Promise<Transaction>;
    GetTransactionInfoById(request: BytesMessage): Promise<TransactionInfo>;
    /** Warning: do not invoke this interface provided by others. */
    GenerateAddress(request: EmptyMessage): Promise<AddressPrKeyPairMessage>;
    GetMerkleTreeVoucherInfo(
        request: OutputPointInfo,
    ): Promise<IncrementalMerkleVoucherInfo>;
    ScanNoteByIvk(request: IvkDecryptParameters): Promise<DecryptNotes>;
    ScanAndMarkNoteByIvk(
        request: IvkDecryptAndMarkParameters,
    ): Promise<DecryptNotesMarked>;
    ScanNoteByOvk(request: OvkDecryptParameters): Promise<DecryptNotes>;
    IsSpend(request: NoteParameters): Promise<SpendResult>;
    ScanShieldedTRC20NotesByIvk(
        request: IvkDecryptTRC20Parameters,
    ): Promise<DecryptNotesTRC20>;
    ScanShieldedTRC20NotesByOvk(
        request: OvkDecryptTRC20Parameters,
    ): Promise<DecryptNotesTRC20>;
    IsShieldedTRC20ContractNoteSpent(
        request: NfTRC20Parameters,
    ): Promise<NullifierResult>;
    GetRewardInfo(request: AddressMessage): Promise<RewardMessage>;
    GetBrokerageInfo(request: AddressMessage): Promise<BrokerageMessage>;
    TriggerConstantContract(
        request: TriggerSmartContract,
    ): Promise<TransactionExtention>;
    GetTransactionInfoByBlockNum(
        request: NumberMessage,
    ): Promise<TransactionInfoList>;
    GetMarketOrderById(request: BytesMessage): Promise<MarketOrder>;
    GetMarketOrderByAccount(request: BytesMessage): Promise<MarketOrderList>;
    GetMarketPriceByPair(request: MarketOrderPair): Promise<MarketPriceList>;
    GetMarketOrderListByPair(
        request: MarketOrderPair,
    ): Promise<MarketOrderList>;
    GetMarketPairList(request: EmptyMessage): Promise<MarketOrderPairList>;
    GetBurnTrx(request: EmptyMessage): Promise<NumberMessage>;
    GetBlock(request: BlockReq): Promise<BlockExtention>;
    EstimateEnergy(request: EnergyEstimateContract): Promise<EstimateEnergyResponse>
    GetBandwidthPrices(request: any | undefined): Promise<EstimatePrices>
    GetEnergyPrices(request: any | undefined): Promise<EstimatePrices>
}

export interface WalletExtension {
    /** Please use GetTransactionsFromThis2 instead of this function. */
    GetTransactionsFromThis(
        request: AccountPaginated,
    ): Promise<TransactionList>;
    /** Use this function instead of GetTransactionsFromThis. */
    GetTransactionsFromThis2(
        request: AccountPaginated,
    ): Promise<TransactionListExtention>;
    /** Please use GetTransactionsToThis2 instead of this function. */
    GetTransactionsToThis(request: AccountPaginated): Promise<TransactionList>;
    /** Use this function instead of GetTransactionsToThis. */
    GetTransactionsToThis2(
        request: AccountPaginated,
    ): Promise<TransactionListExtention>;
}

/** the api of tron's db */
export interface Database {
    /** for tapos */
    getBlockReference(request: EmptyMessage): Promise<BlockReference>;
    GetDynamicProperties(request: EmptyMessage): Promise<DynamicProperties>;
    GetNowBlock(request: EmptyMessage): Promise<Block>;
    GetBlockByNum(request: NumberMessage): Promise<Block>;
}

export interface Monitor {
    GetStatsInfo(request: EmptyMessage): Promise<MetricsInfo>;
}

/** the api of tron's network such as node list. */
export interface Network {}
