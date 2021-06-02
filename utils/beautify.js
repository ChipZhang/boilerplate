"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.beautify = void 0;
const js_beautify_1 = __importDefault(require("js-beautify"));
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function beautify(value) {
    return js_beautify_1.default(JSON.stringify(value));
}
exports.beautify = beautify;
