"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invertColor = exports.isValidColor = void 0;
const chroma_js_1 = __importDefault(require("chroma-js"));
const invert_color_1 = __importDefault(require("invert-color"));
function isValidColor(color) {
    return !!color.toLowerCase().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
}
exports.isValidColor = isValidColor;
function invertColor(color) {
    return chroma_js_1.default
        .scale([invert_color_1.default(color), invert_color_1.default(color, true)])(0.7)
        .hex()
        .toUpperCase();
}
exports.invertColor = invertColor;
