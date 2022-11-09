import {assert} from 'chai';
// import {FULL_NODE_API} from '../helpers/config';
// import assertThrow from '../helpers/assertThrow';
import tronWebBuilder from '../helpers/tronWebBuilder';
import {IAccts, TronWeb as RefTronWeb} from '../helpers/tronWebBuilder';
// import jlog from '../helpers/jlog';
import broadcaster from '../helpers/broadcaster';
import wait from '../helpers/wait';

import Contract from '../../src/lib/contract';
import TronWeb from '../../src';

describe('TronWeb.lib.event', async function () {
    let accounts: IAccts;
    let tronWeb: TronWeb;
    let contractAddress: string;
    let contract: Contract;
    let eventLength = 0;

    before(async function () {
        tronWeb = tronWebBuilder.createInstance();
        accounts = await tronWebBuilder.getTestAccounts(-1);
        console.log(accounts);

        const result = await broadcaster(
            tronWeb.transactionBuilder.createSmartContract(
                {
                    abi: [
                        {
                            anonymous: false,
                            inputs: [
                                {
                                    indexed: true,
                                    name: '_sender',
                                    type: 'address',
                                },
                                {
                                    indexed: false,
                                    name: '_receiver',
                                    type: 'address',
                                },
                                {
                                    indexed: false,
                                    name: '_amount',
                                    type: 'uint256',
                                },
                            ],
                            name: 'SomeEvent',
                            type: 'event',
                        },
                        {
                            constant: false,
                            inputs: [
                                {
                                    name: '_receiver',
                                    type: 'address',
                                },
                                {
                                    name: '_someAmount',
                                    type: 'uint256',
                                },
                            ],
                            name: 'emitNow',
                            outputs: [],
                            payable: false,
                            stateMutability: 'nonpayable',
                            type: 'function',
                        },
                    ],
                    bytecode:
                        '0x608060405234801561001057600080fd5b50610145806100206000396000f300608060405260043610610041576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168063bed7111f14610046575b600080fd5b34801561005257600080fd5b50610091600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610093565b005b3373ffffffffffffffffffffffffffffffffffffffff167f9f08738e168c835bbaf7483705fb1c0a04a1a3258dd9687f14d430948e04e3298383604051808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019250505060405180910390a250505600a165627a7a7230582033629e2b0bba53f7b5c49769e7e360f2803ae85ac80e69dd61c7bb48f9f401f30029',
                    name: 'Foo',
                },
                accounts.hex[0],
            ),
            accounts.pks[0],
        );

        contractAddress = result.receipt.transaction.contract_address;
        await wait(1);
        contract = await tronWeb.contract().at(contractAddress);
    });

    describe('#constructor()', function () {
        it('should have been set a full instance in tronWeb', function () {
            assert.instanceOf(tronWeb.event, RefTronWeb.Event);
        });
    });

    describe('#getEventsByTransactionID', async function () {
        it('should emit an unconfirmed event and get it', async function () {
            this.timeout(60000);
            tronWeb.setPrivateKey(accounts.pks[1]);
            const txId = await contract.emitNow(accounts.hex[2], 2000).send({
                from: accounts.hex[1],
            });
            eventLength++;
            let events;
            while (true) {
                events = await tronWeb.event.getEventsByTransactionID(txId);
                if (events.length) break;

                await wait(0.5);
            }

            assert.equal(
                events[0].result._receiver.substring(2),
                accounts.hex[2].substring(2),
            );
            assert.equal(
                events[0].result._sender.substring(2),
                accounts.hex[1].substring(2),
            );
            assert.equal(events[0].resourceNode, 'fullNode');
        });

        it('should emit an event, wait for confirmation and get it', async function () {
            this.timeout(60000);
            tronWeb.setPrivateKey(accounts.pks[1]);
            const output = await contract.emitNow(accounts.hex[2], 2000).send({
                from: accounts.hex[1],
                shouldPollResponse: true,
                rawResponse: true,
            });
            eventLength++;

            const txId = output.id;
            let events;
            while (true) {
                events = await tronWeb.event.getEventsByTransactionID(txId);
                if (events.length) break;

                await wait(0.5);
            }

            assert.equal(
                events[0].result._receiver.substring(2),
                accounts.hex[2].substring(2),
            );
            assert.equal(
                events[0].result._sender.substring(2),
                accounts.hex[1].substring(2),
            );
            assert.equal(events[0].resourceNode, 'solidityNode');
        });
    });

    describe('#getEventsByContractAddress', async function () {
        it('should emit an event and wait for it', async function () {
            this.timeout(60000);
            tronWeb.setPrivateKey(accounts.pks[3]);
            await contract.emitNow(accounts.hex[4], 4000).send({
                from: accounts.hex[3],
            });
            eventLength++;
            let events;
            while (true) {
                events = await tronWeb.event.getEventsByContractAddress(
                    contractAddress,
                    {
                        eventName: 'SomeEvent',
                        sort: 'block_timestamp',
                    },
                );
                if (events.length === eventLength) break;

                await wait(0.5);
            }

            const event = events[events.length - 1];

            assert.equal(
                event.result._receiver.substring(2),
                accounts.hex[4].substring(2),
            );
            assert.equal(
                event.result._sender.substring(2),
                accounts.hex[3].substring(2),
            );
            assert.equal(event.resourceNode, 'fullNode');
        });
    });

    describe('#contract.method.watch', async function () {
        it('should watch for an event', async function () {
            this.timeout(20000);
            tronWeb.setPrivateKey(accounts.pks[3]);

            const watchTest = await contract
                .SomeEvent() // eslint-disable-line new-cap
                .watch({}, (err, res) => {
                    if (res) {
                        assert.equal(res.result._sender, accounts.hex[3]);
                        assert.equal(res.result._receiver, accounts.hex[4]);
                        assert.equal(res.result._amount, 4000);

                        watchTest!.stop(); // Calls stop on itself when successful
                    }
                });

            contract.emitNow(accounts.hex[4], 4000).send({
                from: accounts.hex[3],
            });
        });

        it('should only watch for an event with given filters', async function () {
            this.timeout(20000);
            tronWeb.setPrivateKey(accounts.pks[3]);

            const watchTest = await contract
                .SomeEvent() // eslint-disable-line new-cap
                .watch({filters: {_amount: '4000'}}, (err, res) => {
                    if (res) {
                        assert.equal(res.result._sender, accounts.hex[3]);
                        assert.equal(res.result._receiver, accounts.hex[4]);
                        assert.equal(res.result._amount, 4000);

                        watchTest!.stop(); // Calls stop on itself when successful
                    }
                });

            contract.emitNow(accounts.hex[4], 4000).send({
                from: accounts.hex[3],
            });
        });
    });
});
