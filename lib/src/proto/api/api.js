"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionApprovedList_Result_response_code = exports.TransactionSignWeight_Result_response_code = exports.Return_response_code = exports.protobufPackage = void 0;
exports.protobufPackage = 'protocol';
exports.Return_response_code = {
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
};
exports.TransactionSignWeight_Result_response_code = {
    ENOUGH_PERMISSION: 'ENOUGH_PERMISSION',
    /** NOT_ENOUGH_PERMISSION - error in */
    NOT_ENOUGH_PERMISSION: 'NOT_ENOUGH_PERMISSION',
    SIGNATURE_FORMAT_ERROR: 'SIGNATURE_FORMAT_ERROR',
    COMPUTE_ADDRESS_ERROR: 'COMPUTE_ADDRESS_ERROR',
    /** PERMISSION_ERROR - The key is not in permission */
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    OTHER_ERROR: 'OTHER_ERROR',
};
exports.TransactionApprovedList_Result_response_code = {
    SUCCESS: 'SUCCESS',
    SIGNATURE_FORMAT_ERROR: 'SIGNATURE_FORMAT_ERROR',
    COMPUTE_ADDRESS_ERROR: 'COMPUTE_ADDRESS_ERROR',
    OTHER_ERROR: 'OTHER_ERROR',
};
//# sourceMappingURL=api.js.map