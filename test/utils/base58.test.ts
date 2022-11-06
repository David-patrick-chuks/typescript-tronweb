export {};
import {assert} from 'chai';
import {createInstance} from '../helpers/tronWebBuilder';

describe('TronWeb.utils.base58', function () {
    describe('#encode58()', function () {
        const tronWeb = createInstance();

        it('should encode a buffer in base58 string', async function () {
            const input = Buffer.from('0xbf7e698', 'utf-8');
            const expected = 'cnTsZgYWJRAw';

            assert.equal(tronWeb.utils.base58.encode58(input), expected);
        });

        it('should encode a UInt8Array in base58 string', async function () {
            const input = new Uint8Array([30, 78, 62, 66, 37, 65, 36, 39, 38]);
            const expected = 'PNfgHhpd9fqF';

            assert.equal(tronWeb.utils.base58.encode58(input), expected);
        });

        it('should encode a hex string in base58 string', async function () {
            let input = '0xbf7e698';
            let expected = 'BLw3T83';

            assert.equal(tronWeb.utils.base58.encode58(input), expected);

            input = '12354345';
            expected = '3toVqjxtiu2q';

            assert.equal(tronWeb.utils.base58.encode58(input), expected);
        });

        it("should return '' or '1' if passing something different from a buffer", async function () {
            // TODO. Is this what we want?
            assert.equal(tronWeb.utils.base58.encode58('some string'), '');
            assert.equal(tronWeb.utils.base58.encode58(new Uint8Array()), '');
            // Test passes, but it's similar to [1] == true - just fuck and burn it
            // @ts-ignore
            assert.equal(tronWeb.utils.base58.encode58({key: 1}), '1');
        });
    });

    describe('#decode58()', function () {
        it('should decode a base58 string in a buffer', async function () {
            const tronWeb = createInstance();

            const input = 'cnTsZgYWJRAw';
            const expected = Buffer.from('0xbf7e698', 'utf-8');

            const decoded = tronWeb.utils.base58.decode58(input);

            assert.equal(
                // Encoding removed by me
                Buffer.compare(expected, Buffer.from(decoded)),
                0,
            );
        });

        it("should return [] or [0] if passing something '' or '1'", async function () {
            // TODO. As above. Is this what we want?
            const tronWeb = createInstance();

            assert.equal(
                JSON.stringify(tronWeb.utils.base58.decode58('')),
                '[]',
            );
            assert.equal(
                JSON.stringify(tronWeb.utils.base58.decode58('1')),
                '[0]',
            );
        });
    });
});
