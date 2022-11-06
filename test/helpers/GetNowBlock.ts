let someParameter;
import {WithTronwebAndInjectpromise} from '../../src/utils/_base';

export default class GetNowBlock extends WithTronwebAndInjectpromise {
    async someMethod(callback) {
        // FIXME: should it be this.someMethod?
        // @ts-ignore
        if (!callback) return this.injectPromise(this.getCurrentBlock);

        this.tronWeb.fullNode
            .request('wallet/getnowblock')
            .then((block) => {
                block.fromPlugin = true;
                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    getSomeParameter() {
        return someParameter;
    }

    pluginInterface(options) {
        if (options.someParameter) someParameter = options.someParameter;

        return {
            requires: '^4.0.0',
            components: {
                trx: {
                    // will be overridden
                    getCurrentBlock: this.someMethod,

                    // will be added
                    getLatestBlock: this.someMethod,
                    getSomeParameter: this.getSomeParameter,

                    // will be skipped
                    // eslint-disable-next-line
                    _parseToken: function () {},
                },
            },
        };
    }
}
