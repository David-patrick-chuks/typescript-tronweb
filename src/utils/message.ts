import {ADDRESS_PREFIX} from './address';
import type {SomeBytes} from './bytes';
import {hexStr2byteArray} from './code';
import {getBase58CheckAddress} from './crypto';
import {
    SigningKey,
    concat,
    joinSignature,
    keccak256,
    recoverAddress,
    toUtf8Bytes,
} from './ethersUtils';

export const TRON_MESSAGE_PREFIX = '\x19TRON Signed Message:\n';

export function hashMessage(message: string | SomeBytes): string {
    if (typeof message === 'string') message = toUtf8Bytes(message);

    return keccak256(
        concat([
            toUtf8Bytes(TRON_MESSAGE_PREFIX),
            toUtf8Bytes(String(message.length)),
            message,
        ]),
    );
}

export function signMessage(
    message: string | SomeBytes,
    privateKey: string,
): string {
    if (!privateKey.match(/^0x/)) privateKey = '0x' + privateKey;

    const signingKey = new SigningKey(privateKey);
    const messageDigest = hashMessage(message);
    const signature = signingKey.signDigest(messageDigest);

    return joinSignature(signature);
}

export function verifyMessage(
    message: string | SomeBytes,
    signature: string,
): string {
    if (!signature.match(/^0x/)) signature = '0x' + signature;

    const recovered = recoverAddress(hashMessage(message), signature);
    return getBase58CheckAddress(
        hexStr2byteArray(recovered.replace(/^0x/, ADDRESS_PREFIX)),
    );
}
