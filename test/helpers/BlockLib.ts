import {IBlockExtention} from '../../src/lib/trx';
import {WithTronwebAndInjectpromise} from '../../src/utils/_base';
import _CallbackT from '../../src/utils/typing';

export default class BlockLib extends WithTronwebAndInjectpromise {
    async getCurrent(callback?: undefined): Promise<IBlockExtention>;
    async getCurrent(callback: _CallbackT<IBlockExtention>): Promise<void>;
    async getCurrent(
        callback?: _CallbackT<IBlockExtention>,
    ): Promise<void | IBlockExtention> {
        if (!callback) return this.injectPromise(this.getCurrent);

        this.tronWeb.fullNode
            .request('wallet/getnowblock')
            .then((block) => {
                (block as any).fromPlugin = true;
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
