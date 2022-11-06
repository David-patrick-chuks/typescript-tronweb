import {createInstance, newTestAccounts} from './tronWebBuilder';

const tronWeb = createInstance();
export default tronWeb;

const amount = parseInt(process.argv[2] || '10');
(async function () {
    await newTestAccounts(amount);
})();
