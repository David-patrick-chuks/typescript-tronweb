"use strict";
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
exports.HttpProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = __importDefault(require("../../utils"));
const serviceToUrl_1 = require("./serviceToUrl");
class HttpProvider {
    constructor(host, timeout = 30000, user = undefined, password = undefined, headers = {}, statusPage = '/') {
        if (!utils_1.default.isValidURL(host))
            throw new Error('Invalid URL provided to HttpProvider');
        if (isNaN(timeout) || timeout < 0)
            throw new Error('Invalid timeout duration provided');
        if (!utils_1.default.isObject(headers))
            throw new Error('Invalid headers object provided');
        host = host.replace(/\/+$/, '');
        this.host = host;
        this.timeout = timeout;
        this.user = user;
        this.password = password;
        this.headers = headers;
        this.statusPage = statusPage;
        this.instance = axios_1.default.create({
            baseURL: host,
            timeout: timeout,
            headers: headers,
            // TODO: was it a typo? was `user` before, and axios refuse to accept it
            auth: user && password
                ? {
                    // user,
                    username: user,
                    password,
                }
                : undefined,
        });
    }
    setStatusPage(statusPage = '/') {
        this.statusPage = statusPage;
    }
    isConnected(statusPage = this.statusPage) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(statusPage)
                .then((data) => {
                return utils_1.default.hasProperties(data, 'blockID', 'block_header');
            })
                .catch(() => false);
        });
    }
    request(serviceName, payload = {}, method = 'get') {
        method = method.toLowerCase();
        console.log(method === 'post' && Object.keys(payload).length
            ? payload
            : null);
        return this.instance
            .request({
            data: method === 'post' && Object.keys(payload).length
                ? payload
                : null,
            params: method === 'get' && payload,
            url: (0, serviceToUrl_1.serviceToUrl)(serviceName),
            method,
        })
            .then(({ data }) => data);
    }
}
exports.HttpProvider = HttpProvider;
//# sourceMappingURL=HttpProvider.js.map