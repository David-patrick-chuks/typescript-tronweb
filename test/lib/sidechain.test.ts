/**
 * This file contains multiple "interesting" tests.
 * When some awaitable contract call is not polled for result,
 * it means we do not actually check the transaction result -
 * only the fact that tx was accepted by API.
 * In case of mapping requests, it is a necessity: same pair
 * cannot be mapped multiple times. In other places it is followed
 * by one final test with proper expectations checking
 */
import {assert} from 'chai';

import assertThrow from '../helpers/assertThrow';
import {
    ADDRESS20_MAPPING,
    ADDRESS721_MAPPING,
    CONTRACT_ADDRESS20,
    CONTRACT_ADDRESS721, // CONSUME_USER_RESOURCE_PERCENT,
    DEPOSIT_FEE,
    FEE_LIMIT,
    HASH20,
    HASH721,
    MAPPING_FEE,
    NONCE,
    PRIVATE_KEY,
    RETRY_DEPOSIT_FEE,
    RETRY_MAPPING_FEE,
    RETRY_WITHDRAW_FEE,
    SIDE_CHAIN,
    TOKEN_ID,
    WITHDRAW_FEE,
} from '../helpers/config';
import tronWebBuilder from '../helpers/tronWebBuilder';
import wait from '../helpers/wait';

