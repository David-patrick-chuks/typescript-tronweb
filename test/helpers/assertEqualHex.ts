export {};
import {assert} from 'chai';
import {getInstance} from './tronWebBuilder';

export default async function (result, string) {
    assert.equal(result, getInstance().toHex(string).substring(2));
}
