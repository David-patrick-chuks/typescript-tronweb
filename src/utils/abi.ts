import { ADDRESS_PREFIX, ADDRESS_PREFIX_REGEX } from './address';
import { AbiCoder } from './ethersUtils';
import TronWeb from '..';

const abiCoder = new AbiCoder();

function _addressToHex(value: string): string {
    return TronWeb.address.toHex(value).replace(ADDRESS_PREFIX_REGEX, '0x');
}

function deepCopy<T>(target: T): T {
    if (
        Object.prototype.toString.call(target) !== '[object Object]' &&
        Object.prototype.toString.call(target) !== '[object Array]'
    )
        return target;

    const newTarget = (Array.isArray(target) ? [] : {}) as typeof target;

    for (const key in target) {
        newTarget[key] =
            target[key] instanceof Object && !target[key]['_isBigNumber']
                ? deepCopy(target[key])
                : target[key];
    }

    return newTarget;
}

export function decodeParams(
    names_: string[],
    types_: string,
    output_: boolean,
): any[];
export function decodeParams(
    names_: string[],
    types_: string[] | string,
    output_: string | boolean,
    ignoreMethodHash_: boolean,
): any[];
export function decodeParams(
    names_: string[],
    types_: string[] | string,
    output_: string | boolean,
    ignoreMethodHash_?: boolean,
): any[] {
    let ignoreMethodHash: boolean;
    let output: string;
    let types: string[];
    let names: string[];
    if (!output_ || typeof output_ === 'boolean') {
        // @ts-ignore
        ignoreMethodHash = output_;
        // @ts-ignore
        output = types_;
        types = names_;
        names = [];
    } else {
        // @ts-ignore
        ignoreMethodHash = ignoreMethodHash_;
        output = output_;
        // @ts-ignore
        types = types_;
        names = names_;
    }

    if (ignoreMethodHash && output.replace(/^0x/, '').length % 64 === 8)
        output = '0x' + output.replace(/^0x/, '').substring(8);

    if (output.replace(/^0x/, '').length % 64) {
        throw new Error(
            'The encoded string is not valid. Its length must be a multiple of 64.',
        );
    }

    // workaround for unsupported trcToken type
    types = types.map((type) => {
        if (/trcToken/.test(type)) type = type.replace(/trcToken/, 'uint256');

        return type;
    });

    return abiCoder.decode(types, output).reduce(
        (obj, arg, index) => {
            if (types[index] === 'address')
                arg = ADDRESS_PREFIX + arg.substr(2).toLowerCase();

            if (names.length) obj[names[index]] = arg;
            else obj.push(arg);

            return obj;
        },
        names.length ? {} : [],
    );
}

export function encodeParams(types: string[], values: any[]): string {
    for (let i = 0; i < types.length; i++) {
        if (types[i] === 'address') {
            values[i] = TronWeb.address
                .toHex(values[i])
                .replace(ADDRESS_PREFIX_REGEX, '0x');
        }
    }

    return abiCoder.encode(types, values);
}

function extractSize(type: string): string {
    const size = type.match(/([a-zA-Z0-9])(\[.*\])/);
    return size ? size[2] : '';
}

function extractArrayDim(type: string): number {
    const size = extractSize(type);
    return (size.match(/\]\[/g) || []).length + 1;
}

export interface IFieldABI {
    name: string;
    type: string;
    components: IFieldABI[];
}
export interface IFunABI {
    inputs?: IFieldABI[];
    outputs?: IFieldABI[];
}

export function encodeParamsV2ByABI(funABI: IFunABI, args) {
    const types: string[] = [];

    const buildFullTypeDefinition = (typeDef) => {
        if (
            typeDef &&
            typeDef.type.indexOf('tuple') === 0 &&
            typeDef.components
        ) {
            const innerTypes = typeDef.components.map((innerType) => {
                return buildFullTypeDefinition(innerType);
            });
            return `tuple(${innerTypes.join(',')})${extractSize(typeDef.type)}`;
        }

        if (/trcToken/.test(typeDef.type))
            return typeDef.type.replace(/trcToken/, 'uint256');

        return typeDef.type;
    };

    const convertTypes = (types) => {
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            if (/trcToken/.test(type))
                types[i] = type.replace(/trcToken/, 'uint256');
        }
    };

    const convertAddresses = (addrArr) => {
        if (Array.isArray(addrArr)) {
            addrArr.forEach((addrs, i) => {
                addrArr[i] = convertAddresses(addrs);
            });
            return addrArr;
        } else {
            return _addressToHex(addrArr);
        }
    };

    const mapTuple = (components, args, dimension) => {
        if (dimension > 1) {
            if (args.length) {
                args.forEach((arg) => {
                    mapTuple(components, arg, dimension - 1);
                });
            }
        } else {
            if (args.length && dimension) {
                args.forEach((arg) => {
                    encodeArgs(components, arg);
                });
            }
        }
    };

    const encodeArgs = (inputs: IFieldABI[] = [], args: any[]) => {
        if (inputs.length) {
            inputs.forEach((input, i) => {
                const type = input.type;

                if (args[i]) {
                    if (type === 'address') {
                        args[i] = _addressToHex(args[i]);
                    } else if (
                        type.match(/^([^\x5b]*)(\x5b|$)/)![0] === 'address['
                    ) {
                        convertAddresses(args[i]);
                    } else if (type.indexOf('tuple') === 0) {
                        if (extractSize(type)) {
                            const dimension = extractArrayDim(type);
                            mapTuple(input.components, args[i], dimension);
                        } else {
                            encodeArgs(input.components, args[i]);
                        }
                    }
                }
            });
        }
    };

    if (funABI.inputs && funABI.inputs.length) {
        for (let i = 0; i < funABI.inputs.length; i++) {
            const type = funABI.inputs[i].type;
            // "false" will be converting to `false` and "true" will be working
            // fine as abiCoder assume anything in quotes as `true`
            if (type === 'bool' && args[i] === 'false') args[i] = false;

            types.push(
                type.indexOf('tuple') === 0
                    ? buildFullTypeDefinition(funABI.inputs[i])
                    : type,
            );
            if (args.length < types.length) args.push('');
        }
    }

    encodeArgs(funABI.inputs, args);
    convertTypes(types);

    return abiCoder.encode(types, args);
}