describe('TronWeb.sidechain [ONLINE]', function () {
    this.retries(1); // Let it retry once (SERVER_BUSY, etc)

    const _tronWeb = tronWebBuilder.createInstanceSide();
    const address = _tronWeb.address.fromPrivateKey(PRIVATE_KEY);
    let tokenId: number;

    before(async function () {
        tokenId = Date.now();
        const contractInstance = await _tronWeb
            .contract()
            .at(CONTRACT_ADDRESS721);

        await contractInstance.mint(address, tokenId).send(PRIVATE_KEY);
    });
    describe('#deposit', function () {
        describe('#depositTrx()', function () {
            const tronWeb = tronWebBuilder.createInstanceSide();
            const callValue = 10_000_000;

            it('Sidechain must be defined', async function () {
                assert.isDefined(tronWeb.sidechain);
            });

            it('should check the balance of mainchain and sidechain after depositTrx', async function () {
                const balanceBefore =
                    await tronWeb.sidechain!.sidechain.trx.getUnconfirmedBalance();

                const [txID] = await tronWeb.sidechain!.depositTrx(
                    callValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    {
                        shouldPollResponse: true,
                        keepTxID: true,
                        maxRetries: 50,
                        pollingInterval: 3000,
                    },
                );
                assert.equal(txID.length, 64);

                while (true) {
                    const balanceAfter =
                        await tronWeb.sidechain!.sidechain.trx.getUnconfirmedBalance();

                    try {
                        assert.equal(balanceBefore + callValue, balanceAfter);
                        break;
                    } catch {
                        await wait(5);
                    }
                }
            }).timeout(5 * 60_000);

            it('deposit trx from main chain to side chain', async function () {
                // TODO: is it possible to define a constructor such that
                // - sidechain is always defined with proper options?
                const txID = await tronWeb.sidechain!.depositTrx(
                    callValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                );
                assert.equal(txID.length, 64);
            });

            it('depositTrx with the defined private key', async function () {
                const txID = await tronWeb.sidechain!.depositTrx(
                    callValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    {},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('depositTrx with permissionId in options object', async function () {
                const txID = await tronWeb.sidechain!.depositTrx(
                    callValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    {permissionId: 0},
                );
                assert.equal(txID.length, 64);
            });

            it('depositTrx with permissionId in options object and the defined private key', async function () {
                const txID = await tronWeb.sidechain!.depositTrx(
                    callValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    {permissionId: 0},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('should throw if an invalid trx number is passed', async function () {
                await assertThrow(
                    tronWeb.sidechain!.depositTrx(
                        1000.01,
                        DEPOSIT_FEE,
                        FEE_LIMIT,
                    ),
                    'Invalid callValue provided',
                );
            });

            it('should throw if an invalid fee limit is passed', async function () {
                await assertThrow(
                    tronWeb.sidechain!.depositTrx(10000, DEPOSIT_FEE, 0),
                    'Invalid feeLimit provided',
                );
            });
        });

        describe('#depositTrc10()', function () {
            const tronWeb = tronWebBuilder.createInstanceSide();
            const tokenValue = 10;

            it('should check the TRC10 balance of mainchain and sidechain after depositTrc10', async function () {
                const dataBefore =
                    await tronWeb.sidechain!.sidechain.trx.getUnconfirmedAccount();
                const balanceBefore = dataBefore.assetV2.filter(
                    (item) => item.key === TOKEN_ID.toString(),
                )[0].value;

                const [txID] = await tronWeb.sidechain!.depositTrc10(
                    TOKEN_ID,
                    tokenValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    {
                        shouldPollResponse: true,
                        keepTxID: true,
                        maxRetries: 50,
                        pollingInterval: 3000,
                    },
                );
                assert.equal(txID.length, 64);

                while (true) {
                    const dataAfter =
                        await tronWeb.sidechain!.sidechain.trx.getUnconfirmedAccount();
                    const balanceAfter = dataAfter.assetV2.filter(
                        (item) => item.key === TOKEN_ID.toString(),
                    )[0].value;
                    try {
                        assert.equal(balanceBefore + tokenValue, balanceAfter);
                        break;
                    } catch {
                        await wait(5);
                    }
                }
            }).timeout(5 * 60_000);

            it('deposit trc10 from main chain to side chain', async function () {
                const txID = await tronWeb.sidechain!.depositTrc10(
                    TOKEN_ID,
                    tokenValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                );
                assert.equal(txID.length, 64);
            });

            it('depositTrc10 with the defined private key', async function () {
                const txID = await tronWeb.sidechain!.depositTrc10(
                    TOKEN_ID,
                    tokenValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    {},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('depositTrc10 with permissionId in options object', async function () {
                const txID = await tronWeb.sidechain!.depositTrc10(
                    TOKEN_ID,
                    tokenValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    {permissionId: 0},
                );
                assert.equal(txID.length, 64);
            });

            it('depositTrc10 with permissionId in options object and the defined private key', async function () {
                const txID = await tronWeb.sidechain!.depositTrc10(
                    TOKEN_ID,
                    tokenValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    {permissionId: 0},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('should throw if an invalid token id is passed', async function () {
                const tokenId = -10;
                await assertThrow(
                    tronWeb.sidechain!.depositTrc10(
                        tokenId,
                        100,
                        DEPOSIT_FEE,
                        FEE_LIMIT,
                    ),
                    'Invalid tokenId provided',
                );
            });

            it('should throw if an invalid token value is passed', async function () {
                const tokenValue = 100.01;
                await assertThrow(
                    tronWeb.sidechain!.depositTrc10(
                        TOKEN_ID,
                        tokenValue,
                        DEPOSIT_FEE,
                        1000000,
                    ),
                    'Invalid tokenValue provided',
                );
            });

            it('should throw if an invalid fee limit is passed', async function () {
                const feeLimit = -1;
                await assertThrow(
                    tronWeb.sidechain!.depositTrc10(
                        TOKEN_ID,
                        100,
                        DEPOSIT_FEE,
                        feeLimit,
                    ),
                    'Invalid feeLimit provided',
                );
            });
        });

        describe('#depositTrc20', function () {
            const tronWeb = tronWebBuilder.createInstanceSide();
            const num = 100;

            it('should check the trc20 balance after depositTrc20', async function () {
                // only mapping once
                // can check the mapping contract address in sidechain via call
                // mainToSideContractMap(address) of mainchain gateway
                // const mappingResult = await tronWeb.sidechain!.mappingTrc20(
                //     HASH20,
                //     MAPPING_FEE,
                //     FEE_LIMIT,
                //     {shouldPollResponse: true, keepTxID: true, maxRetries: 50, pollingInterval: 3000},
                // );

                // Approve
                let [txID] = await tronWeb.sidechain!.approveTrc20(
                    num,
                    FEE_LIMIT,
                    CONTRACT_ADDRESS20,
                    {
                        shouldPollResponse: true,
                        keepTxID: true,
                        maxRetries: 50,
                        pollingInterval: 3000,
                    },
                );
                assert.equal(txID.length, 64);

                // Check the trc20 balance of mainchain before deposit
                const contractInstance = await tronWeb
                    .contract()
                    .at(CONTRACT_ADDRESS20);

                const dataBefore = await contractInstance
                    .balanceOf(address)
                    .call();
                const balanceBefore = parseInt(dataBefore._hex, 16);

                [txID] = await tronWeb.sidechain!.depositTrc20(
                    num,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    CONTRACT_ADDRESS20,
                    {
                        shouldPollResponse: true,
                        keepTxID: true,
                        maxRetries: 50,
                        pollingInterval: 3000,
                    },
                );
                assert.equal(txID.length, 64);

                while (true) {
                    const dataAfter = await contractInstance
                        .balanceOf(address)
                        .call();
                    const balanceAfter = parseInt(dataAfter._hex, 16);
                    try {
                        assert.equal(balanceBefore - num, balanceAfter);
                        break;
                    } catch {
                        await wait(5);
                    }
                }
            }).timeout(5 * 60_000);

            it('deposit trc20 from main chain to side chain', async function () {
                const txID = await tronWeb.sidechain!.depositTrc20(
                    num,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    CONTRACT_ADDRESS20,
                );
                assert.equal(txID.length, 64);
            });

            it('depositTrc20 with the defined private key', async function () {
                const txID = await tronWeb.sidechain!.depositTrc20(
                    num,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    CONTRACT_ADDRESS20,
                    {},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('depositTrc20 with permissionId in options object', async function () {
                const txID = await tronWeb.sidechain!.depositTrc20(
                    num,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    CONTRACT_ADDRESS20,
                    {permissionId: 0},
                );
                assert.equal(txID.length, 64);
            });

            it('depositTrc20 with permissionId in options object and the defined private key', async function () {
                const txID = await tronWeb.sidechain!.depositTrc20(
                    num,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    CONTRACT_ADDRESS20,
                    {permissionId: 0},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('should throw if an invalid num is passed', async function () {
                const num = 100.01;
                await assertThrow(
                    tronWeb.sidechain!.depositTrc20(
                        num,
                        DEPOSIT_FEE,
                        FEE_LIMIT,
                        CONTRACT_ADDRESS20,
                    ),
                    'Invalid num provided',
                );
            });

            it('should throw if an invalid fee limit is passed', async function () {
                const feeLimit = -1;
                await assertThrow(
                    tronWeb.sidechain!.depositTrc20(
                        num,
                        DEPOSIT_FEE,
                        feeLimit,
                        CONTRACT_ADDRESS20,
                    ),
                    'Invalid feeLimit provided',
                );
            });

            it('should throw if an invalid contract address is passed', async function () {
                await assertThrow(
                    tronWeb.sidechain!.depositTrc20(
                        100,
                        DEPOSIT_FEE,
                        FEE_LIMIT,
                        'aaaaaaaaaa',
                    ),
                    'Invalid contractAddress address provided',
                );
            });
        });

        describe('#depositTrc721', function () {
            const tronWeb = tronWebBuilder.createInstanceSide();

            it('should check the trc721 balance after depositTrc721', async function () {
                // Approve
                await tronWeb.sidechain!.approveTrc721(
                    tokenId,
                    FEE_LIMIT,
                    CONTRACT_ADDRESS721,
                    {
                        shouldPollResponse: true,
                        keepTxID: true,
                        maxRetries: 50,
                        pollingInterval: 3000,
                    },
                );

                // check the trc721 balance of mainchain before deposit
                const contractInstance = await tronWeb
                    .contract()
                    .at(CONTRACT_ADDRESS721);
                const dataBefore = await contractInstance
                    .balanceOf(address)
                    .call();
                const balanceBefore = parseInt(dataBefore._hex, 16);

                // Deposit
                const [txID] = await tronWeb.sidechain!.depositTrc721(
                    tokenId,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    CONTRACT_ADDRESS721,
                    {
                        shouldPollResponse: true,
                        keepTxID: true,
                        maxRetries: 50,
                        pollingInterval: 3000,
                    },
                );
                assert.equal(txID.length, 64);

                while (true) {
                    const dataAfter = await contractInstance
                        .balanceOf(address)
                        .call();
                    const balanceAfter = parseInt(dataAfter._hex, 16);
                    try {
                        assert.equal(balanceBefore - 1, balanceAfter);
                        break;
                    } catch {
                        await wait(5);
                    }
                }
            }).timeout(5 * 60_000);
        });
    });

    describe('#mappingTrc', function () {
        const tronWeb = tronWebBuilder.createInstanceSide();
        it('mappingTrc20', async function () {
            const txID = await tronWeb.sidechain!.mappingTrc20(
                HASH20,
                MAPPING_FEE,
                FEE_LIMIT,
            );
            assert.equal(txID.length, 64);
        });

        it('mappingTrc20 with the defined private key', async function () {
            const txID = await tronWeb.sidechain!.mappingTrc20(
                HASH20,
                MAPPING_FEE,
                FEE_LIMIT,
                {},
                PRIVATE_KEY,
            );
            assert.equal(txID.length, 64);
        });

        it('mappingTrc20 with permissionId in options object', async function () {
            const txID = await tronWeb.sidechain!.mappingTrc20(
                HASH20,
                MAPPING_FEE,
                FEE_LIMIT,
                {permissionId: 0},
            );
            assert.equal(txID.length, 64);
        });

        it('mappingTrc20 with permissionId in options object and the defined private key', async function () {
            const txID = await tronWeb.sidechain!.mappingTrc20(
                HASH20,
                MAPPING_FEE,
                FEE_LIMIT,
                {permissionId: 0},
                PRIVATE_KEY,
            );
            assert.equal(txID.length, 64);
        });

        it('should throw if an invalid trxHash', async function () {
            const trxHash = '';
            await assertThrow(
                tronWeb.sidechain!.mappingTrc20(
                    trxHash,
                    MAPPING_FEE,
                    FEE_LIMIT,
                ),
                'Invalid trxHash provided',
            );
        });

        it('should throw if an invalid fee limit is passed', async function () {
            const feeLimit = -1;
            await assertThrow(
                tronWeb.sidechain!.mappingTrc20(HASH20, MAPPING_FEE, feeLimit),
                'Invalid feeLimit provided',
            );
        });

        it('check the transaction result after mapping TRC20', async function () {
            const txID = await tronWeb.sidechain!.mappingTrc20(
                HASH20,
                MAPPING_FEE,
                FEE_LIMIT,
            );
            while (true) {
                const checkResult = await tronWeb.trx.getTransactionInfo(txID);
                if (checkResult && checkResult.result) break;
            }
        });

        it('should get the mapping address after mappingTrc20', async function () {
            const sideGatawayInstance = await tronWeb
                .sidechain!.sidechain.contract()
                .at(SIDE_CHAIN.sideOptions.sideGatewayAddress);
            const result = await sideGatawayInstance
                .mainToSideContractMap(CONTRACT_ADDRESS20)
                .call();
            assert.isTrue(tronWeb.isAddress(result));
        });

        it('mappingTrc721', async function () {
            const txID = await tronWeb.sidechain!.mappingTrc721(
                HASH721,
                MAPPING_FEE,
                FEE_LIMIT,
                // {shouldPollResponse: true, keepTxID: true},
            );
            assert.equal(txID.length, 64);
            while (true) {
                const checkResult = await tronWeb.trx.getTransactionInfo(txID);
                if (checkResult && checkResult.result) break;
            }
        }).timeout(10 * 60_000); // Sometimes very long on 1st (real) call

        it('should get the mapping address after mappingTrc721', async function () {
            const sideGatawayInstance = await tronWeb
                .sidechain!.sidechain.contract()
                .at(SIDE_CHAIN.sideOptions.sideGatewayAddress);
            const result = await sideGatawayInstance
                .mainToSideContractMap(CONTRACT_ADDRESS721)
                .call();
            assert.isTrue(tronWeb.isAddress(result));
        });
    });

    describe('#withdraw', function () {
        describe('#withdrawTrx()', function () {
            const tronWeb = tronWebBuilder.createInstanceSide();
            const callValue = 10_000_000;

            it('should check the balance of mainchain and sidechain after withdrawTrx', async function () {
                const balanceBefore = await tronWeb.trx.getUnconfirmedBalance();

                const [txID] = await tronWeb.sidechain!.withdrawTrx(
                    callValue,
                    WITHDRAW_FEE,
                    FEE_LIMIT,
                    {shouldPollResponse: true, keepTxID: true},
                );
                assert.equal(txID.length, 64);

                while (true) {
                    const balanceAfter =
                        await tronWeb.trx.getUnconfirmedBalance();
                    try {
                        assert.equal(balanceBefore + callValue, balanceAfter);
                        break;
                    } catch {
                        await wait(5);
                    }
                }
            });

            it('withdraw trx from side chain to main chain', async function () {
                const txID = await tronWeb.sidechain!.withdrawTrx(
                    callValue,
                    WITHDRAW_FEE,
                    FEE_LIMIT,
                );
                assert.equal(txID.length, 64);
            });

            it('withdrawTrx with the defined private key', async function () {
                const txID = await tronWeb.sidechain!.withdrawTrx(
                    callValue,
                    WITHDRAW_FEE,
                    FEE_LIMIT,
                    {},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('withdrawTrx with permissionId in options object', async function () {
                const txID = await tronWeb.sidechain!.withdrawTrx(
                    callValue,
                    WITHDRAW_FEE,
                    FEE_LIMIT,
                    {permissionId: 0},
                );
                assert.equal(txID.length, 64);
            });

            it('withdrawTrx with permissionId in options object and the defined private key', async function () {
                const txID = await tronWeb.sidechain!.withdrawTrx(
                    callValue,
                    WITHDRAW_FEE,
                    FEE_LIMIT,
                    {permissionId: 0},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('should throw if an invalid trx number is passed', async function () {
                await assertThrow(
                    tronWeb.sidechain!.withdrawTrx(
                        1000.01,
                        WITHDRAW_FEE,
                        FEE_LIMIT,
                    ),
                    'Invalid callValue provided',
                );
            });

            it('should throw if an invalid fee limit is passed', async function () {
                await assertThrow(
                    tronWeb.sidechain!.withdrawTrx(10000, WITHDRAW_FEE, 0),
                    'Invalid feeLimit provided',
                );
            });
        });

        describe('#withdrawTrc10()', function () {
            const tronWeb = tronWebBuilder.createInstanceSide();
            const tokenValue = 10;

            it('should check the TRC10 balance of mainchain and sidechain after withdrawTrc10', async function () {
                const dataBefore = await tronWeb.trx.getUnconfirmedAccount();
                const balanceBefore = dataBefore.assetV2.filter(
                    (item) => item.key === TOKEN_ID.toString(),
                )[0].value;

                const [txID] = await tronWeb.sidechain!.withdrawTrc10(
                    TOKEN_ID,
                    tokenValue,
                    DEPOSIT_FEE,
                    FEE_LIMIT,
                    {shouldPollResponse: true, keepTxID: true},
                );
                assert.equal(txID.length, 64);

                while (true) {
                    const dataAfter = await tronWeb.trx.getUnconfirmedAccount();
                    const balanceAfter = dataAfter.assetV2.filter(
                        (item) => item.key === TOKEN_ID.toString(),
                    )[0].value;
                    try {
                        assert.equal(balanceBefore + tokenValue, balanceAfter);
                        break;
                    } catch {
                        await wait(5);
                    }
                }
            });

            it('withdraw trc10 from side chain to main chain', async function () {
                const txID = await tronWeb.sidechain!.withdrawTrc10(
                    TOKEN_ID,
                    tokenValue,
                    WITHDRAW_FEE,
                    FEE_LIMIT,
                );
                assert.equal(txID.length, 64);
            });

            it('withdrawTrc10 with the defined private key', async function () {
                const txID = await tronWeb.sidechain!.withdrawTrc10(
                    TOKEN_ID,
                    tokenValue,
                    WITHDRAW_FEE,
                    FEE_LIMIT,
                    {},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('withdrawTrc10 with permissionId in options object', async function () {
                const tokenValue = 10;
                const options = {permissionId: 0};
                const txID = await tronWeb.sidechain!.withdrawTrc10(
                    TOKEN_ID,
                    tokenValue,
                    WITHDRAW_FEE,
                    FEE_LIMIT,
                    options,
                );
                assert.equal(txID.length, 64);
            });

            it('withdrawTrc10 with permissionId in options object and the defined private key', async function () {
                const txID = await tronWeb.sidechain!.withdrawTrc10(
                    TOKEN_ID,
                    tokenValue,
                    WITHDRAW_FEE,
                    FEE_LIMIT,
                    {permissionId: 0},
                    PRIVATE_KEY,
                );
                assert.equal(txID.length, 64);
            });

            it('should throw if an invalid token id is passed', async function () {
                const tokenId = -10;
                await assertThrow(
                    tronWeb.sidechain!.withdrawTrc10(
                        tokenId,
                        100,
                        WITHDRAW_FEE,
                        1000000,
                    ),
                    'Invalid tokenId provided',
                );
            });

            it('should throw if an invalid token value is passed', async function () {
                const tokenValue = 10.01;
                await assertThrow(
                    tronWeb.sidechain!.withdrawTrc10(
                        TOKEN_ID,
                        tokenValue,
                        WITHDRAW_FEE,
                        FEE_LIMIT,
                    ),
                    'Invalid tokenValue provided',
                );
            });

            it('should throw if an invalid fee limit is passed', async function () {
                const feeLimit = -1;
                await assertThrow(
                    tronWeb.sidechain!.withdrawTrc10(
                        TOKEN_ID,
                        100,
                        WITHDRAW_FEE,
                        feeLimit,
                    ),
                    'Invalid feeLimit provided',
                );
            });
        });

        describe('#withdrawTrc', function () {
            describe('#withdrawTrc20', function () {
                const tronWeb = tronWebBuilder.createInstanceSide();
                const num = 10;

                it('should check the trc20 balance after withdrawTrc20', async function () {
                    // main

                    const contractInstance = await tronWeb
                        .contract()
                        .at(CONTRACT_ADDRESS20);
                    const dataBefore = await contractInstance
                        .balanceOf(address)
                        .call();
                    const balanceBefore = parseInt(dataBefore._hex, 16);

                    const [txID] = await tronWeb.sidechain!.withdrawTrc20(
                        num,
                        WITHDRAW_FEE,
                        FEE_LIMIT,
                        ADDRESS20_MAPPING,
                        {shouldPollResponse: true, keepTxID: true},
                    );
                    assert.equal(txID.length, 64);

                    while (true) {
                        const dataAfter = await contractInstance
                            .balanceOf(address)
                            .call();
                        const balanceAfter = parseInt(dataAfter._hex, 16);
                        try {
                            assert.equal(balanceBefore + num, balanceAfter);
                            break;
                        } catch {
                            await wait(5);
                        }
                    }
                });

                it('withdraw trc20 from side chain to main chain', async function () {
                    const txID = await tronWeb.sidechain!.withdrawTrc20(
                        num,
                        WITHDRAW_FEE,
                        FEE_LIMIT,
                        ADDRESS20_MAPPING,
                    );
                    assert.equal(txID.length, 64);
                });

                it('withdrawTrc20 with the defined private key', async function () {
                    const txID = await tronWeb.sidechain!.withdrawTrc20(
                        num,
                        WITHDRAW_FEE,
                        FEE_LIMIT,
                        ADDRESS20_MAPPING,
                        {},
                        PRIVATE_KEY,
                    );
                    assert.equal(txID.length, 64);
                });

                it('withdrawTrc20 with permissionId in options object', async function () {
                    const txID = await tronWeb.sidechain!.withdrawTrc20(
                        num,
                        WITHDRAW_FEE,
                        FEE_LIMIT,
                        ADDRESS20_MAPPING,
                        {permissionId: 0},
                    );
                    assert.equal(txID.length, 64);
                });

                it('withdrawTrc20 with permissionId in options object and the defined private key', async function () {
                    const txID = await tronWeb.sidechain!.withdrawTrc20(
                        num,
                        WITHDRAW_FEE,
                        FEE_LIMIT,
                        ADDRESS20_MAPPING,
                        {permissionId: 0},
                        PRIVATE_KEY,
                    );
                    assert.equal(txID.length, 64);
                });

                it('should throw if an invalid num is passed', async function () {
                    const num = 10.01;
                    await assertThrow(
                        tronWeb.sidechain!.withdrawTrc20(
                            num,
                            WITHDRAW_FEE,
                            FEE_LIMIT,
                            ADDRESS20_MAPPING,
                        ),
                        'Invalid numOrId provided',
                    );
                });

                it('should throw if an invalid fee limit is passed', async function () {
                    await assertThrow(
                        tronWeb.sidechain!.withdrawTrc20(
                            100,
                            WITHDRAW_FEE,
                            FEE_LIMIT * 10,
                            ADDRESS20_MAPPING,
                        ),
                        'Invalid feeLimit provided',
                    );
                });

                it('should throw if an invalid contract address is passed', async function () {
                    await assertThrow(
                        tronWeb.sidechain!.withdrawTrc20(
                            100,
                            WITHDRAW_FEE,
                            FEE_LIMIT,
                            'aaaaaaaaaa',
                        ),
                        'Invalid contractAddress address provided',
                    );
                });
            });

            describe('#withdrawTrc721', async function () {
                const tronWeb = tronWebBuilder.createInstanceSide();

                it('withdraw trc721 from side chain to main chain', async function () {
                    // check the trc721 balance of mainchain before deposit
                    const contractInstance = await tronWeb
                        .contract()
                        .at(CONTRACT_ADDRESS721);
                    const dataBefore = await contractInstance
                        .balanceOf(address)
                        .call();
                    const balanceBefore = parseInt(dataBefore._hex, 16);

                    // Deposit
                    try {
                        const [txID] = await tronWeb.sidechain!.withdrawTrc721(
                            tokenId,
                            DEPOSIT_FEE,
                            FEE_LIMIT,
                            ADDRESS721_MAPPING,
                            {shouldPollResponse: true, keepTxID: true},
                        );
                        assert.equal(txID.length, 64);
                    } catch (ex) {
                        // Retry here, but wait a while first.
                        // It means corresponding deposit transaction
                        // was not completely processed yet.
                        await wait(20);
                        throw ex;
                    }

                    while (true) {
                        const dataAfter = await contractInstance
                            .balanceOf(address)
                            .call();
                        const balanceAfter = parseInt(dataAfter._hex, 16);
                        try {
                            assert.equal(balanceBefore + 1, balanceAfter);
                            break;
                        } catch {
                            await wait(5);
                        }
                    }
                });
            });
        });
    });

    describe('#injectFund', function () {
        it('execute injectFund', async function () {
            const tronWeb = tronWebBuilder.createInstanceSide();
            const txID = await tronWeb.sidechain!.injectFund(
                1000000,
                FEE_LIMIT,
            );
            assert.equal(txID.length, 64);
        });
    });

    describe('#retry', function () {
        it('retry mapping', async function () {
            const tronWeb = tronWebBuilder.createInstanceSide();
            const txID = await tronWeb.sidechain!.retryMapping(
                NONCE,
                RETRY_MAPPING_FEE,
                FEE_LIMIT,
            );
            assert.equal(txID.length, 64);
        });

        it('retry deposit', async function () {
            const tronWeb = tronWebBuilder.createInstanceSide();
            const txID = await tronWeb.sidechain!.retryDeposit(
                NONCE,
                RETRY_DEPOSIT_FEE,
                FEE_LIMIT,
            );
            assert.equal(txID.length, 64);
        });

        it('retry withdraw', async function () {
            const tronWeb = tronWebBuilder.createInstanceSide();
            const txID = await tronWeb.sidechain!.retryWithdraw(
                NONCE,
                RETRY_WITHDRAW_FEE,
                FEE_LIMIT,
            );
            assert.equal(txID.length, 64);
        });
    });
});
