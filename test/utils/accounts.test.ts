import {assert} from 'chai';

import assertThrow from '../helpers/assertThrow';
import {createInstance} from '../helpers/tronWebBuilder';

describe('TronWeb.utils.accounts', function () {
    const INVALID_PATH_MSG = 'Invalid tron path provided';
    describe('#generateAccount()', function () {
        it('should generate a new account', async function () {
            const tronWeb = createInstance();

            const newAccount = await tronWeb.utils.accounts.generateAccount();
            assert.equal(newAccount.privateKey.length, 64);
            assert.equal(newAccount.publicKey.length, 130);
            const address = tronWeb.address.fromPrivateKey(
                newAccount.privateKey,
            );
            assert.equal(address, newAccount.address.base58);

            assert.equal(
                tronWeb.address.toHex(address),
                newAccount.address.hex.toLowerCase(),
            );
        });
    });

    describe('#generateRandom()', function () {
        describe('should generate a mnemonic phrase and an account', function () {
            it('should generate an account of the zero index when options param is not passed', async function () {
                const tronWeb = createInstance();

                const newAccount =
                    await tronWeb.utils.accounts.generateRandom();
                assert.equal(newAccount.privateKey.substring(2).length, 64);
                assert.equal(newAccount.publicKey.substring(2).length, 130);
                assert.isTrue(
                    tronWeb.utils.ethersUtils.isValidMnemonic(
                        newAccount.mnemonic.phrase,
                    ),
                );
                const address = tronWeb.address.fromPrivateKey(
                    newAccount.privateKey.replace(/^0x/, ''),
                );
                assert.equal(address, newAccount.address);
                assert.equal(
                    tronWeb.address.toHex(address),
                    tronWeb.address.toHex(newAccount.address),
                );
            });

            it('should generate an account when options param is zero', async function () {
                const tronWeb = createInstance();
                const options = 0;
                const newAccount = await tronWeb.utils.accounts.generateRandom(
                    // FIXME: are these some traces of removed API?
                    // Non-objects are treated as {}
                    // @ts-ignore
                    options,
                );
                assert.equal(newAccount.privateKey.substring(2).length, 64);
                assert.equal(newAccount.publicKey.substring(2).length, 130);
                assert.isTrue(
                    tronWeb.utils.ethersUtils.isValidMnemonic(
                        newAccount.mnemonic.phrase,
                    ),
                );
                const address = tronWeb.address.fromPrivateKey(
                    newAccount.privateKey.replace(/^0x/, ''),
                );
                assert.equal(address, newAccount.address);
                assert.equal(
                    tronWeb.address.toHex(address),
                    tronWeb.address.toHex(newAccount.address),
                );
            });

            it('should generate an account when options param is a positive interger', async function () {
                const tronWeb = createInstance();
                const options = 12;
                const newAccount = await tronWeb.utils.accounts.generateRandom(
                    // FIXME: are these some traces of removed API?
                    // Non-objects are treated as {}
                    // @ts-ignore
                    options,
                );
                assert.equal(newAccount.privateKey.substring(2).length, 64);
                assert.equal(newAccount.publicKey.substring(2).length, 130);
                assert.isTrue(
                    tronWeb.utils.ethersUtils.isValidMnemonic(
                        newAccount.mnemonic.phrase,
                    ),
                );
                const address = tronWeb.address.fromPrivateKey(
                    newAccount.privateKey.replace(/^0x/, ''),
                );
                assert.equal(address, newAccount.address);
                assert.equal(
                    tronWeb.address.toHex(address),
                    tronWeb.address.toHex(newAccount.address),
                );
            });

            it('should generate an account when options param is an empty object', async function () {
                const tronWeb = createInstance();
                const options = {};
                const newAccount = await tronWeb.utils.accounts.generateRandom(
                    options,
                );
                assert.equal(newAccount.privateKey.substring(2).length, 64);
                assert.equal(newAccount.publicKey.substring(2).length, 130);
                assert.isTrue(
                    tronWeb.utils.ethersUtils.isValidMnemonic(
                        newAccount.mnemonic.phrase,
                    ),
                );
                const address = tronWeb.address.fromPrivateKey(
                    newAccount.privateKey.replace(/^0x/, ''),
                );
                assert.equal(address, newAccount.address);
                assert.equal(
                    tronWeb.address.toHex(address),
                    tronWeb.address.toHex(newAccount.address),
                );
            });

            it('should generate an account of the given path when options param has a valid bip39 tron path', async function () {
                const tronWeb = createInstance();
                const options = {path: "m/44'/195'/0'/0/0"};
                const newAccount = await tronWeb.utils.accounts.generateRandom(
                    options,
                );
                assert.equal(newAccount.privateKey.substring(2).length, 64);
                assert.equal(newAccount.publicKey.substring(2).length, 130);
                assert.isTrue(
                    tronWeb.utils.ethersUtils.isValidMnemonic(
                        newAccount.mnemonic.phrase,
                    ),
                );
                const address = tronWeb.address.fromPrivateKey(
                    newAccount.privateKey.replace(/^0x/, ''),
                );
                assert.equal(address, newAccount.address);
                assert.equal(
                    tronWeb.address.toHex(address),
                    tronWeb.address.toHex(newAccount.address),
                );
            });

            it('should throw when options param has a bip39 path of an another chain', async function () {
                const tronWeb = createInstance();
                const options = {path: "m/44'/60'/0'/0/0"};

                await assertThrow(
                    () => tronWeb.utils.accounts.generateRandom(options),
                    INVALID_PATH_MSG,
                );
            });

            it('should throw when options param has an invalid bip39 path', async function () {
                const tronWeb = createInstance();
                const options = {path: 12};

                await assertThrow(
                    // Intentionally invalid
                    // @ts-ignore
                    () => tronWeb.utils.accounts.generateRandom(options),
                    INVALID_PATH_MSG,
                );
            });
        });
    });

    describe('#generateAccountWithMnemonic()', function () {
        describe('should generate an account of the given mnemonic phrase', function () {
            it('should generate an account when passed a normal mnemonic pharase', async function () {
                const tronWeb = createInstance();

                const accountCreated =
                    await tronWeb.utils.accounts.generateRandom();

                const newAccount =
                    await tronWeb.utils.accounts.generateAccountWithMnemonic(
                        accountCreated.mnemonic.phrase,
                    );
                assert.equal(newAccount.privateKey.substring(2).length, 64);
                assert.equal(newAccount.publicKey.substring(2).length, 130);
                const address = tronWeb.address.fromPrivateKey(
                    newAccount.privateKey.replace(/^0x/, ''),
                );
                assert.equal(address, newAccount.address);
                assert.equal(
                    tronWeb.address.toHex(address),
                    tronWeb.address.toHex(newAccount.address),
                );
            });

            it('should generate an account when path is passed', async function () {
                const tronWeb = createInstance();

                const accountCreated =
                    await tronWeb.utils.accounts.generateRandom();

                const path = "m/44'/195'/0'/0/1";

                const newAccount =
                    await tronWeb.utils.accounts.generateAccountWithMnemonic(
                        accountCreated.mnemonic.phrase,
                        path,
                    );
                assert.equal(newAccount.privateKey.substring(2).length, 64);
                assert.equal(newAccount.publicKey.substring(2).length, 130);
                const address = tronWeb.address.fromPrivateKey(
                    newAccount.privateKey.replace(/^0x/, ''),
                );
                assert.equal(address, newAccount.address);
                assert.equal(
                    tronWeb.address.toHex(address),
                    tronWeb.address.toHex(newAccount.address),
                );
            });

            it('should throw when path is an invalid bip39 pth', async function () {
                const tronWeb = createInstance();

                const accountCreated =
                    await tronWeb.utils.accounts.generateRandom();

                const path = 11;

                await assertThrow(
                    () =>
                        tronWeb.utils.accounts.generateAccountWithMnemonic(
                            accountCreated.mnemonic.phrase,
                            // Intentionally invalid
                            // @ts-ignore
                            path,
                        ),
                    INVALID_PATH_MSG,
                );
            });

            it('should generate an account when path is an invalid bip39 tron path', async function () {
                const tronWeb = createInstance();

                const accountCreated =
                    await tronWeb.utils.accounts.generateRandom();

                const path = "m/44'/60'/0'/0/1";

                await assertThrow(
                    () =>
                        tronWeb.utils.accounts.generateAccountWithMnemonic(
                            accountCreated.mnemonic.phrase,
                            path,
                        ),
                    INVALID_PATH_MSG,
                );
            });
        });
    });
});
