export {};
import {assert} from 'chai';
// import wait from '../../helpers/wait';
import assertThrow from '../../helpers/assertThrow';
import broadcaster from '../../helpers/broadcaster';
// import _ from 'lodash';
import tronWebBuilder from '../../helpers/tronWebBuilder';
import {TronWeb, IAccts} from '../../helpers/tronWebBuilder';

import {
    testRevert as testRevertContract,
    testSetVal as testSetValContract,
} from '../../fixtures/contracts';

describe('#contract.method', function () {
    let accounts: IAccts;
    let tronWeb: TronWeb;

    before(async function () {
        tronWeb = tronWebBuilder.createInstance();
        // ALERT this works only with Tron Quickstart:
        accounts = await tronWebBuilder.getTestAccounts(-1);
        await TronWeb.createAccount();
    });

    describe('#send()', function () {
        let testRevert;
        let testSetVal;

        before(async function () {
            const tx = await broadcaster(
                tronWeb.transactionBuilder.createSmartContract(
                    // TODO: seriously changed by me
                    {
                        name: testRevertContract.contractName,
                        bytecode: testRevertContract.bytecode,
                        abi: {entrys: testRevertContract.abi},
                    },
                    accounts.b58[0],
                ),
                accounts.pks[0],
            );
            testRevert = await tronWeb
                .contract()
                .at(tx.transaction.contract_address);

            const tx2 = await broadcaster(
                tronWeb.transactionBuilder.createSmartContract(
                    // TODO: seriously changed by me
                    {
                        name: testSetValContract.contractName,
                        bytecode: testSetValContract.bytecode,
                        abi: {entrys: testSetValContract.abi},
                    },
                    accounts.b58[0],
                ),
                accounts.pks[0],
            );
            testSetVal = await tronWeb
                .contract()
                .at(tx2.transaction.contract_address);
        });

        it('should set accounts[2] as the owner and check it with getOwner(1)', async function () {
            await testRevert.setOwner(accounts.b58[2]).send();
            assert.equal(await testRevert.getOwner(1).call(), accounts.hex[2]);
        });

        it('should revert if trying to set TSeFTBYCy3r2kZNYsj86G6Yz6rsmPdYdFs as the owner', async function () {
            this.timeout(30000);
            await assertThrow(
                testRevert
                    .setOwner('TSeFTBYCy3r2kZNYsj86G6Yz6rsmPdYdFs')
                    .send({shouldPollResponse: true}),
                undefined,
                'REVERT',
            );
        });

        it('should set the val to 123', async function () {
            this.timeout(30000);
            const result = await testSetVal.set(123).send({
                shouldPollResponse: true,
                keepTxID: true,
            });
            assert.equal(result[0].length, 64);
            assert.equal(result[1].toNumber(), 123);
        });
    });

    describe('#call()', function () {
        let testRevert;

        before(async function () {
            const tx = await broadcaster(
                tronWeb.transactionBuilder.createSmartContract(
                    // TODO: seriously changed by me
                    {
                        name: testRevertContract.contractName,
                        bytecode: testRevertContract.bytecode,
                        abi: {entrys: testRevertContract.abi},
                    },
                    accounts.b58[0],
                ),
                accounts.pks[0],
            );
            testRevert = await tronWeb
                .contract()
                .at(tx.transaction.contract_address);
            await testRevert.setOwner(accounts.b58[2]).send();
        });

        it('should getOwner(1) and get accounts[2]', async function () {
            assert.equal(await testRevert.getOwner(1).call(), accounts.hex[2]);
        });

        it('should revert if call getOwner(2)', async function () {
            await assertThrow(testRevert.getOwner(2).call());
        });

        it('should revert if call getOwner2()', async function () {
            await assertThrow(testRevert.getOwner2(2).call());
        });
    });
});
