import {BigNumber} from '@ethersproject/bignumber';
import {arrayify, hexConcat, hexZeroPad, hexlify} from '@ethersproject/bytes';
import {keccak256} from '@ethersproject/keccak256';
import {Logger} from '@ethersproject/logger';
import {deepCopy, defineReadOnly, shallowCopy} from '@ethersproject/properties';
import {toUtf8Bytes} from '@ethersproject/strings';

import TronWeb from '..';
import {ADDRESS_PREFIX_REGEX} from './address';
import type {SomeBytes} from './bytes';

const version = 'tronweb/hash/5.4.0';
const logger = new Logger(version);

function getAddress(address: string) {
    return TronWeb.address.toHex(address).replace(ADDRESS_PREFIX_REGEX, '0x');
}

function getTronAddress(address: string) {
    return TronWeb.address.toHex(address);
}

function id(text: string) {
    return keccak256(toUtf8Bytes(text));
}

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

const padding = new Uint8Array(32);
padding.fill(0);
const NegativeOne = BigNumber.from(-1);
const Zero = BigNumber.from(0);
const One = BigNumber.from(1);
const MaxUint256 = BigNumber.from(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
);

function hexPadRight(value: string) {
    const bytes = arrayify(value);
    const padOffset = bytes.length % 32;
    if (padOffset) return hexConcat([bytes, padding.slice(padOffset)]);

    return hexlify(bytes);
}

const hexTrue = hexZeroPad(One.toHexString(), 32);
const hexFalse = hexZeroPad(Zero.toHexString(), 32);
const domainFieldTypes = {
    name: 'string',
    version: 'string',
    chainId: 'uint256',
    verifyingContract: 'address',
    salt: 'bytes32',
};
const domainFieldNames = [
    'name',
    'version',
    'chainId',
    'verifyingContract',
    'salt',
];

function checkString(key: string) {
    return function <T>(value: T): T extends string ? T : never {
        if (typeof value !== 'string')
            logger.throwArgumentError(
                `invalid domain value for ${JSON.stringify(key)}`,
                `domain.${key}`,
                value,
            );

        return value as any;
    };
}

const domainChecks = {
    name: checkString('name'),
    version: checkString('version'),
    chainId: function (value: unknown) {
        try {
            return BigNumber.from(value).toString();
        } catch (error) {}
        return logger.throwArgumentError(
            'invalid domain value for "chainId"',
            'domain.chainId',
            value,
        );
    },
    verifyingContract: function (value: string) {
        try {
            return getTronAddress(value).toLowerCase();
        } catch (error) {}
        return logger.throwArgumentError(
            'invalid domain value "verifyingContract"',
            'domain.verifyingContract',
            value,
        );
    },
    salt: function (value: string | number | SomeBytes) {
        try {
            const bytes = arrayify(value);
            if (bytes.length !== 32) throw new Error('bad length');

            return hexlify(bytes);
        } catch (error) {}
        return logger.throwArgumentError(
            'invalid domain value "salt"',
            'domain.salt',
            value,
        );
    },
};

function getBaseEncoder(type: string): ((value: any) => string) | null {
    // intXX and uintXX
    {
        const match = type.match(/^(u?)int(\d*)$/);
        if (match) {
            const signed = match[1] === '';
            const width = parseInt(match[2] || '256');
            if (
                width % 8 !== 0 ||
                width > 256 ||
                (match[2] && match[2] !== String(width))
            )
                logger.throwArgumentError(
                    'invalid numeric width',
                    'type',
                    type,
                );

            const boundsUpper = MaxUint256.mask(signed ? width - 1 : width);
            const boundsLower = signed
                ? boundsUpper.add(One).mul(NegativeOne)
                : Zero;
            return function (value) {
                const v = BigNumber.from(value);
                if (v.lt(boundsLower) || v.gt(boundsUpper))
                    logger.throwArgumentError(
                        `value out-of-bounds for ${type}`,
                        'value',
                        value,
                    );

                return hexZeroPad(v.toTwos(256).toHexString(), 32);
            };
        }
    }
    // bytesXX
    {
        const match = type.match(/^bytes(\d+)$/);
        if (match) {
            const width = parseInt(match[1]);
            if (width === 0 || width > 32 || match[1] !== String(width))
                logger.throwArgumentError('invalid bytes width', 'type', type);

            return function (value) {
                const bytes = arrayify(value);
                if (bytes.length !== width)
                    logger.throwArgumentError(
                        `invalid length for ${type}`,
                        'value',
                        value,
                    );

                return hexPadRight(value);
            };
        }
    }
    switch (type) {
        case 'trcToken':
            return getBaseEncoder('uint256');
        case 'address':
            return function (value) {
                return hexZeroPad(getAddress(value), 32);
            };
        case 'bool':
            return function (value) {
                return !value ? hexFalse : hexTrue;
            };
        case 'bytes':
            return function (value) {
                return keccak256(value);
            };
        case 'string':
            return function (value) {
                return id(value);
            };
    }
    return null;
}

