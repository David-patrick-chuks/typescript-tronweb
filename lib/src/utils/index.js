"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const validator_1 = __importDefault(require("validator"));
const abi = __importStar(require("./abi"));
const accounts = __importStar(require("./accounts"));
const address_1 = require("./address");
const base58 = __importStar(require("./base58"));
const bytes = __importStar(require("./bytes"));
const code = __importStar(require("./code"));
const crypto = __importStar(require("./crypto"));
const ethersUtils = __importStar(require("./ethersUtils"));
const message = __importStar(require("./message"));
const typedData_1 = require("./typedData");
const utils = {
    isValidURL(url) {
        if (typeof url !== 'string')
            return false;
        return validator_1.default.isURL(url.toString(), {
            protocols: ['http', 'https'],
            require_tld: false,
        });
    },
    isObject(obj) {
        return (obj === Object(obj) &&
            Object.prototype.toString.call(obj) !== '[object Array]');
    },
    isArray(array) {
        return Array.isArray(array);
    },
    isJson(string) {
        try {
            return !!JSON.parse(string);
        }
        catch (ex) {
            return false;
        }
    },
    isBoolean(bool) {
        return typeof bool === 'boolean';
    },
    isBigNumber(number) {
        return (number &&
            (number instanceof bignumber_js_1.default ||
                (number.constructor && number.constructor.name === 'BigNumber')));
    },
    isString(string) {
        return (typeof string === 'string' ||
            (string &&
                string.constructor &&
                string.constructor.name === 'String'));
    },
    // eslint-disable-next-line @typescript-eslint/ban-types
    isFunction(obj) {
        return typeof obj === 'function';
    },
    isHex(string) {
        return (typeof string === 'string' &&
            !isNaN(parseInt(string, 16)) &&
            /^(0x|)[a-fA-F0-9]+$/.test(string));
    },
    isInteger(number) {
        if (number === null)
            return false;
        return Number.isInteger(Number(number));
    },
    hasProperty(obj, property) {
        return Object.prototype.hasOwnProperty.call(obj, property);
    },
    hasProperties(obj, ...properties) {
        return (!!properties.length &&
            !properties
                .map((property) => {
                return this.hasProperty(obj, property);
            })
                .includes(false));
    },
    mapEvent(event) {
        const data = {
            block: event.block_number,
            timestamp: event.block_timestamp,
            contract: event.contract_address,
            name: event.event_name,
            transaction: event.transaction_id,
            result: event.result,
            resourceNode: event.resource_Node ||
                (event._unconfirmed ? 'fullNode' : 'solidityNode'),
        };
        if (event._unconfirmed)
            data.unconfirmed = event._unconfirmed;
        if (event._fingerprint)
            data.fingerprint = event._fingerprint;
        return data;
    },
    parseEvent(event, { inputs: abi }) {
        if (!event.result)
            return event;
        if (this.isArray(event.result))
            event.result = event.result.reduce((obj, result, index) => {
                const { name, type } = abi[index];
                if (type === 'address')
                    result =
                        address_1.ADDRESS_PREFIX +
                            result.substr(2).toLowerCase();
                obj[name] = result;
                return obj;
            }, {});
        else if (this.isObject(event.result))
            for (let i = 0; i < abi.length; i++) {
                const obj = abi[i];
                if (obj.type === 'address' && obj.name in event.result)
                    event.result[obj.name] =
                        address_1.ADDRESS_PREFIX +
                            event.result[obj.name]
                                .substr(2)
                                .toLowerCase();
            }
        return event;
    },
    padLeft(input, padding, amount) {
        let res = input.toString();
        while (res.length < amount)
            res = padding + res;
        return res;
    },
    isNotNullOrUndefined(val) {
        return val !== null && typeof val !== 'undefined';
    },
    sleep(millis = 1000) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => setTimeout(resolve, millis));
        });
    },
};
exports.default = Object.assign(Object.assign({}, utils), { code,
    accounts,
    base58,
    bytes,
    crypto,
    abi,
    message,
    _TypedDataEncoder: typedData_1.TypedDataEncoder,
    ethersUtils });
//# sourceMappingURL=index.js.map