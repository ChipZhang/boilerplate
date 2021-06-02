"use strict";
/* eslint-disable no-console */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const chalk_1 = __importDefault(require("chalk"));
let enabled = true;
function disable() {
    enabled = false;
}
function enable() {
    enabled = true;
}
function isDebugEnabled() {
    var _a;
    switch (((_a = process.env.DEBUG) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '') {
        case '':
        case '0':
        case 'n':
        case 'no':
        case 'off':
            return false;
        default:
            return true;
    }
}
// used to make the first parameter of console.xxx is string, thus enabling formatting when needed
function helper(color, ...msg) {
    if (msg.length > 0 && typeof msg[0] === 'string') {
        return { first: `${color} ${msg[0]}`, rest: msg.slice(1) };
    }
    return { first: color, rest: msg };
}
function print(...msg) {
    if (!enabled) {
        return;
    }
    console.log(...msg);
}
function debug(...msg) {
    if (!enabled) {
        return;
    }
    if (isDebugEnabled()) {
        const { first, rest } = helper(chalk_1.default.bgBlue.white('DBG'), ...msg);
        console.debug(first, ...rest);
    }
}
function info(...msg) {
    if (!enabled) {
        return;
    }
    const { first, rest } = helper(chalk_1.default.bgGreen.black('INF'), ...msg);
    console.info(first, ...rest);
}
function warn(...msg) {
    if (!enabled) {
        return;
    }
    const { first, rest } = helper(chalk_1.default.bgYellow.black('WRN'), ...msg);
    console.warn(first, ...rest);
}
function error(...msg) {
    if (!enabled) {
        return;
    }
    const { first, rest } = helper(chalk_1.default.bgRed.white('ERR'), ...msg);
    console.error(first, ...rest);
}
function assert(condition, err) {
    if (!condition) {
        console.error(chalk_1.default.bgRed.white('FTL:'));
        if (typeof err === 'string') {
            throw new Error(err);
        }
        else {
            throw err;
        }
    }
}
exports.log = {
    disable,
    enable,
    isDebugEnabled,
    print,
    debug,
    info,
    warn,
    error,
    assert,
};
