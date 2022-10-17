import TronWeb from '..';
import utils from '../utils';
import providers from "./providers";
import querystring from "querystring";
import injectpromise from 'injectpromise';


interface ContractOptions {
    sinceTimestamp?: number
    since?: any
    fromTimestamp?: number
    eventName?: string
    blockNumber?: number
    size?: number
    page?: number
    onlyConfirmed?: any
    onlyUnconfirmed?: any
    previousLastEventFingerprint?: any
    previousFingerprint?: any
    fingerprint?: any
    rawResponse?: boolean
    sort?: boolean
    filters?: Object | Object[]
}

type _CallbackT<Out> = (err: string | null, data?: Object[]) => Out;

export default class Event {
    tronWeb: TronWeb;
    injectPromise: injectpromise;

    constructor(tronWeb: TronWeb) {
        if (!tronWeb || !(tronWeb instanceof TronWeb))
            throw new Error('Expected instance of TronWeb');
        this.tronWeb = tronWeb;
        this.injectPromise = injectpromise(this);
    }

    setServer(eventServer: string | providers.HttpProvider, healthcheck: string = 'healthcheck'): void {
        if (!eventServer)
            return this.tronWeb.eventServer = false;

        if (utils.isString(eventServer))
            eventServer = new providers.HttpProvider(eventServer);

        if (!this.tronWeb.isValidProvider(eventServer))
            throw new Error('Invalid event server provided');

        this.tronWeb.eventServer = eventServer;
        this.tronWeb.eventServer.isConnected = () => this.tronWeb.eventServer.request(healthcheck).then(() => true).catch(() => false);
    }

    getEventsByContractAddress(contractAddress: string, options: ContractOptions): Promise<any>;
    getEventsByContractAddress<Out>(contractAddress: string, options: ContractOptions, callback?: _CallbackT<Out>): Promise<Out>;
    getEventsByContractAddress<Out>(contractAddress: string, options: ContractOptions = {}, callback?: _CallbackT<Out>): Out | Promise<Out | any> {

        let {
            sinceTimestamp,
            since,
            fromTimestamp,
            eventName,
            blockNumber,
            size,
            page,
            onlyConfirmed,
            onlyUnconfirmed,
            previousLastEventFingerprint,
            previousFingerprint,
            fingerprint,
            rawResponse,
            sort,
            filters
        } = Object.assign({
            sinceTimestamp: 0,
            eventName: false,
            blockNumber: false,
            size: 20,
            page: 1
        }, options) as ContractOptions

        if (!callback)
            return this.injectPromise(this.getEventsByContractAddress, contractAddress, options);

        fromTimestamp = fromTimestamp || sinceTimestamp || since;

        if (!this.tronWeb.eventServer)
            return callback('No event server configured');

        const routeParams = [];

        if (!this.tronWeb.isAddress(contractAddress))
            return callback('Invalid contract address provided');

        if (eventName && !contractAddress)
            return callback('Usage of event name filtering requires a contract address');

        if (typeof fromTimestamp !== 'undefined' && !utils.isInteger(fromTimestamp))
            return callback('Invalid fromTimestamp provided');

        if (!utils.isInteger(size))
            return callback('Invalid size provided');

        if (size > 200) {
            console.warn('Defaulting to maximum accepted size: 200');
            size = 200;
        }

        if (!utils.isInteger(page))
            return callback('Invalid page provided');

        if (blockNumber && !eventName)
            return callback('Usage of block number filtering requires an event name');

        if (contractAddress)
            routeParams.push(this.tronWeb.address.fromHex(contractAddress));

        if (eventName)
            routeParams.push(eventName);

        if (blockNumber)
            routeParams.push(blockNumber);

        const qs: any = {
            size,
            page
        }

        if (typeof filters === 'object' && Object.keys(filters).length > 0)
            qs.filters = JSON.stringify(filters);

        if (fromTimestamp)
            qs.fromTimestamp = qs.since = fromTimestamp;

        if (onlyConfirmed)
            qs.only_confirmed = onlyConfirmed

        if (onlyUnconfirmed && !onlyConfirmed)
            qs.only_unconfirmed = onlyUnconfirmed

        if (sort)
            qs.sort = sort

        fingerprint = fingerprint || previousFingerprint || previousLastEventFingerprint
        if (fingerprint)
            qs.fingerprint = fingerprint

        return this.tronWeb.eventServer.request(`event/contract/${routeParams.join('/')}?${querystring.stringify(qs)}`).then((data: any) => {
            if (!data)
                return callback('Unknown error occurred');

            if (!utils.isArray(data))
                return callback(data);

            return callback(
                null,
                rawResponse === true ? data : (data as Array<any>).map(event => utils.mapEvent(event))
            );
        }).catch((err: any) => callback((err.response && err.response.data) || err));
    }


    getEventsByTransactionID(transactionID: string, options: {rawResponse?: boolean}): Promise<any>;
    getEventsByTransactionID<Out>(transactionID: string, options: {rawResponse?: boolean}, callback?: _CallbackT<Out>): Out | Promise<Out>;
    getEventsByTransactionID<Out>(transactionID: string, options: {rawResponse?: boolean} | _CallbackT<Out> = {}, callback?: _CallbackT<Out>): Out | Promise<Out | any> {
        if (utils.isFunction(options)) {
            callback = options;
            options = {};
        }
        const actualOptions = options as {rawResponse?: boolean};

        if (!callback || !utils.isFunction(callback))
            return this.injectPromise(this.getEventsByTransactionID, transactionID, actualOptions);

        if (!this.tronWeb.eventServer)
            return callback('No event server configured');

        return this.tronWeb.eventServer.request(`event/transaction/${transactionID}`).then((data: any) => {
            if (!callback)
                return null

            if (!data)
                return callback('Unknown error occurred');

            if (!utils.isArray(data))
                return callback(data);

            return callback(
                null,
                actualOptions.rawResponse === true ? data : (data as Array<any>).map(event => utils.mapEvent(event))
            );
        }).catch((err: any) => callback && callback((err.response && err.response.data) || err));
    }
}
