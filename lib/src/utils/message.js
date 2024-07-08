"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMessage = exports.signMessage = exports.hashMessage = exports.TRON_MESSAGE_PREFIX = void 0;
const address_1 = require("./address");
const code_1 = require("./code");
const crypto_1 = require("./crypto");
const ethersUtils_1 = require("./ethersUtils");
exports.TRON_MESSAGE_PREFIX = '\x19TRON Signed Message:\n';
function hashMessage(message) {
    if (typeof message === 'string')
        message = (0, ethersUtils_1.toUtf8Bytes)(message);
    return (0, ethersUtils_1.keccak256)((0, ethersUtils_1.concat)([
        (0, ethersUtils_1.toUtf8Bytes)(exports.TRON_MESSAGE_PREFIX),
        (0, ethersUtils_1.toUtf8Bytes)(String(message.length)),
        message,
    ]));
}
exports.hashMessage = hashMessage;
function signMessage(message, privateKey) {
    if (!privateKey.match(/^0x/))
        privateKey = '0x' + privateKey;
    const signingKey = new ethersUtils_1.SigningKey(privateKey);
    const messageDigest = hashMessage(message);
    const signature = signingKey.signDigest(messageDigest);
    return (0, ethersUtils_1.joinSignature)(signature);
}
exports.signMessage = signMessage;
function verifyMessage(message, signature) {
    if (!signature.match(/^0x/))
        signature = '0x' + signature;
    const recovered = (0, ethersUtils_1.recoverAddress)(hashMessage(message), signature);
    return (0, crypto_1.getBase58CheckAddress)((0, code_1.hexStr2byteArray)(recovered.replace(/^0x/, address_1.ADDRESS_PREFIX)));
}
exports.verifyMessage = verifyMessage;
//# sourceMappingURL=message.js.map