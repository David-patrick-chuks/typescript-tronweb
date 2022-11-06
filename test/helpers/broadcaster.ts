import {createInstance} from '../helpers/tronWebBuilder';

import {ITransaction} from '../../src/lib/transactionBuilder';

async function broadcastVerbose<T extends ITransaction>(
    func: null,
    pk: null | undefined | string,
    transaction: T,
): Promise<{
    transaction: T;
    signedTransaction: T;
    receipt: any; // FIXME: exact
}>;
async function broadcastVerbose<T extends ITransaction>(
    func: Promise<T>,
    pk?: null | string,
    transaction?: T,
): Promise<{
    transaction: T;
    signedTransaction: T;
    receipt: any;
}>;
async function broadcastVerbose<T extends ITransaction>(
    func: Promise<T> | null,
    pk?: null | string,
    transaction?: T,
): Promise<{
    transaction: T;
    signedTransaction: T;
    receipt: any;
}> {
    if (!transaction) return broadcastVerbose(null, pk, (await func) as T);

    const tronWeb = createInstance();
    const signedTransaction = await tronWeb.trx.sign(
        transaction,
        pk || undefined,
    );
    const result = {
        transaction,
        signedTransaction,
        receipt: await tronWeb.trx.sendRawTransaction(signedTransaction),
    };
    return Promise.resolve(result);
}

export default broadcastVerbose;
