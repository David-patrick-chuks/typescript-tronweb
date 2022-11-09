import {assert} from 'chai';
import {FULL_NODE_API} from '../helpers/config';
import assertThrow from '../helpers/assertThrow';
import {default as tronWebBuilder, TronWeb} from '../helpers/tronWebBuilder';

describe('TronWeb.lib.providers', async function () {
    describe('#constructor()', function () {
        it('should create a full instance', function () {
            let provider = new TronWeb.providers.HttpProvider(FULL_NODE_API);
            assert.instanceOf(provider, TronWeb.providers.HttpProvider);

            provider = new TronWeb.providers.HttpProvider('www.exaple.com');
            assert.instanceOf(provider, TronWeb.providers.HttpProvider);
        });

        it('should throw if the host is not valid', function () {
            tronWebBuilder.createInstance();
            assert.throws(
                () => new TronWeb.providers.HttpProvider('$' + FULL_NODE_API),
                'Invalid URL provided to HttpProvider',
            );

            assert.throws(
                () => new TronWeb.providers.HttpProvider('_localhost'),
                'Invalid URL provided to HttpProvider',
            );

            assert.throws(
                // Intentionally invalid
                // @ts-ignore
                () => new TronWeb.providers.HttpProvider([FULL_NODE_API]),
                'Invalid URL provided to HttpProvider',
            );
        });
    });

    describe('#setStatusPage()', function () {
        it('should set a status page', function () {
            const provider = new TronWeb.providers.HttpProvider(FULL_NODE_API);
            const statusPage = '/status';
            provider.setStatusPage(statusPage);
            assert.equal(provider.statusPage, statusPage);
        });
    });

    describe('#isConnected()', function () {
        it('should verify if the provider is connected', async function () {
            const provider = new TronWeb.providers.HttpProvider(FULL_NODE_API);
            assert.isTrue(await provider.isConnected('/wallet/getnowblock'));
        });

        it('should return false if the url is not one of the expected provider', async function () {
            const provider = new TronWeb.providers.HttpProvider(
                'https://google.com',
            );
            assert.isFalse(await provider.isConnected('/wallet/getnowblock'));
        });
    });

    describe('#request()', function () {
        it('should request a route', async function () {
            const provider = new TronWeb.providers.HttpProvider(FULL_NODE_API);
            const result = await provider.request('/wallet/getnowblock');
            assert.equal(result.blockID.length, 64);
        });

        it('should throw if the route is missed or returns an error', async function () {
            const provider = new TronWeb.providers.HttpProvider(FULL_NODE_API);

            await assertThrow(
                provider.request('/wallet/some-fun'),
                'Request failed with status code 404',
            );
        });
    });
});
