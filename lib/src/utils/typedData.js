"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedDataEncoder = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const bytes_1 = require("@ethersproject/bytes");
const keccak256_1 = require("@ethersproject/keccak256");
const logger_1 = require("@ethersproject/logger");
const properties_1 = require("@ethersproject/properties");
const strings_1 = require("@ethersproject/strings");
const __1 = __importDefault(require(".."));
const address_1 = require("./address");
const version = 'tronweb/hash/5.4.0';
const logger = new logger_1.Logger(version);
function getAddress(address) {
    return __1.default.address.toHex(address).replace(address_1.ADDRESS_PREFIX_REGEX, '0x');
}
function getTronAddress(address) {
    return __1.default.address.toHex(address);
}
function id(text) {
    return (0, keccak256_1.keccak256)((0, strings_1.toUtf8Bytes)(text));
}
const padding = new Uint8Array(32);
padding.fill(0);
const NegativeOne = bignumber_1.BigNumber.from(-1);
const Zero = bignumber_1.BigNumber.from(0);
const One = bignumber_1.BigNumber.from(1);
const MaxUint256 = bignumber_1.BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
function hexPadRight(value) {
    const bytes = (0, bytes_1.arrayify)(value);
    const padOffset = bytes.length % 32;
    if (padOffset)
        return (0, bytes_1.hexConcat)([bytes, padding.slice(padOffset)]);
    return (0, bytes_1.hexlify)(bytes);
}
const hexTrue = (0, bytes_1.hexZeroPad)(One.toHexString(), 32);
const hexFalse = (0, bytes_1.hexZeroPad)(Zero.toHexString(), 32);
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
function checkString(key) {
    return function (value) {
        if (typeof value !== 'string')
            logger.throwArgumentError(`invalid domain value for ${JSON.stringify(key)}`, `domain.${key}`, value);
        return value;
    };
}
const domainChecks = {
    name: checkString('name'),
    version: checkString('version'),
    chainId: function (value) {
        try {
            return bignumber_1.BigNumber.from(value).toString();
        }
        catch (error) { }
        return logger.throwArgumentError('invalid domain value for "chainId"', 'domain.chainId', value);
    },
    verifyingContract: function (value) {
        try {
            return getTronAddress(value).toLowerCase();
        }
        catch (error) { }
        return logger.throwArgumentError('invalid domain value "verifyingContract"', 'domain.verifyingContract', value);
    },
    salt: function (value) {
        try {
            const bytes = (0, bytes_1.arrayify)(value);
            if (bytes.length !== 32)
                throw new Error('bad length');
            return (0, bytes_1.hexlify)(bytes);
        }
        catch (error) { }
        return logger.throwArgumentError('invalid domain value "salt"', 'domain.salt', value);
    },
};
function getBaseEncoder(type) {
    // intXX and uintXX
    {
        const match = type.match(/^(u?)int(\d*)$/);
        if (match) {
            const signed = match[1] === '';
            const width = parseInt(match[2] || '256');
            if (width % 8 !== 0 ||
                width > 256 ||
                (match[2] && match[2] !== String(width)))
                logger.throwArgumentError('invalid numeric width', 'type', type);
            const boundsUpper = MaxUint256.mask(signed ? width - 1 : width);
            const boundsLower = signed
                ? boundsUpper.add(One).mul(NegativeOne)
                : Zero;
            return function (value) {
                const v = bignumber_1.BigNumber.from(value);
                if (v.lt(boundsLower) || v.gt(boundsUpper))
                    logger.throwArgumentError(`value out-of-bounds for ${type}`, 'value', value);
                return (0, bytes_1.hexZeroPad)(v.toTwos(256).toHexString(), 32);
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
                const bytes = (0, bytes_1.arrayify)(value);
                if (bytes.length !== width)
                    logger.throwArgumentError(`invalid length for ${type}`, 'value', value);
                return hexPadRight(value);
            };
        }
    }
    switch (type) {
        case 'trcToken':
            return getBaseEncoder('uint256');
        case 'address':
            return function (value) {
                return (0, bytes_1.hexZeroPad)(getAddress(value), 32);
            };
        case 'bool':
            return function (value) {
                return !value ? hexFalse : hexTrue;
            };
        case 'bytes':
            return function (value) {
                return (0, keccak256_1.keccak256)(value);
            };
        case 'string':
            return function (value) {
                return id(value);
            };
    }
    return null;
}
function encodeType(name, fields) {
    return `${name}(${fields
        .map(({ name, type }) => type + ' ' + name)
        .join(',')})`;
}
class TypedDataEncoder {
    constructor(types) {
        (0, properties_1.defineReadOnly)(this, 'types', Object.freeze((0, properties_1.deepCopy)(types)));
        (0, properties_1.defineReadOnly)(this, '_encoderCache', {});
        (0, properties_1.defineReadOnly)(this, '_types', {});
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
                    logger.throwArgumentError(`duplicate variable name ${JSON.stringify(field.name)} in ${JSON.stringify(name)}`, 'types', types);
                uniqueNames[field.name] = true;
                // Get the base type (drop any array specifiers)
                const baseType = field.type.match(/^([^\x5b]*)(\x5b|$)/)[1];
                if (baseType === name)
                    logger.throwArgumentError(`circular type reference to ${JSON.stringify(baseType)}`, 'types', types);
                // Is this a base encoding type?
                const encoder = getBaseEncoder(baseType);
                if (encoder)
                    return;
                if (!parents[baseType])
                    logger.throwArgumentError(`unknown type ${JSON.stringify(baseType)}`, 'types', types);
                // Add linkage
                parents[baseType].push(name);
                links[name][baseType] = true;
            });
        }
        // Deduce the primary type
        const primaryTypes = Object.keys(parents).filter((n) => parents[n].length === 0);
        if (primaryTypes.length === 0)
            logger.throwArgumentError('missing primary type', 'types', types);
        else if (primaryTypes.length > 1)
            logger.throwArgumentError(`ambiguous primary types or unused types: ${primaryTypes
                .map((t) => JSON.stringify(t))
                .join(', ')}`, 'types', types);
        (0, properties_1.defineReadOnly)(this, 'primaryType', primaryTypes[0]);
        // Check for circular type references
        function checkCircular(type, found) {
            if (found[type])
                logger.throwArgumentError(`circular type reference to ${JSON.stringify(type)}`, 'types', types);
            found[type] = true;
            Object.keys(links[type]).forEach((child) => {
                if (!parents[child])
                    return;
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
    getEncoder(type) {
        let encoder = this._encoderCache[type];
        if (!encoder)
            encoder = this._encoderCache[type] = this._getEncoder(type);
        return encoder;
    }
    _getEncoder(type) {
        // Basic encoder type (address, bool, uint256, etc)
        {
            const encoder = getBaseEncoder(type);
            if (encoder)
                return encoder;
        }
        // Array
        const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
        if (match) {
            const subtype = match[1];
            const subEncoder = this.getEncoder(subtype);
            const length = parseInt(match[3]);
            return (value) => {
                if (length >= 0 && value.length !== length)
                    logger.throwArgumentError('array length mismatch; expected length ${ arrayLength }', 'value', value);
                let result = value.map(subEncoder);
                if (this._types[subtype])
                    result = result.map(keccak256_1.keccak256);
                return (0, keccak256_1.keccak256)((0, bytes_1.hexConcat)(result));
            };
        }
        // Struct
        const fields = this.types[type];
        if (fields) {
            const encodedType = id(this._types[type]);
            return (value) => {
                const values = fields.map(({ name, type }) => {
                    const result = this.getEncoder(type)(value[name]);
                    if (this._types[type])
                        return (0, keccak256_1.keccak256)(result);
                    return result;
                });
                values.unshift(encodedType);
                return (0, bytes_1.hexConcat)(values);
            };
        }
        return logger.throwArgumentError(`unknown type: ${type}`, 'type', type);
    }
    encodeType(name) {
        const result = this._types[name];
        if (!result)
            logger.throwArgumentError(`unknown type: ${JSON.stringify(name)}`, 'name', name);
        return result;
    }
    encodeData(type, value) {
        return this.getEncoder(type)(value);
    }
    hashStruct(name, value) {
        return (0, keccak256_1.keccak256)(this.encodeData(name, value));
    }
    encode(value) {
        return this.encodeData(this.primaryType, value);
    }
    hash(value) {
        return this.hashStruct(this.primaryType, value);
    }
    _visit(type, value, callback) {
        // Basic encoder type (address, bool, uint256, etc)
        {
            const encoder = getBaseEncoder(type);
            if (encoder)
                return callback(type, value);
        }
        // Array
        const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
        if (match) {
            const subtype = match[1];
            const length = parseInt(match[3]);
            if (!Array.isArray(value) ||
                (length >= 0 && value.length !== length))
                logger.throwArgumentError('array length mismatch; expected length ${ arrayLength }', 'value', value);
            if (Array.isArray(value))
                return value.map((v) => this._visit(subtype, v, callback));
        }
        // Struct
        const fields = this.types[type];
        if (fields)
            return fields.reduce((accum, { name, type }) => {
                accum[name] = this._visit(type, value[name], callback);
                return accum;
            }, {});
        return logger.throwArgumentError(`unknown type: ${type}`, 'type', type);
    }
    visit(value, callback) {
        return this._visit(this.primaryType, value, callback);
    }
    static from(types) {
        return new TypedDataEncoder(types);
    }
    static getPrimaryType(types) {
        return TypedDataEncoder.from(types).primaryType;
    }
    static hashStruct(name, types, value) {
        return TypedDataEncoder.from(types).hashStruct(name, value);
    }
    static hashDomain(domain) {
        const domainFields = [];
        for (const name in domain) {
            const type = domainFieldTypes[name];
            if (!type)
                logger.throwArgumentError(`invalid typed-data domain key: ${JSON.stringify(name)}`, 'domain', domain);
            domainFields.push({ name, type });
        }
        domainFields.sort((a, b) => {
            return (domainFieldNames.indexOf(a.name) -
                domainFieldNames.indexOf(b.name));
        });
        return TypedDataEncoder.hashStruct('EIP712Domain', { EIP712Domain: domainFields }, domain);
    }
    static encode(domain, types, value) {
        return (0, bytes_1.hexConcat)([
            '0x1901',
            TypedDataEncoder.hashDomain(domain),
            TypedDataEncoder.from(types).hash(value),
        ]);
    }
    static hash(domain, types, value) {
        return (0, keccak256_1.keccak256)(TypedDataEncoder.encode(domain, types, value));
    }
    static getPayload(domain, types, value) {
        // Validate the domain fields
        TypedDataEncoder.hashDomain(domain);
        // Derive the EIP712Domain Struct reference type
        const domainValues = {};
        const domainTypes = [];
        domainFieldNames.forEach((name) => {
            const value = domain[name];
            if (value == null)
                return;
            domainValues[name] = domainChecks[name](value);
            domainTypes.push({ name, type: domainFieldTypes[name] });
        });
        const encoder = TypedDataEncoder.from(types);
        const typesWithDomain = (0, properties_1.shallowCopy)(types);
        if (typesWithDomain.EIP712Domain)
            logger.throwArgumentError('types must not contain EIP712Domain type', 'types.EIP712Domain', types);
        else
            typesWithDomain.EIP712Domain = domainTypes;
        // Validate the data structures and types
        encoder.encode(value);
        return {
            types: typesWithDomain,
            domain: domainValues,
            primaryType: encoder.primaryType,
            message: encoder.visit(value, (type, value) => {
                // bytes
                if (type.match(/^bytes(\d*)/))
                    return (0, bytes_1.hexlify)((0, bytes_1.arrayify)(value));
                // uint or int
                if (type.match(/^u?int/))
                    return bignumber_1.BigNumber.from(value).toString();
                switch (type) {
                    case 'trcToken':
                        return bignumber_1.BigNumber.from(value).toString();
                    case 'address':
                        return getTronAddress(value).toLowerCase();
                    case 'bool':
                        return !!value;
                    case 'string':
                        if (typeof value !== 'string')
                            logger.throwArgumentError('invalid string', 'value', value);
                        return value;
                }
                return logger.throwArgumentError('unsupported type', 'type', type);
            }),
        };
    }
}
exports.TypedDataEncoder = TypedDataEncoder;
//# sourceMappingURL=typedData.js.map