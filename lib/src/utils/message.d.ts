import type { SomeBytes } from './bytes';
export declare const TRON_MESSAGE_PREFIX = "\u0019TRON Signed Message:\n";
export declare function hashMessage(message: string | SomeBytes): string;
export declare function signMessage(message: string | SomeBytes, privateKey: string): string;
export declare function verifyMessage(message: string | SomeBytes, signature: string): string;
//# sourceMappingURL=message.d.ts.map