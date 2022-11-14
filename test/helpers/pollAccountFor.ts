import _ from 'lodash';

import {createInstance} from './tronWebBuilder';
import wait from './wait';

export default async function pollAccountFor(
    address,
    property,
    value = false,
    interval = 3,
    timeout = 10000,
) {
    const tronWeb = createInstance();
    const now = Date.now();
    while (true) {
        if (Date.now() > now + timeout) throw new Error('Timeout...');

        await wait(interval);
        const result = await tronWeb.trx.getAccount(address);
        if (typeof property === 'string') {
            const data = _.get(result, property);
            if (data)
                if (value) {
                    // Not sure what arg types are allowed
                    // eslint-disable-next-line eqeqeq
                    if (data == value) return Promise.resolve(result);
                } else {
                    return Promise.resolve(result);
                }
        } else if (typeof property === 'function' && property(result)) {
            return Promise.resolve(result);
        }
    }
}
