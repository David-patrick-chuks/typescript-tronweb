export declare function decodeParams(names_: string[], types_: string, output_?: boolean): any;
export declare function decodeParams(names_: string[], types_: string[], output_?: string, ignoreMethodHash_?: boolean): any[];
export declare function encodeParams(types: string[], values: any[]): string;
export interface IFieldABI {
    name: string;
    type: string;
    components?: IFieldABI[];
}
export interface IFunABI {
    inputs?: IFieldABI[];
    outputs?: IFieldABI[];
}
export declare function encodeParamsV2ByABI(funABI: IFunABI, args: unknown[]): string;
export declare function decodeParamsV2ByABI(funABI: IFunABI, data: any): import("@ethersproject/abi").Result;
//# sourceMappingURL=abi.d.ts.map