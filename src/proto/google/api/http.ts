/* eslint-disable */

export const protobufPackage = 'google.api';

export interface Http {
    rules: HttpRule[];
}

export interface HttpRule {
    pattern?:
        | {$case: 'get'; get: string}
        | {$case: 'put'; put: string}
        | {$case: 'post'; post: string}
        | {$case: 'delete'; delete: string}
        | {$case: 'patch'; patch: string}
        | {$case: 'custom'; custom: CustomHttpPattern};
    selector: string;
    body: string;
    additional_bindings: HttpRule[];
}

export interface CustomHttpPattern {
    kind: string;
    path: string;
}
