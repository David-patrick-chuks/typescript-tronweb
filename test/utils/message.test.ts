import {assert} from 'chai';
import {TronWeb} from '../helpers/tronWebBuilder';

import tests from '../testcases/src/sign-message';

describe('TronWeb.utils.message', function () {
    describe('#hashMessage()', function () {
        tests.forEach(function (test) {
            it('hashes a message "' + test.name + '"', function () {
                const hash = TronWeb.utils.message.hashMessage(test.message);
                assert.equal(hash, test.messageHash, 'calculates message hash');
            });
        });
    });

    describe('#signMessage()', function () {
        tests.forEach(function (test) {
            it('signs a message "' + test.name + '"', function () {
                const signature = TronWeb.utils.message.signMessage(
                    test.message,
                    test.privateKey,
                );
                assert.equal(
                    signature,
                    test.signature,
                    'computes message signature',
                );
            });
        });
    });

    describe('#verifyMessage()', function () {
        tests.forEach(function (test) {
            it('verify a message "' + test.name + '"', function () {
                const address = TronWeb.utils.message.verifyMessage(
                    test.message,
                    test.signature,
                );
                assert.equal(
                    address,
                    test.address,
                    'verifies message signature',
                );
            });
        });
    });
});
