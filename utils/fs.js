"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyDirRecursivelySync = exports.copyFileSync = exports.listDirSync = exports.testFileSync = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const log_1 = require("./log");
// if the path does not exist, it returns false
// for broken symlinks, it returns `symlink` as well
function testFileSync(p) {
    try {
        const stats = fs_1.default.lstatSync(p);
        if (stats.isDirectory()) {
            return 'directory';
        }
        if (stats.isFile()) {
            return 'file';
        }
        if (stats.isSymbolicLink()) {
            return 'symlink';
        }
        return 'others';
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return false;
        }
        throw err;
    }
}
exports.testFileSync = testFileSync;
// if the path is not a directory, returns undefined
// returned `file` has prefix `p`
function listDirSync(p) {
    if (testFileSync(p) !== 'directory') {
        return undefined;
    }
    const files = fs_1.default.readdirSync(p);
    return files
        .map((f) => {
        f = path_1.default.join(p, f);
        return { file: f, type: testFileSync(f) };
    })
        .filter(({ type }) => type !== false);
}
exports.listDirSync = listDirSync;
// if the source path is not a file, the program exits with errors
// the meta-data atime, mtime, mode of `dst` is synced with `src`
function copyFileSync(src, dst) {
    log_1.log.assert(testFileSync(src) === 'file', `\`${src}\` is not a file`);
    if (testFileSync(dst) === 'file') {
        fs_1.default.unlinkSync(dst);
    }
    fs_1.default.copyFileSync(src, dst);
    const stats = fs_1.default.statSync(src);
    const { mode } = stats;
    fs_1.default.chmodSync(dst, mode);
    fs_1.default.utimesSync(dst, stats.atime, stats.mtime);
}
exports.copyFileSync = copyFileSync;
// symlinks are ignored
function copyDirRecursivelySync(src, dst, ignore) {
    var _a;
    fs_1.default.mkdirSync(dst, { recursive: true });
    (_a = listDirSync(src)) === null || _a === void 0 ? void 0 : _a.forEach(({ file, type }) => {
        if (ignore.includes(file)) {
            return;
        }
        const d = path_1.default.join(dst, path_1.default.basename(file));
        switch (type) {
            case 'file':
                copyFileSync(file, d);
                break;
            case 'directory':
                copyDirRecursivelySync(file, d, ignore);
                break;
            default:
                log_1.log.warn(`Ignored \`${file}\` when copying \`${src}\` to \`${dst}\``);
        }
    });
}
exports.copyDirRecursivelySync = copyDirRecursivelySync;
