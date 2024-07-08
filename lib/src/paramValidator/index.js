"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = __importDefault(require(".."));
const utils_1 = __importDefault(require("../utils"));
function compare(value, opts) {
    const { gt, lt, gte, lte } = opts;
    return !((typeof gt === 'number' && value <= gt) ||
        (typeof lt === 'number' && value >= lt) ||
        (typeof gte === 'number' && value < gte) ||
        (typeof lte === 'number' && value > lte));
}
class Validator {
    constructor(tronWeb) {
        if (!tronWeb || !(tronWeb instanceof __1.default))
            throw new Error('Expected instance of TronWeb');
        this.tronWeb = tronWeb;
    }
    invalid(param) {
        if (!('name' in param))
            return param.msg;
        return (param.msg ||
            `Invalid ${param.name}${param.type === 'address' ? ' address' : ''} provided`);
    }
    notPositive(param) {
        return `${param.name} must be a positive integer`;
    }
    notEqual(param) {
        return (param.msg ||
            `${param.names[0]} can not be equal to ${param.names[1]}`);
    }
    notValid(params = [], callback = new Function()) {
        const normalized = {};
        let no = false;
        for (const param of params) {
            const { value, type, optional } = param;
            if (optional &&
                (!utils_1.default.isNotNullOrUndefined(value) ||
                    (type !== 'boolean' && value === false)))
                continue;
            if ('name' in param)
                normalized[param.name] = value;
            switch (param.type) {
                case 'address':
                    if (!this.tronWeb.isAddress(value))
                        no = true;
                    else
                        normalized[param.name] =
                            this.tronWeb.address.toHex(value);
                    break;
                case 'integer': {
                    if (!utils_1.default.isInteger(value) || !compare(value, param))
                        no = true;
                    break;
                }
                case 'positive-integer':
                    if (!utils_1.default.isInteger(value) || value <= 0) {
                        callback(this.notPositive(param));
                        return;
                    }
                    break;
                case 'tokenId':
                    if (!utils_1.default.isString(value) || !value.length)
                        no = true;
                    break;
                case 'notEmptyObject':
                    if (!utils_1.default.isObject(value) || !Object.keys(value).length)
                        no = true;
                    break;
                case 'notEqual':
                    if (normalized[param.names[0]] ===
                        normalized[param.names[1]]) {
                        callback(this.notEqual(param));
                        return true;
                    }
                    break;
                case 'resource':
                    if (!['BANDWIDTH', 'ENERGY'].includes(value))
                        no = true;
                    break;
                case 'url':
                    if (!utils_1.default.isValidURL(value))
                        no = true;
                    break;
                case 'hex':
                    if (!utils_1.default.isHex(value))
                        no = true;
                    break;
                case 'array':
                    if (!Array.isArray(value))
                        no = true;
                    break;
                case 'not-empty-string':
                    if (!utils_1.default.isString(value) || !value.length)
                        no = true;
                    break;
                case 'boolean':
                    if (!utils_1.default.isBoolean(value))
                        no = true;
                    break;
                case 'string': {
                    if (!utils_1.default.isString(value) || !compare(value.length, param))
                        no = true;
                    break;
                }
                default: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const _exhaustiveCheck = param;
                }
            }
            if (no) {
                callback(this.invalid(param));
                return true;
            }
        }
        return false;
    }
}
exports.default = Validator;
//# sourceMappingURL=index.js.map