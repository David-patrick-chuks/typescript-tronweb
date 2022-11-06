export {};

// type-only, so can safely import from actual .ts
import {IBlock} from '../../src/lib/trx';
import _CallbackT from '../../src/utils/typing';
import {WithTronwebAndInjectpromise} from '../../src/utils/_base';

export default class BlockLib extends WithTronwebAndInjectpromise {
    async getCurrent(callback?: undefined): Promise<IBlock>;
    async getCurrent(callback: _CallbackT<IBlock>): Promise<void>;
    async getCurrent(callback?: _CallbackT<IBlock>): Promise<void | IBlock> {
        if (!callback) return this.injectPromise(this.getCurrent);

        this.tronWeb.fullNode
            .request('wallet/getnowblock')
            .then((block) => {
                block.fromPlugin = true;
                callback(null, block);
            })
            .catch((err) => callback(err));
    }

    pluginInterface() {
        return {
            requires: '^4.0.0',
            fullClass: true,
        };
    }
}
