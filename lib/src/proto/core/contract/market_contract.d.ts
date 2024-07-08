export declare const protobufPackage = "protocol";
export interface MarketSellAssetContract {
    owner_address: string;
    sell_token_id: string;
    sell_token_quantity: number;
    buy_token_id: string;
    /** min to receive */
    buy_token_quantity: number;
}
export interface MarketCancelOrderContract {
    owner_address: string;
    order_id: string;
}
//# sourceMappingURL=market_contract.d.ts.map