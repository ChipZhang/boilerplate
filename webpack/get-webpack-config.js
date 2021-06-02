"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebpackConfig = void 0;
const path_1 = __importDefault(require("path"));
const path_2 = require("../cli/path");
let wc;
function getWebpackConfig(env, argv) {
    if (!wc) {
        wc = require(path_1.default.join(path_2.configFileWebpack)); // eslint-disable-line global-require
        if (typeof wc === 'function') {
            wc = wc(env, argv);
        }
    }
    return wc;
}
exports.getWebpackConfig = getWebpackConfig;
