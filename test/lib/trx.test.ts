import {assert} from 'chai';

import {
    ISignedTransaction,
    ITransaction,
} from '../../src/lib/transactionBuilder';
import {IExchange, IProposal, IToken} from '../../src/lib/trx';
import {testRevert as testRevertContract} from '../fixtures/contracts';
import assertThrow from '../helpers/assertThrow';
import broadcaster from '../helpers/broadcaster';
import {
    ADDRESS_BASE58,
    FULL_NODE_API,
    PRIVATE_KEY,
    SIGNED_HEX_TRANSACTION,
    getTokenOptions,
} from '../helpers/config';
import {
    IAccts,
    TronWeb,
    default as tronWebBuilder,
} from '../helpers/tronWebBuilder';
import wait from '../helpers/wait';
import waitChainData from '../helpers/waitChainData';

describe('TronWeb.trx', function () {
    this.retries(2); // We'll fail sometimes anyway - even with docker node

    const INVALID_ADDRESS_MSG = 'Invalid address provided';
    const NO_PERM_MSG = 'has no permission to sign';
    const BLOCK_NOT_FOUND_MSG = 'Block not found';
    const INVALID_TOKEN_ID_MSG = 'Invalid token ID provided';
    const INVALID_RECIPIENT_MSG = 'Invalid recipient provided';
    const INVALID_AMOUNT_MSG = 'Invalid amount provided';
    const TX_NOT_FOUND_MSG = 'Transaction not found';

    let accounts: IAccts;
    let tronWeb: TronWeb;

    before(async function () {
        tronWeb = tronWebBuilder.createInstance();
        // ALERT this works only with Tron Quickstart:
        accounts = await tronWebBuilder.getTestAccounts(-1);
        await TronWeb.createAccount();
    });

    // Constructor Test
    describe('#constructor()', function () {
        it('should have been set a full instance in tronWeb', function () {
            assert.instanceOf(tronWeb.trx, TronWeb.Trx);
        });
    });

    // Account Test
    describe('#Account Test', function () {
        describe('#getAccount', async function () {
            const idx = 10;

            it('should get account by hex or base58 address', async function () {
                const addressType = ['hex', 'b58'];
                let account;
                for (const type of addressType) {
                    account = await tronWeb.trx.getAccount(accounts[type][idx]);
                    assert.equal(account.address, accounts.hex[idx]);
                }
            });

            it('getAccount() should throw address is not valid error', async function () {
                await assertThrow(
                    tronWeb.trx.getAccount('notAnAddress'),
                    INVALID_ADDRESS_MSG,
                );
            });
        });

        describe('#getAccountById', async function () {
            const idx = 11;
            let accountId: string;

            before(async function () {
                this.timeout(10000);
                accountId = TronWeb.toHex(
                    `testtest${Math.ceil(Math.random() * 100)}`,
                );
                const transaction =
                    await tronWeb.transactionBuilder.setAccountId(
                        accountId,
                        accounts.hex[idx],
                    );
                await broadcaster(null, accounts.pks[idx], transaction);
            });

            it('should get confirmed account by id', async function () {
                this.timeout(20000);
                while (true) {
                    const account = await tronWeb.trx.getAccountById(accountId);
                    if (Object.keys(account).length === 0) {
                        await wait(3);
                    } else {
                        assert.equal(account.account_id, accountId.slice(2));
                        break;
                    }
                }
            });

            it('should throw accountId is not valid error', async function () {
                const ids = [
                    '',
                    '12',
                    '616161616262626231313131313131313131313131313131313131313131313131313131313131',
                ];
                for (const id of ids)
                    await assertThrow(
                        tronWeb.trx.getAccountById(id),
                        'Invalid accountId provided',
                    );
            });
        });

        describe('#getAccountResources', async function () {
            const idx = 10;

            it('should get account resource by hex or base58 address', async function () {
                const addressType = ['hex', 'b58'];
                let accountResource;
                for (const type of addressType) {
                    accountResource = await tronWeb.trx.getAccountResources(
                        accounts[type][idx],
                    );
                    assert.isDefined(accountResource.freeNetLimit);
                    assert.isDefined(accountResource.TotalEnergyLimit);
                }
            });

            it('should throw address is not valid error', async function () {
                await assertThrow(
                    tronWeb.trx.getAccountResources('notAnAddress'),
                    INVALID_ADDRESS_MSG,
                );
            });
        });

        describe('#getBalance', async function () {
            const idx = 10;

            it('should get balance by hex or base58 address', async function () {
                const addressType = ['hex', 'b58'];
                let balance;
                for (const type of addressType) {
                    balance = await tronWeb.trx.getBalance(accounts[type][idx]);
                    assert.isTrue(balance >= 0);
                }
            });
        });

        describe('#getBandwidth', async function () {
            const idx = 10;

            it('should get bandwith by hex or base58 address', async function () {
                const addressType = ['hex', 'b58'];
                let bp;
                for (const type of addressType) {
                    bp = await tronWeb.trx.getBandwidth(accounts[type][idx]);
                    assert.isTrue(bp >= 0);
                }
            });
        });

        describe('#getUnconfirmedAccount', async function () {
            const idx = 11;
            let toHex: string;

            before(async function () {
                this.timeout(10000);

                const account = await tronWeb.createAccount();
                toHex = account.address.hex;
                const transaction = await tronWeb.transactionBuilder.sendTrx(
                    account.address.hex,
                    10e5,
                    accounts.hex[idx],
                );
                await broadcaster(null, accounts.pks[idx], transaction);
                await waitChainData('account', account.address.hex);
            });

            it('should get unconfirmed account by address', async function () {
                const account = await tronWeb.trx.getUnconfirmedAccount(toHex);
                assert.equal(account.address, toHex.toLowerCase());
            });

            it('should throw address is not valid error', async function () {
                await assertThrow(
                    tronWeb.trx.getUnconfirmedAccount('notAnAddress'),
                    INVALID_ADDRESS_MSG,
                );
            });
        });

        describe('#geUnconfirmedAccountById', async function () {
            const idx = 10;

            let accountId: string;

            before(async function () {
                this.timeout(10000);
                accountId = TronWeb.toHex(
                    `testtest${Math.ceil(Math.random() * 100)}`,
                );
                const transaction =
                    await tronWeb.transactionBuilder.setAccountId(
                        accountId,
                        accounts.hex[idx],
                    );
                await broadcaster(null, accounts.pks[idx], transaction);
                await waitChainData('accountById', accountId);
            });

            it('should get unconfirmed account by id', async function () {
                const account = await tronWeb.trx.getUnconfirmedAccountById(
                    accountId,
                );
                assert.equal(account.account_id, accountId.slice(2));
            });

            it('should throw accountId is not valid error', async function () {
                const ids = [
                    '',
                    '12',
                    '616161616262626231313131313131313131313131313131313131313131313131313131313131',
                ];
                for (const id of ids)
                    await assertThrow(
                        tronWeb.trx.getUnconfirmedAccountById(id),
                        'Invalid accountId provided',
                    );
            });
        });

        describe('#getUnconfirmedBalance', async function () {
            const idx = 12;
            let toHex: string;

            before(async function () {
                this.timeout(10000);

                const account = await tronWeb.createAccount();
                toHex = account.address.hex;
                const transaction = await tronWeb.transactionBuilder.sendTrx(
                    account.address.hex,
                    10e5,
                    accounts.hex[idx],
                );
                await broadcaster(null, accounts.pks[idx], transaction);
                await waitChainData('account', account.address.hex);
            });

            it('should get unconfirmed balance by account address', async function () {
                const balance = await tronWeb.trx.getUnconfirmedBalance(toHex);
                assert.equal(balance, 10e5);
            });
        });

        describe('#updateAccount', async function () {
            const idx = 13;

            it('should update account name', async function () {
                const accountName = Math.random().toString(36).substr(2);
                await tronWeb.trx.updateAccount(accountName, {
                    privateKey: accounts.pks[idx],
                    address: accounts.hex[idx],
                });
                const account = await tronWeb.trx.getUnconfirmedAccount(
                    accounts.hex[idx],
                );
                assert.equal(tronWeb.toUtf8(account.account_name), accountName);
            });

            it('should throw name must be a string error', async function () {
                await assertThrow(
                    // Intentionally invalid
                    // @ts-ignore
                    tronWeb.trx.updateAccount({}),
                    'Name must be a string',
                );
            });
        });
    });

    // Signature Test
    describe('#Sign Test', function () {
        describe('#sign', async function () {
            const idx = 14;
            let transaction;

            beforeEach(async function () {
                transaction = await tronWeb.transactionBuilder.freezeBalance(
                    10e5,
                    3,
                    'BANDWIDTH',
                    accounts.b58[idx],
                );
            });

            it('should sign a transaction', async function () {
                const signedTransaction = await tronWeb.trx.sign(
                    transaction,
                    accounts.pks[idx],
                );
                assert.equal(signedTransaction.txID, transaction.txID);
                assert.equal(signedTransaction.signature.length, 1);
            });

            it('should throw transaction not valid error', async function () {
                await assertThrow(
                    // Intentionally invalid
                    // @ts-ignore
                    tronWeb.trx.sign(undefined, accounts.pks[idx]),
                    'Invalid transaction provided',
                );
            });

            it('should throw transaction is already signed error', async function () {
                const signedTransaction = await tronWeb.trx.sign(
                    transaction,
                    accounts.pks[idx],
                );
                await assertThrow(
                    tronWeb.trx.sign(signedTransaction, accounts.pks[idx]),
                    'Transaction is already signed',
                );
            });

            it('should throw private key does not match address error', async function () {
                await assertThrow(
                    tronWeb.trx.sign(transaction, accounts.pks[idx]),
                    'Private key does not match address in transaction',
                );
            });
        });

        describe('#signMessage', async function () {
            const idx = 14;

            it('should sign a hex string message', async function () {
                const hexMsg = '0xe66f4c8f323229131006ad3e4a2ca65dfdf339f0';
                const signedMsg = await tronWeb.trx.sign(
                    hexMsg,
                    accounts.pks[idx],
                );
                assert.isTrue(signedMsg.startsWith('0x'));
            });

            it('should throw expected hex message input error', async function () {
                const hexMsg = 'e66f4c8f323229131006ad3e4a2ca65dfdf339f0';
                await assertThrow(
                    tronWeb.trx.sign(hexMsg, accounts.pks[idx]),
                    'Private key does not match address in transaction',
                );
            });
        });

        describe('#verifyMessage', async function () {
            const idx = 14;
            let hexMsg: string;
            let signedMsg: string;

            before(async function () {
                hexMsg = '0xe66f4c8f323229131006ad3e4a2ca65dfdf339f0';
                signedMsg = await tronWeb.trx.sign(
                    hexMsg,
                    accounts.pks[idx],
                    false,
                    false,
                );
            });

            it('should verify signature of signed string message', async function () {
                const result = await tronWeb.trx.verifyMessage(
                    hexMsg,
                    signedMsg,
                    accounts.hex[idx],
                    false,
                );
                assert.isTrue(result);
            });

            it('should throw expected hex message input error', async function () {
                await assertThrow(
                    tronWeb.trx.verifyMessage(
                        'e66f4c8f323229131006ad3e4a2ca65dfdf339f0',
                        signedMsg,
                        accounts.hex[idx],
                        false,
                    ),
                    'Expected hex message input',
                );
            });

            it('should throw signature does not match error', async function () {
                const fakeSig =
                    '0xafd220c015fd38ffcd34455ddf4f11d20549d9565f558dd84b508c37854727887879d62e675a285c0caf' +
                    'a34ea7814b0ae5b74835bdfb612205deb8b97d7c24811c';
                await assertThrow(
                    tronWeb.trx.verifyMessage(
                        hexMsg,
                        fakeSig,
                        accounts.hex[idx],
                        false,
                    ),
                    'Signature does not match',
                );
            });
        });

        describe('#signTypedData', async function () {
            // All properties on a domain are optional
            const domain = {
                name: 'TrcToken Test',
                version: '1',
                chainId: '0xd698d4192c56cb6be724a558448e2684802de4d6cd8690dc',
                verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
            };

            // The named list of all type definitions
            const types = {
                FromPerson: [
                    {name: 'name', type: 'string'},
                    {name: 'wallet', type: 'address'},
                    {name: 'trcTokenId', type: 'trcToken'},
                ],
                ToPerson: [
                    {name: 'name', type: 'string'},
                    {name: 'wallet', type: 'address'},
                    {name: 'trcTokenArr', type: 'trcToken[]'},
                ],
                Mail: [
                    {name: 'from', type: 'FromPerson'},
                    {name: 'to', type: 'ToPerson'},
                    {name: 'contents', type: 'string'},
                    {name: 'tAddr', type: 'address[]'},
                    {name: 'trcTokenId', type: 'trcToken'},
                    {name: 'trcTokenArr', type: 'trcToken[]'},
                ],
            };

            // The data to sign
            const value = {
                from: {
                    name: 'Cow',
                    wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                    trcTokenId: '1002000',
                },
                to: {
                    name: 'Bob',
                    wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                    trcTokenArr: ['1002000', '1002000'],
                },
                contents: 'Hello, Bob!',
                tAddr: [
                    '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                    '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                ],
                trcTokenId: '1002000',
                trcTokenArr: ['1002000', '1002000'],
            };

            it('should sign typed data', async function () {
                const signature = await tronWeb.trx._signTypedData(
                    domain,
                    types,
                    value,
                );
                const result = await tronWeb.trx.verifyTypedData(
                    domain,
                    types,
                    value,
                    signature,
                );

                // assert.equal(
                //     signature,
                //     '0xb98a61f301a383be6b078fa602ebdd76294302e6bab51cd4bcb3e4f241e7cae662ac21b2e95d8db637fa5db9dd38f2e7d1236e8f2ed3ee1d0e80bac641578f191c',
                // );
                assert.isTrue(result);

                tronWeb.trx._signTypedData(
                    domain,
                    types,
                    value,
                    (err, signature) => {
                        assert.isTrue(signature!.startsWith('0x'));
                        tronWeb.trx.verifyTypedData(
                            domain,
                            types,
                            value,
                            signature!,
                            undefined,
                            (err, result) => {
                                assert.isTrue(result);
                            },
                        );
                    },
                );
            });

            it('should sign typed data with private key', function () {
                const idx = 14;

                const signature = TronWeb.Trx._signTypedData(
                    domain,
                    types,
                    value,
                    accounts.pks[idx],
                );

                const tDomain = {
                    ...domain,
                    verifyingContract: 'TUe6BwpA7sVTDKaJQoia7FWZpC9sK8WM2t',
                };
                const tValue = {
                    ...value,
                    from: {
                        ...value.from,
                        wallet: 'TUg28KYvCXWW81EqMUeZvCZmZw2BChk1HQ',
                    },
                    to: {
                        ...value.to,
                        wallet: 'TT5rFsXYCrnzdE2q1WdR9F2SuVY59A4hoM',
                    },
                    tAddr: [
                        'TT5rFsXYCrnzdE2q1WdR9F2SuVY59A4hoM',
                        'TT5rFsXYCrnzdE2q1WdR9F2SuVY59A4hoM',
                    ],
                };
                const tSignature = TronWeb.Trx._signTypedData(
                    tDomain,
                    types,
                    tValue,
                    accounts.pks[idx],
                );

                const result = TronWeb.Trx.verifyTypedData(
                    domain,
                    types,
                    value,
                    signature,
                    accounts.b58[idx],
                );

                assert.isTrue(signature.startsWith('0x'));
                assert.equal(tSignature, signature);
                assert.isTrue(result);
            });

            it('should throw signature does not match error', function () {
                const idx = 14;

                try {
                    const signature = TronWeb.Trx._signTypedData(
                        domain,
                        types,
                        value,
                        accounts.pks[idx - 1],
                    );
                    TronWeb.Trx.verifyTypedData(
                        domain,
                        types,
                        value,
                        signature,
                        accounts.b58[idx],
                    );
                } catch (error) {
                    assert.equal(error, 'Signature does not match');
                    console.log(error);
                }
            });
        });

        describe('#multiSignTransaction', async function () {
            const ownerIdx = 15;
            const idxS = 15;
            const idxE = 18;
            const threshold = 3;

            before(async function () {
                this.timeout(10000);
                // update account permission
                const ownerAddress = accounts.hex[ownerIdx];
                const ownerPk = accounts.pks[ownerIdx];
                const ownerPermission = {
                    type: 0 as 0 | 1 | 2,
                    permission_name: 'owner',
                    threshold,
                    keys: [] as {address: string; weight: number}[],
                };
                const activePermission = {
                    type: 2 as 0 | 1 | 2,
                    permission_name: 'active0',
                    threshold,
                    operations:
                        '7fff1fc0037e0000000000000000000000000000000000000000000000000000',
                    keys: [] as {address: string; weight: number}[],
                };

                for (let i = idxS; i < idxE; i++) {
                    const address = accounts.hex[i];
                    const weight = 1;
                    ownerPermission.keys.push({
                        address: address,
                        weight: weight,
                    });
                    activePermission.keys.push({
                        address: address,
                        weight: weight,
                    });
                }

                const updateTransaction =
                    await tronWeb.transactionBuilder.updateAccountPermissions(
                        ownerAddress,
                        ownerPermission,
                        undefined,
                        [activePermission],
                    );
                assert.isTrue(
                    updateTransaction.txID &&
                        updateTransaction.txID.length === 64,
                );

                // broadcast update transaction
                const signedUpdateTransaction = await tronWeb.trx.sign(
                    updateTransaction,
                    ownerPk,
                    false,
                    false,
                );
                await tronWeb.trx.broadcast(signedUpdateTransaction);

                await wait(3);
            });

            it('should multi-sign a transaction by owner permission', async function () {
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                    );
                let signedTransaction = transaction;
                for (let i = idxS; i < idxE; i++)
                    signedTransaction = await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[i],
                        0,
                    );

                assert.equal(signedTransaction.signature!.length, 3);

                // broadcast multi-sign transaction
                const result = await tronWeb.trx.broadcast(signedTransaction);
                assert.isTrue(result.result);
            });

            it('should multi-sign a transaction by owner permission (permission id inside tx)', async function () {
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                        undefined,
                        {permissionId: 0},
                    );
                let signedTransaction = transaction;
                for (let i = idxS; i < idxE; i++)
                    signedTransaction = await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[i],
                    );

                assert.equal(signedTransaction.signature!.length, 3);

                // broadcast multi-sign transaction
                const result = await tronWeb.trx.broadcast(signedTransaction);
                assert.isTrue(result.result);
            });

            it('should verify weight after multi-sign by owner permission', async function () {
                // create transaction and do multi-sign
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                    );

                // sign and verify sign weight
                let signedTransaction = transaction;
                let signWeight;
                for (let i = idxS; i < idxE; i++) {
                    signedTransaction = await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[i],
                        0,
                    );
                    signWeight = await tronWeb.trx.getSignWeight(
                        signedTransaction,
                    );
                    if (i < idxE - 1)
                        assert.equal(
                            signWeight.result.code,
                            'NOT_ENOUGH_PERMISSION',
                        );

                    assert.equal(signWeight.approved_list.length, i - idxS + 1);
                }

                // get approved list
                const approvedList = await tronWeb.trx.getApprovedList(
                    signedTransaction,
                );
                assert.isTrue(approvedList.approved_list.length === threshold);

                // broadcast multi-sign transaction
                const result = await tronWeb.trx.broadcast(signedTransaction);
                assert.isTrue(result.result);
            });

            it('should verify weight after multi-sign by owner permission (permission id inside tx)', async function () {
                // create transaction and do multi-sign
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                        undefined,
                        {permissionId: 0},
                    );

                // sign and verify sign weight
                let signedTransaction = transaction;
                let signWeight;
                for (let i = idxS; i < idxE; i++) {
                    signedTransaction = await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[i],
                    );
                    signWeight = await tronWeb.trx.getSignWeight(
                        signedTransaction,
                    );
                    if (i < idxE - 1)
                        assert.equal(
                            signWeight.result.code,
                            'NOT_ENOUGH_PERMISSION',
                        );

                    assert.equal(signWeight.approved_list.length, i - idxS + 1);
                }

                // get approved list
                const approvedList = await tronWeb.trx.getApprovedList(
                    signedTransaction,
                );
                assert.isTrue(approvedList.approved_list.length === threshold);

                // broadcast multi-sign transaction
                const result = await tronWeb.trx.broadcast(signedTransaction);
                assert.isTrue(result.result);
            });

            it('should multi-sign a transaction with no permission error by owner permission', async function () {
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                    );
                try {
                    await tronWeb.trx.multiSign(
                        transaction,
                        accounts.pks[ownerIdx] + '123',
                        0,
                    );
                } catch (e) {
                    assert.isArray(e);
                    assert.isTrue((e as string).indexOf(NO_PERM_MSG) !== -1);
                }
            });

            it('should multi-sign duplicated a transaction by owner permission', async function () {
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                    );
                try {
                    const signedTransaction = await tronWeb.trx.multiSign(
                        transaction,
                        accounts.pks[ownerIdx],
                        0,
                    );
                    await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[ownerIdx],
                        0,
                    );
                } catch (e) {
                    assert.isTrue(
                        (e as string).indexOf('already sign transaction') !==
                            -1,
                    );
                }
            });

            it('should multi-sign a transaction by active permission', async function () {
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                    );
                let signedTransaction = transaction;
                for (let i = idxS; i < idxE; i++)
                    signedTransaction = await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[i],
                        2,
                    );

                assert.equal(signedTransaction.signature!.length, 3);

                // broadcast multi-sign transaction
                const result = await tronWeb.trx.broadcast(signedTransaction);
                assert.isTrue(result.result);
            });

            it('should multi-sign a transaction by active permission (permission id inside tx)', async function () {
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                        undefined,
                        {permissionId: 2},
                    );
                let signedTransaction = transaction;
                for (let i = idxS; i < idxE; i++)
                    signedTransaction = await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[i],
                    );

                assert.equal(signedTransaction.signature!.length, 3);

                // broadcast multi-sign transaction
                const result = await tronWeb.trx.broadcast(signedTransaction);
                assert.isTrue(result.result);
            });

            it('should verify weight after multi-sign by active permission', async function () {
                // create transaction and do multi-sign
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                    );

                // sign and verify sign weight
                let signedTransaction = transaction;
                let signWeight;
                for (let i = idxS; i < idxE; i++) {
                    signedTransaction = await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[i],
                        2,
                    );
                    signWeight = await tronWeb.trx.getSignWeight(
                        signedTransaction,
                        2,
                    );
                    if (i < idxE - 1)
                        assert.equal(
                            signWeight.result.code,
                            'NOT_ENOUGH_PERMISSION',
                        );

                    assert.equal(signWeight.approved_list.length, i - idxS + 1);
                }

                // get approved list
                const approvedList = await tronWeb.trx.getApprovedList(
                    signedTransaction,
                );
                assert.isTrue(approvedList.approved_list.length === threshold);

                // broadcast multi-sign transaction
                const result = await tronWeb.trx.broadcast(signedTransaction);
                assert.isTrue(result.result);
            });

            it('should verify weight after multi-sign by active permission (permission id inside tx)', async function () {
                // create transaction and do multi-sign
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                        undefined,
                        {permissionId: 2},
                    );

                // sign and verify sign weight
                let signedTransaction = transaction;
                let signWeight;
                for (let i = idxS; i < idxE; i++) {
                    signedTransaction = await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[i],
                    );
                    signWeight = await tronWeb.trx.getSignWeight(
                        signedTransaction,
                    );
                    if (i < idxE - 1)
                        assert.equal(
                            signWeight.result.code,
                            'NOT_ENOUGH_PERMISSION',
                        );

                    assert.equal(signWeight.approved_list.length, i - idxS + 1);
                }

                // get approved list
                const approvedList = await tronWeb.trx.getApprovedList(
                    signedTransaction,
                );
                assert.isTrue(approvedList.approved_list.length === threshold);

                // broadcast multi-sign transaction
                const result = await tronWeb.trx.broadcast(signedTransaction);
                assert.isTrue(result.result);
            });

            it('should multi-sign a transaction with no permission error by active permission', async function () {
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                    );
                try {
                    await tronWeb.trx.multiSign(
                        transaction,
                        accounts.pks[ownerIdx] + '123',
                        2,
                    );
                } catch (e) {
                    assert.isTrue((e as string).indexOf(NO_PERM_MSG) !== -1);
                }
            });

            it('should multi-sign duplicated a transaction by active permission', async function () {
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                    );
                try {
                    const signedTransaction = await tronWeb.trx.multiSign(
                        transaction,
                        accounts.pks[ownerIdx],
                        2,
                    );
                    await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[ownerIdx],
                        2,
                    );
                } catch (e) {
                    assert.isTrue(
                        (e as string).indexOf('already sign transaction') !==
                            -1,
                    );
                }
            });

            it('should multi-sign a transaction with permission error by both owner and active permission', async function () {
                try {
                    const transaction =
                        await tronWeb.transactionBuilder.freezeBalance(
                            10e5,
                            3,
                            'BANDWIDTH',
                            accounts.b58[ownerIdx],
                        );
                    const signedTransaction = await tronWeb.trx.multiSign(
                        transaction,
                        accounts.pks[ownerIdx],
                        0,
                    );
                    await tronWeb.trx.multiSign(
                        signedTransaction,
                        accounts.pks[ownerIdx],
                        2,
                    );
                } catch (e) {
                    assert.isTrue(
                        (e as string).indexOf('not contained of permission') !==
                            -1,
                    );
                }
            });

            it('should multi-sign a transaction with wrong permission id error', async function () {
                const transaction =
                    await tronWeb.transactionBuilder.freezeBalance(
                        10e5,
                        3,
                        'BANDWIDTH',
                        accounts.b58[ownerIdx],
                    );
                try {
                    await tronWeb.trx.multiSign(
                        transaction,
                        accounts.pks[ownerIdx],
                        1,
                    );
                    assert.isTrue(false, "Should've raised");
                } catch (e) {
                    assert.isTrue((e as string).indexOf(NO_PERM_MSG) !== -1);
                }
            });
        });
    });

    // Block Test
    describe('#Block Test', function () {
        describe('#getBlock', async function () {
            it('should get earliest or latest block', async function () {
                const earliestParentHash =
                    '957dc2d350daecc7bb6a38f3938ebde0a0c1cedafe15f0edae4256a2907449f6';
                const blockType = ['earliest', 'latest'];
                let block;
                for (const type of blockType) {
                    block = await tronWeb.trx.getBlock(type);
                    if (type === 'earliest')
                        assert.equal(
                            earliestParentHash,
                            block.block_header.raw_data.parentHash,
                        );

                    if (type === 'latest')
                        assert.isNumber(block.block_header.raw_data.number);
                }
            });

            it('should throw no block identifier provided error', async function () {
                await assertThrow(
                    tronWeb.trx.getBlock(null),
                    'No block identifier provided',
                );
            });

            it('should throw block not found error', async function () {
                await assertThrow(
                    tronWeb.trx.getBlock(10e10),
                    BLOCK_NOT_FOUND_MSG,
                );
            });

            it('should throw invalid block number provided error', async function () {
                await assertThrow(
                    tronWeb.trx.getBlock(-1),
                    'Invalid block number provided',
                );
            });
        });

        describe('#getBlockByHash', async function () {
            it('should get block by block hash (id)', async function () {
                const block = await tronWeb.trx.getBlock('latest');
                const blockByHash = await tronWeb.trx.getBlockByHash(
                    block.blockID,
                );
                assert.equal(block.blockID, blockByHash.blockID);
            });
        });

        describe('#getBlockByNumber', async function () {
            it('should get block by block number', async function () {
                const block = await tronWeb.trx.getBlock('latest');
                const blockByNumber = await tronWeb.trx.getBlockByNumber(
                    block.block_header!.raw_data!.number,
                );
                assert.equal(block.blockID, blockByNumber.blockID);
            });
        });

        describe('#getBlockRange', async function () {
            it('should get block by range', async function () {
                const blocks = await tronWeb.trx.getBlockRange(0, 5);
                assert.equal(blocks.length, 6);
            });

            it('should get invalid start or end error by range', async function () {
                const ranges: [number, number, string][] = [
                    [-1, 5, 'start'],
                    [1, -5, 'end'],
                ];
                for (const [start, end, name] of ranges)
                    await assertThrow(
                        tronWeb.trx.getBlockRange(start, end),
                        `Invalid ${name} of range provided`,
                    );
            });
        });

        describe('#getBlockTransactionCount', async function () {
            it("should get transaction count by block number, 'latest' or 'earliest'", async function () {
                const blockType = [1, 'latest', 'earliest'];
                for (const type of blockType) {
                    const count = await tronWeb.trx.getBlockTransactionCount(
                        type,
                    );
                    assert.isNumber(count);
                }
            });
        });

        describe('#getCurrentBlock', async function () {
            it('should get current block', async function () {
                const block = await tronWeb.trx.getCurrentBlock();
                assert.isNumber(block.block_header.raw_data.number);
            });
        });
    });

    // Transaction Test
    describe('#Transaction Test', function () {
        describe('#send', async function () {
            const fromIdx = 19;
            const toIdx = 20;

            it('should send', async function () {
                this.timeout(10000);

                const balanceBefore = await tronWeb.trx.getUnconfirmedBalance(
                    accounts.hex[toIdx],
                );
                await tronWeb.trx.send(accounts.hex[toIdx], 10e5, {
                    privateKey: accounts.pks[fromIdx],
                    address: accounts.hex[fromIdx],
                });
                await waitChainData(
                    'balance',
                    accounts.hex[toIdx],
                    balanceBefore,
                );
                const balanceAfter = await tronWeb.trx.getUnconfirmedBalance(
                    accounts.hex[toIdx],
                );
                assert.equal(balanceAfter - balanceBefore, 10e5);
            });

            it('send hould throw invalid recipient provided error', async function () {
                await assertThrow(
                    tronWeb.trx.send('notValidAddress', 10e5, {
                        privateKey: accounts.pks[fromIdx],
                    }),
                    INVALID_RECIPIENT_MSG,
                );
            });

            it('send should throw invalid amount provided error', async function () {
                await assertThrow(
                    tronWeb.trx.send(accounts.hex[toIdx], -1, {
                        privateKey: accounts.pks[fromIdx],
                    }),
                    INVALID_AMOUNT_MSG,
                );
            });
        });

        describe('#sendTransaction', async function () {
            const fromIdx = 21;
            const toIdx = 22;

            it('should send transaction', async function () {
                this.timeout(10000);

                const balanceBefore = await tronWeb.trx.getUnconfirmedBalance(
                    accounts.hex[toIdx],
                );
                await tronWeb.trx.sendTransaction(accounts.hex[toIdx], 10e5, {
                    privateKey: accounts.pks[fromIdx],
                });
                await waitChainData(
                    'balance',
                    accounts.hex[toIdx],
                    balanceBefore,
                );
                const balanceAfter = await tronWeb.trx.getUnconfirmedBalance(
                    accounts.hex[toIdx],
                );
                assert.equal(balanceAfter - balanceBefore, 10e5);
            });

            it('sendTransaction should throw invalid recipient provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendTransaction('notValidAddress', 10e5, {
                        privateKey: accounts.pks[fromIdx],
                    }),
                    INVALID_RECIPIENT_MSG,
                );
            });

            it('sendTransaction should throw invalid amount provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendTransaction(accounts.hex[toIdx], -1, {
                        privateKey: accounts.pks[fromIdx],
                    }),
                    INVALID_AMOUNT_MSG,
                );
            });
        });

        describe('#sendTrx', async function () {
            const fromIdx = 23;
            const toIdx = 24;

            it('should send trx', async function () {
                this.timeout(10000);

                const balanceBefore = await tronWeb.trx.getUnconfirmedBalance(
                    accounts.hex[toIdx],
                );
                await tronWeb.trx.sendTrx(accounts.hex[toIdx], 10e5, {
                    privateKey: accounts.pks[fromIdx],
                    address: accounts.hex[fromIdx],
                });
                await waitChainData(
                    'balance',
                    accounts.hex[toIdx],
                    balanceBefore,
                );
                const balanceAfter = await tronWeb.trx.getUnconfirmedBalance(
                    accounts.hex[toIdx],
                );
                assert.equal(balanceAfter - balanceBefore, 10e5);
            });

            it('ssendTrx hould throw invalid recipient provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendTrx('notValidAddress', 10e5, {
                        privateKey: accounts.pks[fromIdx],
                    }),
                    INVALID_RECIPIENT_MSG,
                );
            });

            it('sendTrx should throw invalid amount provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendTrx(accounts.hex[18], -1, {
                        privateKey: accounts.pks[fromIdx],
                    }),
                    INVALID_AMOUNT_MSG,
                );
            });
        });

        describe('#freezeBalance', async function () {
            const idx = 25;
            // const receiverIdx = 26;

            it('should freeze balance for energy or bandwidth', async function () {
                this.timeout(20000);

                let accountBefore = await tronWeb.trx.getAccount(
                    accounts.hex[idx],
                );
                await tronWeb.trx.freezeBalance(10e5, 3, 'BANDWIDTH', {
                    privateKey: accounts.pks[idx],
                    address: accounts.hex[idx],
                });
                await waitChainData('freezeBp', accounts.hex[idx], 0);
                let accountAfter = await tronWeb.trx.getUnconfirmedAccount(
                    accounts.hex[idx],
                );
                assert.equal(
                    (!accountBefore.frozen
                        ? 0
                        : accountBefore.frozen[0].frozen_balance) + 10e5,
                    accountAfter.frozen![0].frozen_balance,
                );

                accountBefore = accountAfter;
                await tronWeb.trx.freezeBalance(10e5, 3, 'ENERGY', {
                    privateKey: accounts.pks[idx],
                    address: accounts.hex[idx],
                });
                await waitChainData('freezeEnergy', accounts.hex[idx], 0);
                accountAfter = await tronWeb.trx.getUnconfirmedAccount(
                    accounts.hex[idx],
                );
                assert.equal(
                    (!accountBefore.account_resource ||
                    !accountBefore.account_resource.frozen_balance_for_energy
                        ? 0
                        : accountBefore.account_resource
                              .frozen_balance_for_energy.frozen_balance) + 10e5,
                    accountAfter.account_resource!.frozen_balance_for_energy!
                        .frozen_balance,
                );
            });

            it('should throw invalid resource provided error', async function () {
                await assertThrow(
                    // Intentionally invalid
                    // @ts-ignore
                    tronWeb.trx.freezeBalance(10e8, 3, 'GAS', {
                        privateKey: accounts.pks[idx],
                        address: accounts.hex[idx],
                    }),
                    'Invalid resource provided: Expected "BANDWIDTH" or "ENERGY"',
                );
            });

            it('freezeBalance should throw invalid amount provided error', async function () {
                await assertThrow(
                    tronWeb.trx.freezeBalance(-10, 3, 'BANDWIDTH', {
                        privateKey: accounts.pks[idx],
                        address: accounts.hex[idx],
                    }),
                    INVALID_AMOUNT_MSG,
                );
            });

            it('should throw invalid duration provided, minimum of 3 days error', async function () {
                await assertThrow(
                    tronWeb.trx.freezeBalance(10e8, 2, 'BANDWIDTH', {
                        privateKey: accounts.pks[idx],
                        address: accounts.hex[idx],
                    }),
                    'Invalid duration provided, minimum of 3 days',
                );
            });
        });

        // skip since duration too long
        /**
        describe.skip("#unfreezeBalance", async function () {

            before(async function(){
                await tronWeb.trx.freezeBalance(10e5, 3, 'BANDWIDTH', {}, accounts.b58[15]);
                await tronWeb.trx.freezeBalance(10e5, 3, 'ENERGY', {}, accounts.b58[15]);
            });

            it('should unfreeze balance', async function () {
                let accountBefore = await tronWeb.trx.getUnconfirmedAccount(ADDRESS_HEX);
                await tronWeb.trx.unfreezeBalance('BANDWIDTH', {}, accounts.b58[15]);
                let accountAfter = await tronWeb.trx.getUnconfirmedAccount(ADDRESS_HEX);
                assert.equal(accountBefore.frozen[0].frozen_balance - 10e5, accountAfter.frozen[0].frozen_balance);

                accountBefore = accountAfter;
                await tronWeb.trx.unfreezeBalance('ENERGY', {}, accounts.b58[15]);
                accountAfter = await tronWeb.trx.getUnconfirmedAccount(ADDRESS_HEX);
                assert.equal(
                    accountBefore.account_resource.frozen_balance_for_energy.frozen_balance - 10e5,
                    accountAfter.account_resource.frozen_balance_for_energy.frozen_balance
                );
            });

            it('should throw invalid resource provided: expected "BANDWIDTH" or "ENERGY" error', async function () {
                await assertThrow(
                    tronWeb.trx.unfreezeBalance(10e8, 3, 'GAS', {}, accounts.b58[15]),
                    'Invalid resource provided: Expected "BANDWIDTH" or "ENERGY"'
                );
            });

        });
        */

        describe('#broadcast', async function () {
            const idx = 26;
            let transaction: ITransaction;
            let signedTransaction: ISignedTransaction;

            before(async function () {
                transaction = await tronWeb.transactionBuilder.freezeBalance(
                    10e5,
                    3,
                    'BANDWIDTH',
                    accounts.b58[idx],
                );
                signedTransaction = await tronWeb.trx.sign(
                    transaction,
                    accounts.pks[idx],
                );
            });

            it('should broadcast a transaction', async function () {
                this.timeout(20000);
                const result = await tronWeb.trx.broadcast(signedTransaction);
                assert.isTrue(result.result);
                assert.equal(
                    result.result ? result.transaction.signature[0] : null,
                    signedTransaction.signature[0],
                );
            });

            it('should throw invalid transaction provided error', async function () {
                await assertThrow(
                    // Intentionally invalid
                    // @ts-ignore
                    tronWeb.trx.broadcast(false),
                    'Invalid transaction provided',
                );
            });

            it('should throw invalid options provided error', async function () {
                await assertThrow(
                    // Intentionally invalid
                    // @ts-ignore
                    tronWeb.trx.broadcast(signedTransaction, false),
                    'Invalid options provided',
                );
            });

            it('should throw transaction is not signed error', async function () {
                await assertThrow(
                    tronWeb.trx.broadcast(transaction),
                    'Transaction is not signed',
                );
            });
        });

        describe('#broadcastHex', async function () {
            it('should broadcast a hex transaction', async function () {
                const me = async () =>
                    await tronWeb.trx.broadcastHex(SIGNED_HEX_TRANSACTION);
                if (!/127\.0\.0\.1/.test(FULL_NODE_API)) {
                    // If we're using something external, we're OK
                    const result = await me();
                    assert.isTrue(result.result);
                } else {
                    // This is a bug in docker testnet impl
                    // Let's check that it is still in place!
                    try {
                        await me();
                    } catch (e) {
                        assert.isTrue(
                            e!
                                .toString()
                                .includes(
                                    'Request failed with status code 405',
                                ),
                        );
                        return;
                    }
                    assert.fail('Expected an error.');
                }
            });

            it('should throw invalid hex transaction provided error', async function () {
                await assertThrow(
                    // Intentionally invalid
                    // @ts-ignore
                    tronWeb.trx.broadcastHex(false),
                    'Invalid hex transaction provided',
                );
            });

            // It does not use `options` at all, so disabling this test
            // it('should throw invalid options provided error', async function () {
            //     await assertThrow(
            //         // Was "false", but it makes no sense
            //         // Intentionally invalid
            //         // @ts-ignore
            //         tronWeb.trx.broadcastHex(SIGNED_HEX_TRANSACTION, []),
            //         'Invalid options provided',
            //     );
            // });
        });

        describe('#getTransaction', async function () {
            const idx = 26;
            let transaction: ISignedTransaction;

            before(async function () {
                this.timeout(10000);

                const resp = await tronWeb.trx.freezeBalance(
                    10e5,
                    3,
                    'BANDWIDTH',
                    {privateKey: accounts.pks[idx], address: accounts.hex[idx]},
                );
                if (resp.result) transaction = resp.transaction;
                else throw new Error('Failed to freeze the balance');
                await waitChainData('tx', transaction.txID);
            });

            it('should get transaction by id', async function () {
                const tx = await tronWeb.trx.getTransaction(transaction.txID);
                assert.equal(tx.txID, transaction.txID);
            });

            it('should throw transaction not found error', async function () {
                await assertThrow(
                    tronWeb.trx.getTransaction(
                        'a8813981b1737d9caf7d51b200760a16c9cdbc826fa8de102386af898048cbe5',
                    ),
                    TX_NOT_FOUND_MSG,
                );
            });
        });

        describe('#getTransactionFromBlock', async function () {
            const idx = 26;
            let currBlockNum: number;

            before(async function () {
                this.timeout(10000);
                // await wait(5); // wait for new clear block generated
                const rsp = await tronWeb.trx.freezeBalance(
                    10e5,
                    3,
                    'BANDWIDTH',
                    {privateKey: accounts.pks[idx], address: accounts.hex[idx]},
                );
                if (!rsp.result)
                    throw new Error('Failed to freeze the balance');
                const currBlock = await tronWeb.trx.getBlock('latest');
                currBlockNum = currBlock.block_header.raw_data.number;
            });

            it('should get transaction from block', async function () {
                this.timeout(10000);
                for (let i = currBlockNum; i < currBlockNum + 3; )
                    try {
                        const tx = await tronWeb.trx.getTransactionFromBlock(
                            i,
                            0,
                        );
                        // assert.equal(tx.txID, transaction.txID);
                        assert.isDefined(tx.txID);
                        currBlockNum = i;
                        break;
                    } catch (e) {
                        if (e === 'Transaction not found in block') {
                            i++;
                            continue;
                        } else if (e === BLOCK_NOT_FOUND_MSG) {
                            await wait(3);
                            continue;
                        } else {
                            throw new Error(e as string);
                            break;
                        }
                    }
            });

            it('should throw transaction not found error by transaction from block', async function () {
                await assertThrow(
                    tronWeb.trx.getTransactionFromBlock(currBlockNum - 1, 0),
                    'Transaction not found in block',
                );
            });

            it('should throw block not found error by transaction from block', async function () {
                await assertThrow(
                    tronWeb.trx.getTransactionFromBlock(currBlockNum + 50, 0),
                    BLOCK_NOT_FOUND_MSG,
                );
            });

            it('should throw invalid index error by transaction from block', async function () {
                await assertThrow(
                    tronWeb.trx.getTransactionFromBlock(currBlockNum, -1),
                    'Invalid transaction index provided',
                );
            });
        });

        describe('#getTransactionInfo (Confirmed)', async function () {
            const idx = 26;
            let transaction: ISignedTransaction;

            before(async function () {
                const rsp = await tronWeb.trx.freezeBalance(
                    10e5,
                    3,
                    'BANDWIDTH',
                    {privateKey: accounts.pks[idx], address: accounts.hex[idx]},
                );
                if (rsp.result) transaction = rsp.transaction;
                else throw new Error('Failed to freeze the balance');
            });

            it('should get transaction info by id', async function () {
                this.timeout(20000);
                while (true) {
                    const tx = await tronWeb.trx.getTransactionInfo(
                        transaction.txID,
                    );
                    if (Object.keys(tx).length === 0) {
                        await wait(3);
                    } else {
                        assert.equal(tx.id, transaction.txID);
                        break;
                    }
                }
            });
        });

        describe('#geUnconfirmedTransactionInfo', async function () {
            const idx = 25;
            let transaction: ISignedTransaction;

            before(async function () {
                const rsp = await tronWeb.trx.freezeBalance(
                    10e5,
                    3,
                    'BANDWIDTH',
                    {
                        privateKey: accounts.pks[idx],
                        address: accounts.hex[idx],
                    },
                );
                if (rsp.result) transaction = rsp.transaction;
                else throw new Error('Failed to freeze the balance');
                await waitChainData('tx', transaction.txID);
            });

            it('should get unconfirmed transaction by id', async function () {
                this.timeout(10000);
                await wait(3);
                const tx = await tronWeb.trx.getUnconfirmedTransactionInfo(
                    transaction.txID,
                );
                assert.equal(tx.id, transaction.txID);
            });

            it('should throw transaction not found error', async function () {
                await assertThrow(
                    tronWeb.trx.getUnconfirmedTransactionInfo(
                        'a8813981b1737d9caf7d51b200760a16c9cdbc826fa8de102386af898048cbe5',
                    ),
                    TX_NOT_FOUND_MSG,
                );
            });
        });

        describe('#getConfirmedTransaction', async function () {
            const idx = 26;
            let transaction;

            before(async function () {
                transaction = await tronWeb.trx.freezeBalance(
                    10e5,
                    3,
                    'BANDWIDTH',
                    {privateKey: accounts.pks[idx], address: accounts.hex[idx]},
                );
            });

            it('should get confirmed transaction by tx id', async function () {
                this.timeout(20000);
                while (true)
                    try {
                        const tx = await tronWeb.trx.getConfirmedTransaction(
                            transaction.transaction.txID,
                        );
                        assert.equal(tx.txID, transaction.transaction.txID);
                        break;
                    } catch (e) {
                        if (e === TX_NOT_FOUND_MSG) {
                            await wait(3);
                            continue;
                        } else {
                            throw new Error(e as string);
                            break;
                        }
                    }
            });
        });
    });

    // TRC 10 Token Test
    describe('#Token Test', function () {
        describe('#sendAsset', async function () {
            let token: Record<string, IToken>;
            const fromIdx = 27;
            const toIdx = 28;

            before(async function () {
                this.timeout(10000);

                const options = getTokenOptions();
                const transaction =
                    await tronWeb.transactionBuilder.createToken(
                        options,
                        accounts.hex[fromIdx],
                    );
                await broadcaster(null, accounts.pks[fromIdx], transaction);
                await waitChainData('token', accounts.hex[fromIdx]);
                token = await tronWeb.trx.getTokensIssuedByAddress(
                    accounts.hex[fromIdx],
                );
            });

            it('should send trx by to address and verify account balance', async function () {
                this.timeout(20000);

                const assetBefore = (
                    await tronWeb.trx.getUnconfirmedAccount(accounts.hex[toIdx])
                ).assetV2;
                await waitChainData(
                    'tokenById',
                    token[Object.keys(token)[0]]['id'],
                );
                await tronWeb.trx.sendAsset(
                    accounts.hex[toIdx],
                    10e4,
                    token[Object.keys(token)[0]]['id'],
                    {
                        privateKey: accounts.pks[fromIdx],
                        address: accounts.hex[fromIdx],
                    },
                );

                await waitChainData(
                    'sendToken',
                    accounts.hex[toIdx],
                    !assetBefore ? 0 : assetBefore[0].value,
                );
                const assetAfter = (
                    await tronWeb.trx.getUnconfirmedAccount(accounts.hex[toIdx])
                ).assetV2;
                assert.equal(
                    !assetBefore ? 0 : assetBefore[0].value,
                    assetAfter[0].value - 10e4,
                );
            });

            it('should throw invalid recipient provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendAsset(
                        'notValidAddress',
                        10e4,
                        token[Object.keys(token)[0]]['id'],
                        {
                            privateKey: accounts.pks[fromIdx],
                            address: accounts.hex[fromIdx],
                        },
                    ),
                    INVALID_RECIPIENT_MSG,
                );
            });

            it('should throw invalid amount provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendAsset(
                        accounts.hex[toIdx],
                        -10,
                        token[Object.keys(token)[0]]['id'],
                        {
                            privateKey: accounts.pks[fromIdx],
                            address: accounts.hex[fromIdx],
                        },
                    ),
                    INVALID_AMOUNT_MSG,
                );
            });

            it('should throw invalid token ID provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendAsset(
                        accounts.hex[toIdx],
                        10e4,
                        // Intentionally invalid
                        // @ts-ignore
                        {},
                        {
                            privateKey: accounts.pks[fromIdx],
                            address: accounts.hex[fromIdx],
                        },
                    ),
                    INVALID_TOKEN_ID_MSG,
                );
            });

            it('should throw cannot transfer tokens to the same account provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendAsset(
                        accounts.hex[fromIdx],
                        10e4,
                        token[Object.keys(token)[0]]['id'],
                        {
                            privateKey: accounts.pks[fromIdx],
                            address: accounts.hex[fromIdx],
                        },
                    ),
                    'Cannot transfer tokens to the same account',
                );
            });
        });

        describe('#sendToken', async function () {
            let token: Record<string, IToken>;
            const fromIdx = 29;
            const toIdx = 30;

            before(async function () {
                this.timeout(10000);

                const options = getTokenOptions();
                const transaction =
                    await tronWeb.transactionBuilder.createToken(
                        options,
                        accounts.hex[fromIdx],
                    );
                await broadcaster(null, accounts.pks[fromIdx], transaction);
                await waitChainData('token', accounts.hex[fromIdx]);
                token = await tronWeb.trx.getTokensIssuedByAddress(
                    accounts.hex[fromIdx],
                );
            });

            it('should send trx by to address and verify account balance', async function () {
                this.timeout(10000);

                const assetBefore = (
                    await tronWeb.trx.getUnconfirmedAccount(accounts.hex[toIdx])
                ).assetV2;
                // transfer from account 10 to 11
                await tronWeb.trx.sendToken(
                    accounts.hex[toIdx],
                    10e4,
                    token[Object.keys(token)[0]]['id'],
                    {
                        privateKey: accounts.pks[fromIdx],
                        address: accounts.hex[fromIdx],
                    },
                );
                await waitChainData(
                    'sendToken',
                    accounts.hex[toIdx],
                    !assetBefore ? 0 : assetBefore[0].value,
                );
                const assetAfter = (
                    await tronWeb.trx.getUnconfirmedAccount(accounts.hex[toIdx])
                ).assetV2;

                assert.equal(
                    !assetBefore ? 0 : assetBefore[0].value,
                    assetAfter[0].value - 10e4,
                );
            });

            it('should throw invalid recipient provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendToken(
                        'notValidAddress',
                        10e4,
                        token[Object.keys(token)[0]]['id'],
                        {
                            privateKey: accounts.pks[fromIdx],
                            address: accounts.hex[fromIdx],
                        },
                    ),
                    INVALID_RECIPIENT_MSG,
                );
            });

            it('should throw invalid amount provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendToken(
                        accounts.hex[toIdx],
                        -10,
                        token[Object.keys(token)[0]]['id'],
                        {
                            privateKey: accounts.pks[fromIdx],
                            address: accounts.hex[fromIdx],
                        },
                    ),
                    INVALID_AMOUNT_MSG,
                );
            });

            it('should throw invalid token ID provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendAsset(
                        accounts.hex[toIdx],
                        10e4,
                        // Intentionally invalid
                        // @ts-ignore
                        {},
                        {
                            privateKey: accounts.pks[fromIdx],
                            address: accounts.hex[fromIdx],
                        },
                    ),
                    INVALID_TOKEN_ID_MSG,
                );
            });

            it('should throw cannot transfer tokens to the same account provided error', async function () {
                await assertThrow(
                    tronWeb.trx.sendAsset(
                        accounts.hex[fromIdx],
                        10e4,
                        token[Object.keys(token)[0]]['id'],
                        {
                            privateKey: accounts.pks[fromIdx],
                            address: accounts.hex[fromIdx],
                        },
                    ),
                    'Cannot transfer tokens to the same account',
                );
            });
        });

        describe('#getTokenFromID', async function () {
            const idx = 31;

            before(async function () {
                this.timeout(10000);

                const options = getTokenOptions();
                const transaction =
                    await tronWeb.transactionBuilder.createToken(
                        options,
                        accounts.hex[idx],
                    );
                await broadcaster(null, accounts.pks[idx], transaction);
                await waitChainData('token', accounts.hex[idx]);
            });

            it('should get token by name', async function () {
                const tokens = await tronWeb.trx.listTokens(5, 0);
                for (const token of tokens) {
                    const tk = await tronWeb.trx.getTokenFromID(token.id);
                    assert.equal(tk.id, token.id);
                }
            });

            it('should throw invalid token ID provided error', async function () {
                await assertThrow(
                    // Intentionally invalid
                    // @ts-ignore
                    tronWeb.trx.getTokenFromID({}),
                    INVALID_TOKEN_ID_MSG,
                );
            });

            it('should throw token does not exist error', async function () {
                await assertThrow(
                    tronWeb.trx.getTokenFromID(1234565),
                    'Token does not exist',
                );
            });
        });

        describe('#getTokensIssuedByAddress', async function () {
            const idx = 32;

            before(async function () {
                this.timeout(10000);

                const options = getTokenOptions();
                const transaction =
                    await tronWeb.transactionBuilder.createToken(
                        options,
                        accounts.hex[idx],
                    );
                await broadcaster(null, accounts.pks[idx], transaction);
                await waitChainData('token', accounts.hex[idx]);
            });

            it('should get token by issued address', async function () {
                const tokens = await tronWeb.trx.listTokens(5, 0);
                for (const token of tokens) {
                    const tk = await tronWeb.trx.getTokensIssuedByAddress(
                        token.owner_address,
                    );
                    assert.equal(tk[Object.keys(tk)[0]]['id'], token.id);
                }
            });

            it('should throw invalid address provided error', async function () {
                await assertThrow(
                    tronWeb.trx.getTokensIssuedByAddress('abcdefghijklmn'),
                    INVALID_ADDRESS_MSG,
                );
            });
        });

        describe('#listTokens', async function () {
            it('should list all tokens by limit', async function () {
                const tokens = await tronWeb.trx.listTokens(10, 0);
                assert.isArray(tokens);
                for (const token of tokens) assert.isDefined(token.id);
            });

            it('should throw invalid limit provided error', async function () {
                await assertThrow(
                    tronWeb.trx.listTokens(-1, 0),
                    'Invalid limit provided',
                );
            });

            it('should throw invalid offset provided error', async function () {
                await assertThrow(
                    tronWeb.trx.listTokens(5, -1),
                    'Invalid offset provided',
                );
            });
        });

        describe('#parseToken', async function () {
            it('should list all tokens by limit', async function () {
                const tokens = await tronWeb.trx.listTokens(10, 0);
                for (const token of tokens) {
                    const cloneToken = JSON.parse(JSON.stringify(token));
                    token.name = tronWeb.fromUtf8(token.name);
                    token.abbr = tronWeb.fromUtf8(token.abbr);
                    token.description =
                        token.description &&
                        tronWeb.fromUtf8(token.description);
                    token.url = tronWeb.fromUtf8(token.url);

                    const tk = tronWeb.trx._parseToken(token);
                    assert.equal(tk.name, cloneToken.name);
                    assert.equal(tk.abbr, cloneToken.abbr);
                    assert.equal(tk.description, cloneToken.description);
                    assert.equal(tk.url, cloneToken.url);
                }
            });
        });
    });

    // Exchange Test
    describe('#Exchange Test', function () {
        describe('#listExchanges', async function () {
            const idxS = 33;
            const idxE = 35;
            const toIdx = 35;

            before(async function () {
                this.timeout(20000);

                const tokenNames: string[] = [];

                // create token
                for (let i = idxS; i < idxE; i++) {
                    const options = getTokenOptions();
                    const transaction =
                        await tronWeb.transactionBuilder.createToken(
                            options,
                            accounts.hex[i],
                        );
                    await broadcaster(null, accounts.pks[i], transaction);
                    await waitChainData('token', accounts.hex[i]);
                    const token = await tronWeb.trx.getTokensIssuedByAddress(
                        accounts.hex[i],
                    );
                    await waitChainData(
                        'tokenById',
                        token[Object.keys(token)[0]]['id'],
                    );
                    await broadcaster(
                        null,
                        accounts.pks[i],
                        await tronWeb.transactionBuilder.sendToken(
                            accounts.hex[toIdx],
                            10e4,
                            token[Object.keys(token)[0]].id,
                            token[Object.keys(token)[0]].owner_address,
                        ),
                    );
                    await waitChainData('sendToken', accounts.hex[toIdx], 0);
                    tokenNames.push(token[Object.keys(token)[0]]['id']);
                }
                await broadcaster(
                    null,
                    accounts.pks[toIdx],
                    await tronWeb.transactionBuilder.createTokenExchange(
                        tokenNames[0],
                        10e3,
                        tokenNames[1],
                        10e3,
                        accounts.hex[toIdx],
                    ),
                );
            });

            it('should get exchange by id', async function () {
                const exchanges = await tronWeb.trx.listExchanges();
                assert.isArray(exchanges);
                for (const exchange of exchanges)
                    assert.isDefined(exchange.exchange_id);
            });
        });

        describe('#listExchangesPaginated', async function () {
            const idxS = 36;
            const idxE = 38;
            const toIdx = 38;

            before(async function () {
                this.timeout(20000);

                const tokenNames: string[] = [];

                // create token
                for (let i = idxS; i < idxE; i++) {
                    const options = getTokenOptions();
                    const transaction =
                        await tronWeb.transactionBuilder.createToken(
                            options,
                            accounts.hex[i],
                        );
                    await broadcaster(null, accounts.pks[i], transaction);
                    await waitChainData('token', accounts.hex[i]);
                    const token = await tronWeb.trx.getTokensIssuedByAddress(
                        accounts.hex[i],
                    );
                    await waitChainData(
                        'tokenById',
                        token[Object.keys(token)[0]]['id'],
                    );
                    await broadcaster(
                        null,
                        accounts.pks[i],
                        await tronWeb.transactionBuilder.sendToken(
                            accounts.hex[toIdx],
                            10e4,
                            token[Object.keys(token)[0]]['id'],
                            token[Object.keys(token)[0]]['owner_address'],
                        ),
                    );
                    await waitChainData('sendToken', accounts.hex[toIdx], 0);
                    tokenNames.push(token[Object.keys(token)[0]]['id']);
                }

                await broadcaster(
                    null,
                    accounts.pks[toIdx],
                    await tronWeb.transactionBuilder.createTokenExchange(
                        tokenNames[0],
                        10e3,
                        tokenNames[1],
                        10e3,
                        accounts.hex[toIdx],
                    ),
                );
            });

            it('should get exchange by id', async function () {
                const exchanges = await tronWeb.trx.listExchangesPaginated(
                    10,
                    0,
                );
                assert.isArray(exchanges);
                assert.isTrue(exchanges.length > 0);
                for (const exchange of exchanges)
                    assert.isDefined(exchange.exchange_id);
            });
        });

        describe('#getExchangeByID', async function () {
            const idxS = 39;
            const idxE = 41;
            const toIdx = 41;
            let exchanges: IExchange[];

            before(async function () {
                this.timeout(20000);

                const tokenNames: string[] = [];

                // create token
                for (let i = idxS; i < idxE; i++) {
                    const options = getTokenOptions();
                    await broadcaster(
                        null,
                        accounts.pks[i],
                        await tronWeb.transactionBuilder.createToken(
                            options,
                            accounts.hex[i],
                        ),
                    );
                    await waitChainData('token', accounts.hex[i]);
                    const token = await tronWeb.trx.getTokensIssuedByAddress(
                        accounts.hex[i],
                    );
                    await waitChainData(
                        'tokenById',
                        token[Object.keys(token)[0]]['id'],
                    );
                    await broadcaster(
                        null,
                        accounts.pks[i],
                        await tronWeb.transactionBuilder.sendToken(
                            accounts.hex[toIdx],
                            10e4,
                            token[Object.keys(token)[0]]['id'],
                            token[Object.keys(token)[0]]['owner_address'],
                        ),
                    );
                    await waitChainData('sendToken', accounts.hex[toIdx], 0);
                    tokenNames.push(token[Object.keys(token)[0]]['id']);
                }

                await broadcaster(
                    null,
                    accounts.pks[toIdx],
                    await tronWeb.transactionBuilder.createTokenExchange(
                        tokenNames[0],
                        10e3,
                        tokenNames[1],
                        10e3,
                        accounts.hex[toIdx],
                    ),
                );

                exchanges = await tronWeb.trx.listExchanges();
            });

            it('should get exchange by id', async function () {
                for (const exchange of exchanges) {
                    const ex = await tronWeb.trx.getExchangeByID(
                        exchange.exchange_id,
                    );
                    assert.equal(ex.exchange_id, exchange.exchange_id);
                }
            });
        });
    });

    // Proposal Test
    describe('#Proposal Test', async function () {
        describe('#getChainParameters', async function () {
            it('should get proposal list', async function () {
                const params = await tronWeb.trx.getChainParameters();
                assert.isArray(params);
                assert.isDefined(params[0].key);
            });
        });

        describe('#getProposal', async function () {
            let proposals: IProposal[];

            before(async function () {
                // create proposal
                const parameters = [
                    {key: 0, value: 100000},
                    {key: 1, value: 2},
                ];
                await broadcaster(
                    null,
                    PRIVATE_KEY,
                    await tronWeb.transactionBuilder.createProposal(
                        parameters[0],
                        ADDRESS_BASE58,
                    ),
                );

                proposals = await tronWeb.trx.listProposals();
            });

            it('should get proposal by id', async function () {
                for (const proposal of proposals) {
                    const ps = await tronWeb.trx.getProposal(
                        proposal.proposal_id,
                    );
                    assert.equal(ps.proposal_id, proposal.proposal_id);
                }
            });

            it('should throw invalid proposalID provided error', async function () {
                await assertThrow(
                    tronWeb.trx.getProposal(-1),
                    'Invalid proposalID provided',
                );
            });
        });

        describe('#listProposals', async function () {
            before(async function () {
                // create proposal
                for (let i = 0; i < 5; i++) {
                    const parameters = [
                        {key: i + 1, value: 100000},
                        {key: i + 2, value: 2},
                    ];
                    await broadcaster(
                        null,
                        PRIVATE_KEY,
                        await tronWeb.transactionBuilder.createProposal(
                            parameters[0],
                            ADDRESS_BASE58,
                        ),
                    );
                }
            });

            it('should list seeds node', async function () {
                const proposals = await tronWeb.trx.listProposals();
                for (const proposal of proposals) {
                    assert.isDefined(proposal.proposal_id);
                    assert.isDefined(proposal.proposer_address);
                }
            });
        });
    });

    // Contract Test
    describe('#getContract', async function () {
        const idx = 42;
        let transaction: ITransaction & {contract_address: string};

        before(async function () {
            this.timeout(10000);

            transaction = await tronWeb.transactionBuilder.createSmartContract(
                {
                    abi: {entrys: testRevertContract.abi},
                    bytecode: testRevertContract.bytecode,
                    name: testRevertContract.contractName,
                },
                accounts.hex[idx],
            );
            await broadcaster(null, accounts.pks[idx], transaction);
            await waitChainData('contract', transaction.contract_address);
        });

        it('should get contract by contract address', async function () {
            const contract = await tronWeb.trx.getContract(
                transaction.contract_address,
            );
            assert.equal(
                contract.contract_address,
                transaction.contract_address,
            );
        });

        it('should throw invalid contract address provided error', async function () {
            await assertThrow(
                tronWeb.trx.getContract('notAddress'),
                'Invalid contract address provided',
            );
        });

        it('should throw contract does not exist error', async function () {
            await assertThrow(
                tronWeb.trx.getContract(
                    '417cbcc41052b59584d1ac9fc1ce39106533aa1d40',
                ),
                'Contract does not exist',
            );
        });
    });

    // Node Test
    describe('#listNodes', async function () {
        it('should list seeds node', async function () {
            const nodes = await tronWeb.trx.listNodes();
            assert.isArray(nodes);
        });
    });

    // SR Test
    describe('#listSuperRepresentatives', async function () {
        it('should list super representatives', async function () {
            const srs = await tronWeb.trx.listSuperRepresentatives();
            assert.isArray(srs);
            for (const sr of srs) {
                assert.isDefined(sr.address);
                assert.isDefined(sr.url);
                // assert.isDefined(sr.voteCount);
                // assert.isDefined(sr.latestBlockNum);
            }
        });
    });

    describe('#timeUntilNextVoteCycle', async function () {
        it('should get time util next vote cycle', async function () {
            const num = await tronWeb.trx.timeUntilNextVoteCycle();
            assert.isNumber(num);
        });
    });

    describe('#getReward', async function () {
        it('should get the reward', async function () {
            const reward = await tronWeb.trx.getReward(accounts.hex[0]);
            assert.equal(reward, 0);
        });
    });

    describe('#getUnconfirmedReward', async function () {
        it('should get the reward', async function () {
            const reward = await tronWeb.trx.getUnconfirmedReward(
                accounts.hex[0],
            );
            assert.equal(reward, 0);
        });
    });

    describe('#getBrokerage', async function () {
        it('should get the brokerage', async function () {
            const brokerage = await tronWeb.trx.getBrokerage(accounts.hex[0]);
            assert.equal(brokerage, 20);
        });
    });

    describe('#getUnconfirmedBrokerage', async function () {
        it('should get the brokerage', async function () {
            console.log(accounts.hex[0]);
            const brokerage = await tronWeb.trx.getUnconfirmedBrokerage(
                accounts.hex[0],
            );
            assert.equal(brokerage, 20);
        });
    });

    // FIXME: should it work?
    // These two tests use `tests` global which is not defined.
    // describe('#signMessageV2', async function () {
    //     tests.forEach(function (test) {
    //         it('signs a message "' + test.name + '"', async function () {
    //             const tronWeb = new TronWeb(
    //                 {fullHost: FULL_NODE_API},
    //                 test.privateKey,
    //             );
    //             const signature = await tronWeb.trx.signMessageV2(test.message);
    //             assert.equal(
    //                 signature,
    //                 test.signature,
    //                 'computes message signature',
    //             );
    //         });
    //     });
    // });

    // describe('#verifyMessageV2', async function () {
    //     tests.forEach(function (test) {
    //         it('signs a message "' + test.name + '"', async function () {
    //             const tronWeb = new TronWeb(
    //                 {fullHost: FULL_NODE_API},
    //                 test.privateKey,
    //             );
    //             const address = await tronWeb.trx.verifyMessageV2(
    //                 test.message,
    //                 test.signature,
    //             );
    //             assert.equal(
    //                 address,
    //                 test.address,
    //                 'verifies message signature',
    //             );
    //         });
    //     });
    // });
});