export function decodeParamsV2ByABI(funABI: IFunABI, data) {
    const convertTypeNames = (types) => {
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            if (/^trcToken/.test(type))
                types[i] = type.replace(/^trcToken/, 'uint256');
        }
    };

    const convertAddresses = (addrArr) => {
        if (Array.isArray(addrArr)) {
            addrArr.forEach((addrs, i) => {
                addrArr[i] = convertAddresses(addrs);
            });
            return addrArr;
        } else {
            return TronWeb.address.toHex(addrArr);
        }
    };

    const mapTuple = (components, args, dimension) => {
        if (dimension > 1) {
            if (args.length) {
                args.forEach((arg) => {
                    mapTuple(components, arg, dimension - 1);
                });
            }
        } else {
            if (args.length && dimension) {
                args.forEach((arg) => {
                    decodeResult(components, arg);
                });
            }
        }
    };

    const buildFullTypeNameDefinition = (typeDef) => {
        const name = typeDef.name ? ` ${typeDef.name}` : '';
        if (
            typeDef &&
            typeDef.type.indexOf('tuple') === 0 &&
            typeDef.components
        ) {
            const innerTypes = typeDef.components.map((innerType) => {
                return buildFullTypeNameDefinition(innerType);
            });
            return `tuple(${innerTypes.join(',')})${extractSize(
                typeDef.type,
            )}${name}`;
        }
        if (/trcToken/.test(typeDef.type))
            return typeDef.type.replace(/trcToken/, 'uint256') + name;

        return typeDef.type + name;
    };

    const decodeResult = (
        outputs: IFieldABI[] = [],
        result: { [key: number | string]: any },
    ) => {
        if (outputs.length) {
            outputs.forEach((output, i) => {
                const { type, name } = output;

                if (result[i]) {
                    if (type === 'address') {
                        result[i] = TronWeb.address.toHex(result[i]);
                        if (name)
                            result[name] = TronWeb.address.toHex(result[name]);
                    } else if (
                        type.match(/^([^\x5b]*)(\x5b|$)/)![0] === 'address['
                    ) {
                        convertAddresses(result[i]);
                        if (name) convertAddresses(result[name]);
                    } else if (type.indexOf('tuple') === 0) {
                        if (extractSize(type)) {
                            const dimension = extractArrayDim(type);
                            mapTuple(output.components, result[i], dimension);
                        } else {
                            decodeResult(output.components, result[i]);
                        }

                        if (name) result[name] = result[i];
                    }
                }
            });
        }
    };

    // Only decode if there supposed to be fields
    if (funABI.outputs && funABI.outputs.length > 0) {
        const outputTypes: string[] = [];
        for (let i = 0; i < funABI.outputs.length; i++) {
            const type = funABI.outputs[i].type;
            const name = funABI.outputs[i].name
                ? ` ${funABI.outputs[i].name}`
                : '';
            outputTypes.push(
                type.indexOf('tuple') === 0
                    ? buildFullTypeNameDefinition(funABI.outputs[i])
                    : type + name,
            );
        }
        convertTypeNames(outputTypes);

        // ensure the data is at least filled by 0
        // cause `AbiCoder` throws if there's not enough data
        if (!data || !data.length)
            data = new Uint8Array(32 * funABI.outputs.length);
        // decode data
        const decodeRes = abiCoder.decode(outputTypes, data);
        const decodeResCopy = deepCopy(decodeRes);
        decodeResult(funABI.outputs, decodeResCopy);

        return decodeResCopy;
    }
    return [];
}
