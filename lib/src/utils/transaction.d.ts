declare const txJsonToPb: (transaction: any) => any;
declare const txJsonToPbWithArgs: (transaction: any, args?: any | {}, options?: any | {}) => any;
declare const txPbToRawDataHex: (pb: any) => string;
declare const txCheck: (transaction: any) => boolean;
declare const txCheckWithArgs: (transaction: any, args: any, options: any) => boolean;
declare const txPbToTxID: (transactionPb: any) => string;
export { txJsonToPb, txPbToTxID, txPbToRawDataHex, txJsonToPbWithArgs, txCheckWithArgs, txCheck, };
//# sourceMappingURL=transaction.d.ts.map