import TronWeb from '../../src';
import injectpromise from 'injectpromise';

export class WithTronwebAndInjectpromise {
    tronWeb: TronWeb;
    injectPromise: injectpromise;

    constructor(tronWeb: TronWeb) {
        if (!tronWeb)
            throw new Error('Expected instances of TronWeb and utils');
        this.tronWeb = tronWeb;
        this.injectPromise = injectpromise(this);
    }
}
