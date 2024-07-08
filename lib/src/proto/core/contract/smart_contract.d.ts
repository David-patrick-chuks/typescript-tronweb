export declare const protobufPackage = "protocol";
export interface SmartContract {
    origin_address: string;
    contract_address: string;
    abi: SmartContract_ABI | undefined;
    bytecode: string;
    call_value: number;
    consume_user_resource_percent: number;
    name: string;
    origin_energy_limit: number;
    code_hash: string;
    trx_hash: string;
}
export interface SmartContract_ABI {
    entrys: SmartContract_ABI_Entry[];
}
export interface SmartContract_ABI_Entry {
    anonymous?: boolean | undefined;
    constant?: boolean | undefined;
    name: string;
    inputs: SmartContract_ABI_Entry_Param[];
    outputs: SmartContract_ABI_Entry_Param[];
    type: SmartContract_ABI_Entry_EntryType;
    payable?: boolean | undefined;
    stateMutability: SmartContract_ABI_Entry_StateMutabilityType;
}
export declare const SmartContract_ABI_Entry_EntryType: {
    readonly UnknownEntryType: "UnknownEntryType";
    readonly Constructor: "constructor";
    readonly Function: "function";
    readonly Event: "event";
    readonly Fallback: "fallback";
    readonly Receive: "receive";
    readonly Error: "error";
};
export declare type SmartContract_ABI_Entry_EntryType = typeof SmartContract_ABI_Entry_EntryType[keyof typeof SmartContract_ABI_Entry_EntryType];
export declare const SmartContract_ABI_Entry_StateMutabilityType: {
    readonly UnknownMutabilityType: "UnknownMutabilityType";
    readonly Pure: "pure";
    readonly View: "view";
    readonly Nonpayable: "nonpayable";
    readonly Payable: "payable";
};
export declare type SmartContract_ABI_Entry_StateMutabilityType = typeof SmartContract_ABI_Entry_StateMutabilityType[keyof typeof SmartContract_ABI_Entry_StateMutabilityType];
export interface SmartContract_ABI_Entry_Param {
    indexed: boolean;
    name: string;
    /** SolidityType type = 3; */
    type: string;
}
export interface CreateSmartContract {
    owner_address: string;
    call_token_value?: number;
    token_id?: number;
    origin_address?: string;
    contract_address?: string;
    abi: SmartContract_ABI | undefined;
    bytecode: string;
    call_value: number;
    consume_user_resource_percent: number;
    name: string;
    origin_energy_limit: number;
    code_hash?: string;
    trx_hash?: string;
}
export interface TriggerSmartContract {
    owner_address: string;
    contract_address: string;
    call_value: number;
    data: string;
    call_token_value: number;
    token_id: number;
}
export interface ClearABIContract {
    owner_address: string;
    contract_address: string;
}
export interface UpdateSettingContract {
    owner_address: string;
    contract_address: string;
    consume_user_resource_percent: number;
}
export interface UpdateEnergyLimitContract {
    owner_address: string;
    contract_address: string;
    origin_energy_limit: number;
}
export interface SmartContractDataWrapper {
    smart_contract: SmartContract | undefined;
    runtimecode: string;
}
//# sourceMappingURL=smart_contract.d.ts.map