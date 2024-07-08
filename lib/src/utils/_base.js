"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithTronwebAndInjectpromise = void 0;
const injectpromise_1 = __importDefault(require("injectpromise"));
class WithTronwebAndInjectpromise {
    constructor(tronWeb) {
        if (!tronWeb)
            throw new Error('Expected instances of TronWeb and utils');
        this.tronWeb = tronWeb;
        this.injectPromise = (0, injectpromise_1.default)(this);
    }
}
exports.WithTronwebAndInjectpromise = WithTronwebAndInjectpromise;
//# sourceMappingURL=_base.js.map