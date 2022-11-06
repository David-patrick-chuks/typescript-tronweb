import {assert} from 'chai';

export default async function (
    func,
    expectedError?: string | null,
    expectedErrorContains?: string | string[],
) {
    let errMsg;
    try {
        await func;
    } catch (err) {
        if (err && typeof err === 'object') {
            if ('message' in err) errMsg = err['message'];
            else if ('error' in err) errMsg = err['error'];
        } else {
            errMsg = err;
        }
        if (expectedError) {
            assert.equal(errMsg, expectedError);
        } else if (expectedErrorContains) {
            if (!Array.isArray(expectedErrorContains))
                expectedErrorContains = [expectedErrorContains];

            for (const expected of expectedErrorContains)
                assert.notEqual(errMsg.indexOf(expected), -1);
        }
    }
}
