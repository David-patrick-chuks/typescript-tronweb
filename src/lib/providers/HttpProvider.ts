import axios from 'axios';
import { AxiosInstance, Method } from 'axios';
import utils from '../../utils';

export class HttpProvider {
    host: string;
    timeout: number;
    user: string | undefined; // FIXME: type
    password: string | undefined;
    headers: Record<string, string>;
    statusPage: string;
    instance: AxiosInstance;

    constructor(
        host: string,
        timeout = 30000,
        user: string | undefined = undefined,
        password: string | undefined = undefined,
        headers: Record<string, string> = {},
        statusPage = '/',
    ) {
        if (!utils.isValidURL(host))
            throw new Error('Invalid URL provided to HttpProvider');

        if (isNaN(timeout) || timeout < 0)
            throw new Error('Invalid timeout duration provided');

        if (!utils.isObject(headers))
            throw new Error('Invalid headers object provided');

        host = host.replace(/\/+$/, '');

        this.host = host;
        this.timeout = timeout;
        this.user = user;
        this.password = password;
        this.headers = headers;
        this.statusPage = statusPage;

        this.instance = axios.create({
            baseURL: host,
            timeout: timeout,
            headers: headers,
            auth:
                user && password
                    ? {
                            // user,
                            // TODO: was it a typo? was `user` before, and axios refuse to accept it
                            username: user,
                            password,
                        }
                    : undefined,
        });
    }

    setStatusPage(statusPage = '/') {
        this.statusPage = statusPage;
    }

    async isConnected(statusPage = this.statusPage) {
        return this.request(statusPage)
            .then((data) => {
                return utils.hasProperties(data, 'blockID', 'block_header');
            })
            .catch(() => false);
    }

    request(url: string, payload = {}, method: Method = 'get') {
        method = method.toLowerCase() as Method; // legacy, non-lowercase should be rejected

        return this.instance
            .request({
                data:
                    method === 'post' && Object.keys(payload).length
                        ? payload
                        : null,
                params: method === 'get' && payload,
                url,
                method,
            })
            .then(({ data }) => data);
    }
}
