import type { AccountType, Permission } from '../Tron';
export declare const protobufPackage = "protocol";
export interface AccountCreateContract {
    owner_address: string;
    account_address: string;
    type: AccountType;
}
/** Update account name. Account name is not unique now. */
export interface AccountUpdateContract {
    account_name: string;
    owner_address: string;
}
/** Set account id if the account has no id. Account id is unique and case insensitive. */
export interface SetAccountIdContract {
    account_id: string;
    owner_address: string;
}
export interface AccountPermissionUpdateContract {
    owner_address: string;
    /** Empty is invalidate */
    owner: Permission | undefined;
    /** Can be empty */
    witness: Permission | undefined;
    /** Empty is invalidate */
    actives: Permission[];
}
//# sourceMappingURL=account_contract.d.ts.map