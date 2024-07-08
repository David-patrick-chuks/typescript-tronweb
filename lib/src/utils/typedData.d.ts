export interface IField {
    name: string;
    type: string;
}
export interface IDomain {
    name: string;
    version: string;
    chainId: string;
    verifyingContract: string;
}
export declare class TypedDataEncoder {
    readonly types: Record<string, IField[]>;
    readonly primaryType: string;
    readonly _types: Record<string, string>;
    readonly _encoderCache: Record<string, (__v: unknown) => string>;
    constructor(types: Record<string, IField[]>);
    getEncoder(type: string): (__v: unknown) => string;
    private _getEncoder;
    encodeType(name: string): string;
    encodeData(type: string, value: unknown): string;
    hashStruct(name: string, value: unknown): string;
    encode(value: unknown): string;
    hash(value: unknown): string;
    private _visit;
    visit(value: unknown, callback: (type: string, value: unknown) => any): any;
    static from(types: Record<string, IField[]>): TypedDataEncoder;
    static getPrimaryType(types: Record<string, IField[]>): string;
    static hashStruct(name: string, types: Record<string, IField[]>, value: unknown): string;
    static hashDomain(domain: IDomain): string;
    static encode(domain: IDomain, types: Record<string, IField[]>, value: unknown): string;
    static hash(domain: IDomain, types: Record<string, IField[]>, value: unknown): string;
    static getPayload(domain: IDomain, types: Record<string, IField[]>, value: unknown): {
        types: Record<string, IField[]>;
        domain: {
            [key: string]: any;
        };
        primaryType: string;
        message: any;
    };
}
//# sourceMappingURL=typedData.d.ts.map