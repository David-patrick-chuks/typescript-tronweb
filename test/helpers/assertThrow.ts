import {assert} from 'chai';

export default async function (
    func,
    expectedError?: string | null,
    expectedErrorContains?: string | string[],
) {
    try {
        await func;
    } catch (err: any) {
        let errMsg: string = err.toString();
        if (err && typeof err === 'object')
            if ('message' in err) errMsg = err['message'];
            else if ('error' in err) errMsg = err['error'];

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
