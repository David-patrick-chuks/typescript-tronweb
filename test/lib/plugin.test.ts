import {assert} from 'chai';
import {default as tronWebBuilder, TronWeb} from '../helpers/tronWebBuilder';
import GetNowBlock from '../helpers/GetNowBlock';
import BlockLib from '../helpers/BlockLib';

describe('TronWeb.lib.plugin', async function () {
    let tronWeb: TronWeb;

    before(async function () {
        tronWeb = tronWebBuilder.createInstance();
    });

    describe('#constructor()', function () {
        it('should have been set a full instance in tronWeb', function () {
            assert.instanceOf(tronWeb.plugin, TronWeb.Plugin);
        });
    });

    describe('#plug GetNowBlock into tronWeb.trx', async function () {
        it('should register the plugin GetNowBlock', async function () {
            const someParameter = 'someValue';

            const result = tronWeb.plugin.register(GetNowBlock, {
                someParameter,
            });
            assert.isTrue(result.skipped.includes('_parseToken'));
            assert.isTrue(result.plugged.includes('getCurrentBlock'));
            assert.isTrue(result.plugged.includes('getLatestBlock'));

            const block1 = await tronWeb.trx.getCurrentBlock();
            // @ts-ignore
            assert.isTrue(block1.fromPlugin); // Added by plugin
            assert.equal(block1.blockID.length, 64);
            assert.isTrue(/^00000/.test(block1.blockID));

            // @ts-ignore
            const p = await tronWeb.trx.getSomeParameter(); // Added by plugin
            assert.equal(p, someParameter);
        });
    });

    describe('#plug BlockLib into tronWeb at first level', async function () {
        it('should register the plugin and call a method using a promise', async function () {
            const result = tronWeb.plugin.register(BlockLib);
            assert.equal(result.libs[0], 'BlockLib');

            // @ts-ignore
            const block = await tronWeb.blockLib.getCurrent(); // Added by plugin
            assert.isTrue(block.fromPlugin); // Added by plugin
            assert.equal(block.blockID.length, 64);
            assert.isTrue(/^00000/.test(block.blockID));
        });

        it('should register and call a method using callbacks', async function () {
            tronWeb.plugin.register(BlockLib);
            return new Promise((resolve) => {
                // @ts-ignore
                tronWeb.blockLib.getCurrent((err, result) => {
                    // Added by plugin
                    assert.isTrue(result.fromPlugin);
                    assert.equal(result.blockID.length, 64);
                    assert.isTrue(/^00000/.test(result.blockID));
                    resolve();
                });
            });
        });

        it('should not register if tronWeb is instantiated with the disablePlugins option', async function () {
            const tronWeb2 = tronWebBuilder.createInstance({
                disablePlugins: true,
            });
            const result = tronWeb2.plugin.register(BlockLib);
            assert.isTrue(typeof result.error === 'string');
        });
    });
});
