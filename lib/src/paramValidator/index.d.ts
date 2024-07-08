import TronWeb from '..';
interface IOperatorBase {
    msg?: string;
    value?: any;
    optional?: boolean;
}
export declare type IUnaryOperator = IOperatorBase & ({
    name: string;
    type: 'address' | 'positive-integer' | 'tokenId' | 'notEmptyObject' | 'resource' | 'url' | 'hex' | 'array' | 'not-empty-string' | 'boolean';
} | {
    name: string;
    type: 'integer' | 'string';
    gt?: number;
    lt?: number;
    gte?: number;
    lte?: number;
});
export declare type IBinaryOperator = IOperatorBase & {
    msg: string;
    type: 'notEqual';
    names: [string, string];
};
export declare type IOperator = IUnaryOperator | IBinaryOperator;
export default class Validator {
    tronWeb: TronWeb;
    constructor(tronWeb: TronWeb);
    invalid(param: IOperator): string;
    notPositive(param: IUnaryOperator): string;
    notEqual(param: IBinaryOperator): string;
    notValid(params?: IOperator[], callback?: Function): boolean | undefined;
}
export {};
//# sourceMappingURL=index.d.ts.map