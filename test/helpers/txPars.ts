export default function (transaction) {
    return transaction.raw_data.contract[0].parameter;
}
