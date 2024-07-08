export declare const protobufPackage = "protocol";
export interface WitnessCreateContract {
    owner_address: string;
    url: string;
}
export interface WitnessUpdateContract {
    owner_address: string;
    update_url: string;
}
export interface VoteWitnessContract {
    owner_address: string;
    votes: VoteWitnessContract_Vote[];
    support?: boolean | undefined;
}
export interface VoteWitnessContract_Vote {
    vote_address: string;
    vote_count: number;
}
//# sourceMappingURL=witness_contract.d.ts.map