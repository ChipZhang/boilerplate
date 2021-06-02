"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoDir = exports.loadedStaticDir = exports.reportDir = exports.srcDir = exports.staticDir = exports.buildDir = exports.logoFolder = exports.loadedStaticFolder = exports.reportFolder = exports.srcFolder = exports.staticFolder = exports.buildFolder = exports.configFilePostCSS = exports.configFileBabel = exports.configFileWebpack = exports.configFileTypescriptReact = exports.configFileTypescriptNode = exports.configFile = exports.contentRoot = exports.contentRootFolder = exports.boilerplateJSON = exports.boilerplateRoot = exports.packageJSON = exports.packageRoot = exports.loadConfig = void 0;
const path_1 = __importDefault(require("path"));
const find_root_1 = __importDefault(require("find-root"));
const utils_1 = require("../utils");
// @ts-ignore: no type declarations
process.traceDeprecation = true;
function loadConfig(file) {
    let o;
    try {
        o = require(file); // eslint-disable-line global-require
        return o;
    }
    catch (err) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        utils_1.log.assert(false, `Failed to load file \`${file}\`: ${err}`);
        return undefined;
    }
}
exports.loadConfig = loadConfig;
exports.packageRoot = find_root_1.default(process.cwd());
exports.packageJSON = loadConfig(path_1.default.join(exports.packageRoot, 'package.json'));
exports.boilerplateRoot = find_root_1.default(__filename);
exports.boilerplateJSON = loadConfig(path_1.default.join(exports.boilerplateRoot, 'package.json'));
// look for environment variable `CONTENT_ROOT` first, then `contentRoot` key in `package.json` file
const contentRootConfig = process.env.CONTENT_ROOT != null ? process.env.CONTENT_ROOT : exports.packageJSON === null || exports.packageJSON === void 0 ? void 0 : exports.packageJSON.contentRoot;
exports.contentRootFolder = (typeof contentRootConfig === 'string' ? contentRootConfig : '')
    .replace(/[\\/]+/g, '/')
    .replace(/^\/|\/$/g, '')
    .replace(/\//g, path_1.default.sep);
exports.contentRoot = path_1.default.join(exports.packageRoot, exports.contentRootFolder);
exports.configFile = path_1.default.join(exports.contentRoot, 'config.js');
exports.configFileTypescriptNode = path_1.default.join(exports.contentRoot, 'tsconfig.node.json');
exports.configFileTypescriptReact = path_1.default.join(exports.contentRoot, 'tsconfig.json');
exports.configFileWebpack = path_1.default.join(exports.contentRoot, 'webpack.config.js');
exports.configFileBabel = path_1.default.join(exports.contentRoot, 'babel.config.js');
exports.configFilePostCSS = path_1.default.join(exports.contentRoot, 'postcss.config.js');
exports.buildFolder = 'build'; // relative to `contentRoot`
exports.staticFolder = 'static'; // relative to `contentRoot`
exports.srcFolder = 'src'; // relative to `contentRoot`
exports.reportFolder = 'report'; // relative to `buildDir`
exports.loadedStaticFolder = 'loaded'; // relative to `staticFolder`
exports.logoFolder = 'logo'; // relative to `staticFolder`
const buildDir = (mode) => path_1.default.join(exports.contentRoot, exports.buildFolder, mode);
exports.buildDir = buildDir;
exports.staticDir = path_1.default.join(exports.contentRoot, exports.staticFolder);
exports.srcDir = path_1.default.join(exports.contentRoot, exports.srcFolder);
const reportDir = (mode) => path_1.default.join(exports.buildDir(mode), exports.reportFolder);
exports.reportDir = reportDir;
exports.loadedStaticDir = path_1.default.join(exports.staticDir, exports.loadedStaticFolder);
exports.logoDir = path_1.default.join(exports.staticDir, exports.logoFolder);
