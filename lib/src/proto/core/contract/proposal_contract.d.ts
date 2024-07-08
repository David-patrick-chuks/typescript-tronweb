export declare const protobufPackage = "protocol";
export interface ProposalApproveContract {
    owner_address: string;
    proposal_id: number;
    /** add or remove approval */
    is_add_approval: boolean;
}
export interface ProposalCreateContract {
    owner_address: string;
    parameters: {
        key: number;
        value: number;
    }[];
}
export interface ProposalCreateContract_ParametersEntry {
    key: number;
    value: number;
}
export interface ProposalDeleteContract {
    owner_address: string;
    proposal_id: number;
}
//# sourceMappingURL=proposal_contract.d.ts.map