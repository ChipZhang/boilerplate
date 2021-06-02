#!/usr/bin/env node
"use strict";
/**
 * | command     | `NODE_ENV`  | `BABEL_ENV` |
 * | ---         | ---         | ---         |
 * | development | development | development |
 * | serving     | production  | production  |
 * | production  | production  | production  |
 * | public      | production  | production  |
 * | logo        |             |             |
 *
 * ways to invoke:
 *
 * - `node <this-script-file> <command> [options] [--] [<app1[.app2]>]] [<app3[.app4]>]]...`
 *
 * - `npx <bin-name> <command> [options] [--] [<app1[.app2]>]] [<app3[.app4]>]]...`
 * (`<bin-name>` is specified in `bin` section in `package.json` of this package, this script file will be symlinked in `node_modules/.bin` when installed)
 *
 * - `npm run <command> -- [options] [--] [<app1[.app2]>]] [<app3[.app4]>]]...`
 * (if `<command>` is specified in `scripts` section in `package.json`; `--` followed by `<command>` is required)
 *
 * - directly invoke `<webpack|webpack-dev-server> [--config <`webpack.config.js` file>] --env.mode <mode> [--host <host>] [--port <port>] [--env.api <url>] [<--env.apps> <app1[.app2]> [<--env.apps> <app3[.app4]>]...]`
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = __importDefault(require("child_process"));
const semver_1 = __importDefault(require("semver"));
const yargs_1 = __importDefault(require("yargs"));
const utils_1 = require("../utils");
const config_1 = require("./config");
const get_webpack_config_1 = require("../webpack/get-webpack-config");
const webpack_run_1 = require("../webpack/webpack-run");
function runWebpack(mode, argv, apps) {
    const config = get_webpack_config_1.getWebpackConfig({ mode, apps, api: argv.api }, { $0: '<internal>', host: argv.host, port: argv.port });
    webpack_run_1.runWebpackConfig(config);
}
// disable stdin, inherit stderr handler from parent, return stdout
function exec(exe, args) {
    utils_1.log.debug(`Running \`${exe}\` with args:`, args);
    try {
        const stdout = child_process_1.default.execFileSync(exe, args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'inherit'] });
        return { code: 0, stdout: stdout || '' };
    }
    catch (err) {
        return { code: err.status, stdout: undefined };
    }
}
// generate the logos manually using Inkscape and ImageMagick rather than using `favicons-webpack-plugin`, which runs too slowly
function runLogo(appNames) {
    var _a, _b;
    const apps = config_1.parseApps(appNames);
    const content = fs_1.default.readFileSync(config_1.logoConfig.templateSVGFile, { encoding: 'utf-8' });
    const inkExe = process.platform === 'win32' ? 'inkscape.com' : 'inkscape';
    let inkV = 0;
    const inkM = (_a = exec(inkExe, ['--version']).stdout) === null || _a === void 0 ? void 0 : _a.match(/\d+\.\d+/);
    if (inkM && inkM[0]) {
        inkV = Number.parseFloat(inkM[0]);
    }
    utils_1.log.assert(inkV > 0, `\`${inkExe}\` not found`);
    utils_1.log.info(`Inkscape version`, inkV);
    const imgExe = 'convert';
    let imgV = 0;
    const imgM = (_b = exec(imgExe, ['--version']).stdout) === null || _b === void 0 ? void 0 : _b.match(/\d+\.\d+/);
    if (imgM && imgM[0]) {
        imgV = Number.parseFloat(imgM[0]);
    }
    utils_1.log.assert(imgV >= 6, `\`${imgExe}\` v6+ not found`);
    utils_1.log.info(`ImageMagic version`, imgV);
    apps.forEach((app) => {
        const svgFile = config_1.logoConfig.svgFile(app.name);
        utils_1.log.info(`Generating logos for app \`${app.name}\``);
        utils_1.log.info(`Generating \`${svgFile}\` from template SVG file \`${config_1.logoConfig.templateSVGFile}\``);
        utils_1.log.debug(`Replacing \`#000000\` with \`${app.primaryColor}\`, \`#ffffff\` with \`${app.secondaryColor}\``);
        const newContent = content.replace(/#000000\b/gm, app.primaryColor).replace(/#ffffff\b/gm, app.secondaryColor); // used to use `simple-svg-tools`, but not so good
        fs_1.default.mkdirSync(config_1.logoConfig.outputDir(app.name), { recursive: true });
        fs_1.default.writeFileSync(svgFile, newContent, { encoding: 'utf-8' });
        config_1.logoConfig.allDimensions.forEach((dim) => {
            const pngFile = config_1.logoConfig.pngFile(app.name, dim);
            const inkArgs = [
                ...(inkV < 1 ? ['--without-gui', '--export-png'] : ['--export-filename']),
                pngFile,
                '-w',
                dim.toString(),
                '-h',
                dim.toString(),
                svgFile,
            ];
            utils_1.log.info(`Converting \`${svgFile}\` to \`${pngFile}\``);
            utils_1.log.assert(exec(inkExe, inkArgs).code === 0, `Command failed!`);
        });
        const pngFiles = config_1.logoConfig.faviconDimensions.map((dim) => config_1.logoConfig.pngFile(app.name, dim));
        const icoFile = config_1.logoConfig.icoFile(app.name);
        const imgArgs = [...pngFiles, icoFile];
        utils_1.log.info(`Generating multi-page ICO file \`${icoFile}\``);
        utils_1.log.assert(exec(imgExe, imgArgs).code === 0, `Command failed!`);
    });
}
function run() {
    var _a, _b;
    const currentV = process.versions.node;
    const targetV = (_b = (_a = config_1.pathConfig.boilerplateJSON) === null || _a === void 0 ? void 0 : _a.engines) === null || _b === void 0 ? void 0 : _b.node;
    if (targetV) {
        utils_1.log.assert(semver_1.default.satisfies(currentV, targetV), 
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Node version \`${targetV}\` required`);
    }
    const { argv } = yargs_1.default
        .wrap(Math.min(150, yargs_1.default.terminalWidth()))
        .parserConfiguration({ 'parse-numbers': false })
        .usage(`Usage: $0 <command> [options]...
Usage: $0 development|serving|production|public [options] [--] [app] [app] [app]...
Usage: $0 logo [--] [app] [app] [app]...
(Check file \`${__filename}\` for more details)`)
        .command('development', '`development` mode')
        .command('serving', '`serving` mode')
        .command('production', '`production` mode')
        .command('public', '`public` mode')
        .command('logo', "Build logo (require Inkscape and ImageMagick's `convert` be in $PATH)")
        .describe('host', 'Binding host for `webpack-dev-server`')
        .describe('port', 'Binding port for `webpack-dev-server`')
        .describe('api', 'API URL prefix, will be available as global variable `CONFIG.api` in generated HTML')
        .number(['port'])
        .default('host', config_1.webConfig.defaultHost)
        .default('port', config_1.webConfig.defaultPort)
        .default('api', config_1.webConfig.defaultAPI)
        .help('help')
        .alias('host', 'b')
        .alias('port', 'p')
        .alias('api', 'i')
        .alias('help', 'h');
    const argvDash = argv._.map((f) => String(f));
    const [command, ...files] = argvDash;
    switch (command) {
        case 'development':
        case 'serving':
        case 'production':
        case 'public':
            runWebpack(command, argv, files);
            break;
        case 'logo':
            runLogo(files);
            break;
        default:
            utils_1.log.assert(false, command ? `Invalid command \`${command}\`` : 'Command not specified');
            break;
    }
}
run();