function encodeType(name: string, fields: IField[]) {
    return `${name}(${fields
        .map(({name, type}) => type + ' ' + name)
        .join(',')})`;
}

export class TypedDataEncoder {
    readonly types!: Record<string, IField[]>;
    readonly primaryType!: string;
    readonly _types!: Record<string, string>;
    readonly _encoderCache!: Record<string, (__v: unknown) => string>;

    constructor(types: Record<string, IField[]>) {
        defineReadOnly(this, 'types', Object.freeze(deepCopy(types)));
        defineReadOnly(this, '_encoderCache', {});
        defineReadOnly(this, '_types', {});
        // Link struct types to their direct child structs
        const links = {};
        // Link structs to structs which contain them as a child
        const parents = {};
        // Link all subtypes within a given struct
        const subtypes = {};
        Object.keys(types).forEach((type) => {
            links[type] = {};
            parents[type] = [];
            subtypes[type] = {};
        });
        for (const name in types) {
            const uniqueNames = {};
            types[name].forEach((field) => {
                // Check each field has a unique name
                if (uniqueNames[field.name])
                    logger.throwArgumentError(
                        `duplicate variable name ${JSON.stringify(
                            field.name,
                        )} in ${JSON.stringify(name)}`,
                        'types',
                        types,
                    );

                uniqueNames[field.name] = true;
                // Get the base type (drop any array specifiers)
                const baseType = field.type.match(/^([^\x5b]*)(\x5b|$)/)![1];
                if (baseType === name)
                    logger.throwArgumentError(
                        `circular type reference to ${JSON.stringify(
                            baseType,
                        )}`,
                        'types',
                        types,
                    );

                // Is this a base encoding type?
                const encoder = getBaseEncoder(baseType);
                if (encoder) return;

                if (!parents[baseType])
                    logger.throwArgumentError(
                        `unknown type ${JSON.stringify(baseType)}`,
                        'types',
                        types,
                    );

                // Add linkage
                parents[baseType].push(name);
                links[name][baseType] = true;
            });
        }
        // Deduce the primary type
        const primaryTypes = Object.keys(parents).filter(
            (n) => parents[n].length === 0,
        );
        if (primaryTypes.length === 0)
            logger.throwArgumentError('missing primary type', 'types', types);
        else if (primaryTypes.length > 1)
            logger.throwArgumentError(
                `ambiguous primary types or unused types: ${primaryTypes
                    .map((t) => JSON.stringify(t))
                    .join(', ')}`,
                'types',
                types,
            );

        defineReadOnly(this, 'primaryType', primaryTypes[0]);
        // Check for circular type references
        function checkCircular(type, found) {
            if (found[type])
                logger.throwArgumentError(
                    `circular type reference to ${JSON.stringify(type)}`,
                    'types',
                    types,
                );

            found[type] = true;
            Object.keys(links[type]).forEach((child) => {
                if (!parents[child]) return;

                // Recursively check children
                checkCircular(child, found);
                // Mark all ancestors as having this decendant
                Object.keys(found).forEach((subtype) => {
                    subtypes[subtype][child] = true;
                });
            });
            delete found[type];
        }
        checkCircular(this.primaryType, {});
        // Compute each fully describe type
        for (const name in subtypes) {
            const st = Object.keys(subtypes[name]);
            st.sort();
            this._types[name] =
                encodeType(name, types[name]) +
                st.map((t) => encodeType(t, types[t])).join('');
        }
    }
    getEncoder(type: string) {
        let encoder = this._encoderCache[type];
        if (!encoder)
            encoder = this._encoderCache[type] = this._getEncoder(type);

        return encoder;
    }
    private _getEncoder(type: string) {
        // Basic encoder type (address, bool, uint256, etc)
        {
            const encoder = getBaseEncoder(type);
            if (encoder) return encoder;
        }
        // Array
        const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
        if (match) {
            const subtype = match[1];
            const subEncoder = this.getEncoder(subtype);
            const length = parseInt(match[3]);
            return (value) => {
                if (length >= 0 && value.length !== length)
                    logger.throwArgumentError(
                        'array length mismatch; expected length ${ arrayLength }',
                        'value',
                        value,
                    );

                let result = value.map(subEncoder);
                if (this._types[subtype]) result = result.map(keccak256);

                return keccak256(hexConcat(result));
            };
        }
        // Struct
        const fields = this.types[type];
        if (fields) {
            const encodedType = id(this._types[type]);
            return (value) => {
                const values = fields.map(({name, type}) => {
                    const result = this.getEncoder(type)(value[name]);
                    if (this._types[type]) return keccak256(result);

                    return result;
                });
                values.unshift(encodedType);
                return hexConcat(values);
            };
        }
        return logger.throwArgumentError(`unknown type: ${type}`, 'type', type);
    }
    encodeType(name: string) {
        const result = this._types[name];
        if (!result)
            logger.throwArgumentError(
                `unknown type: ${JSON.stringify(name)}`,
                'name',
                name,
            );

        return result;
    }
    encodeData(type: string, value: unknown) {
        return this.getEncoder(type)(value);
    }
    hashStruct(name: string, value: unknown) {
        return keccak256(this.encodeData(name, value));
    }
    encode(value: unknown) {
        return this.encodeData(this.primaryType, value);
    }
    hash(value: unknown) {
        return this.hashStruct(this.primaryType, value);
    }
    private _visit(
        type: string,
        value: unknown,
        callback: (type: string, value: unknown) => any,
    ): any {
        // Basic encoder type (address, bool, uint256, etc)
        {
            const encoder = getBaseEncoder(type);
            if (encoder) return callback(type, value);
        }
        // Array
        const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
        if (match) {
            const subtype = match[1];
            const length = parseInt(match[3]);
            if (
                !Array.isArray(value) ||
                (length >= 0 && value.length !== length)
            )
                logger.throwArgumentError(
                    'array length mismatch; expected length ${ arrayLength }',
                    'value',
                    value,
                );

            if (Array.isArray(value))
                return value.map((v) => this._visit(subtype, v, callback));
        }
        // Struct
        const fields = this.types[type];
        if (fields)
            return fields.reduce((accum, {name, type}) => {
                accum[name] = this._visit(type, value![name], callback);
                return accum;
            }, {});

        return logger.throwArgumentError(`unknown type: ${type}`, 'type', type);
    }
    visit(value: unknown, callback: (type: string, value: unknown) => any) {
        return this._visit(this.primaryType, value, callback);
    }
    static from(types: Record<string, IField[]>) {
        return new TypedDataEncoder(types);
    }
    static getPrimaryType(types: Record<string, IField[]>) {
        return TypedDataEncoder.from(types).primaryType;
    }
    static hashStruct(
        name: string,
        types: Record<string, IField[]>,
        value: unknown,
    ) {
        return TypedDataEncoder.from(types).hashStruct(name, value);
    }
    static hashDomain(domain: IDomain) {
        const domainFields: IField[] = [];
        for (const name in domain) {
            const type = domainFieldTypes[name];
            if (!type)
                logger.throwArgumentError(
                    `invalid typed-data domain key: ${JSON.stringify(name)}`,
                    'domain',
                    domain,
                );

            domainFields.push({name, type});
        }
        domainFields.sort((a, b) => {
            return (
                domainFieldNames.indexOf(a.name) -
                domainFieldNames.indexOf(b.name)
            );
        });
        return TypedDataEncoder.hashStruct(
            'EIP712Domain',
            {EIP712Domain: domainFields},
            domain,
        );
    }
    static encode(
        domain: IDomain,
        types: Record<string, IField[]>,
        value: unknown,
    ) {
        return hexConcat([
            '0x1901',
            TypedDataEncoder.hashDomain(domain),
            TypedDataEncoder.from(types).hash(value),
        ]);
    }
    static hash(
        domain: IDomain,
        types: Record<string, IField[]>,
        value: unknown,
    ) {
        return keccak256(TypedDataEncoder.encode(domain, types, value));
    }
    static getPayload(
        domain: IDomain,
        types: Record<string, IField[]>,
        value: unknown,
    ) {
        // Validate the domain fields
        TypedDataEncoder.hashDomain(domain);
        // Derive the EIP712Domain Struct reference type
        const domainValues: {[key: string]: any} = {};
        const domainTypes: IField[] = [];
        domainFieldNames.forEach((name) => {
            const value = domain[name];
            if (value == null) return;

            domainValues[name] = domainChecks[name](value);
            domainTypes.push({name, type: domainFieldTypes[name]});
        });
        const encoder = TypedDataEncoder.from(types);
        const typesWithDomain = shallowCopy(types);
        if (typesWithDomain.EIP712Domain)
            logger.throwArgumentError(
                'types must not contain EIP712Domain type',
                'types.EIP712Domain',
                types,
            );
        else typesWithDomain.EIP712Domain = domainTypes;

        // Validate the data structures and types
        encoder.encode(value);
        return {
            types: typesWithDomain,
            domain: domainValues,
            primaryType: encoder.primaryType,
            message: encoder.visit(value, (type, value) => {
                // bytes
                if (type.match(/^bytes(\d*)/))
                    return hexlify(arrayify(value as string));

                // uint or int
                if (type.match(/^u?int/))
                    return BigNumber.from(value).toString();

                switch (type) {
                    case 'trcToken':
                        return BigNumber.from(value).toString();
                    case 'address':
                        return getTronAddress(value as string).toLowerCase();
                    case 'bool':
                        return !!value;
                    case 'string':
                        if (typeof value !== 'string')
                            logger.throwArgumentError(
                                'invalid string',
                                'value',
                                value,
                            );

                        return value;
                }
                return logger.throwArgumentError(
                    'unsupported type',
                    'type',
                    type,
                );
            }),
        };
    }
}
