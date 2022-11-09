import {ITransaction} from '../../src/lib/transactionBuilder';
import {createInstance} from '../helpers/tronWebBuilder';

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
    while (true)
        try {
            const tx = await tronWeb.trx.sendRawTransaction(signedTransaction);
            if (tx && tx.code === 'SERVER_BUSY') continue;
            const result = {
                transaction,
                signedTransaction,
                receipt: tx,
            };
            return Promise.resolve(result);
        } catch (ex) {
            return Promise.reject(ex);
        }
}

export default broadcastVerbose;
