"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseApps = exports.checkEnv = exports.webConfig = exports.logoConfig = exports.pathConfig = void 0;
const _ = __importStar(require("lodash"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("@chipzhang/webpack-less-vars-loader/utils");
const utils_2 = require("../utils");
const path_2 = require("./path");
// region parse `config.js`
function invalidConfig(msg) {
    if (msg) {
        msg = `: ${msg}`;
    }
    return `Invalid configuration file \`${path_2.configFile}\`${msg}`;
}
function invalidConfigKey(key) {
    return invalidConfig(`Value for key \`${key}\` is invalid`);
}
function invalidConfigApp(app, key) {
    return invalidConfig(`Value for key \`${key}\` of app \`${app}\` is invalid`);
}
function invalidConfigPage(app, key) {
    return invalidConfig(`Value for key \`${key}\` of page of app \`${app}\` is invalid`);
}
function getStringConfig(value, defaultValue, check, message) {
    if (value === undefined) {
        value = defaultValue;
    }
    utils_2.log.assert(typeof value === 'string' && check(value), message);
    return value;
}
function getObjectConfig(value, defaultValue, check, message) {
    if (value === undefined) {
        value = defaultValue;
    }
    utils_2.log.assert((value === null || value === void 0 ? void 0 : value.constructor) === Object && check(value), message);
    return value;
}
function getAnyArrayConfig(value, defaultValue, check, message) {
    if (value === undefined) {
        value = defaultValue;
    }
    utils_2.log.assert(Array.isArray(value) && check(value), message);
    return value;
}
function getStringArrayConfig(value, defaultValue, check, message) {
    if (value === undefined) {
        value = defaultValue;
    }
    utils_2.log.assert(Array.isArray(value) && value.every((v) => typeof v === 'string') && check(value), message);
    return value;
}
const config = path_2.loadConfig(path_2.configFile);
utils_2.log.assert((config === null || config === void 0 ? void 0 : config.constructor) === Object, invalidConfig(''));
const prefix = getStringConfig(config.prefix, '/', (prefix) => prefix.startsWith('/') && prefix.endsWith('/'), invalidConfigKey('prefix'));
const additionalSourcePaths = getStringArrayConfig(config.additionalSourcePaths, [], () => true, invalidConfigKey('additionalSourcePaths'));
const copyright = getStringConfig(config.copyright, `© ${new Date().getFullYear()}`, (copyright) => copyright !== '', invalidConfigKey('copyright'));
const scriptAttribs = getObjectConfig(config.scriptAttribs, {}, (scriptAttribs) => Object.values(scriptAttribs).every((v) => typeof v === 'string' || typeof v === 'boolean'), invalidConfigKey('apps'));
const styleAttribs = getObjectConfig(config.styleAttribs, {}, (styleAttribs) => Object.values(styleAttribs).every((v) => typeof v === 'string' || typeof v === 'boolean'), invalidConfigKey('apps'));
const appsConfig = getAnyArrayConfig(config.apps, undefined, (apps) => apps.length > 0, invalidConfigKey('apps'));
// endregion
// region exporting configs
exports.pathConfig = {
    packageRoot: path_2.packageRoot,
    packageJSON: path_2.packageJSON,
    boilerplateRoot: path_2.boilerplateRoot,
    boilerplateJSON: path_2.boilerplateJSON,
    contentRootFolder: path_2.contentRootFolder,
    contentRoot: path_2.contentRoot,
    buildDir: path_2.buildDir,
    staticDir: path_2.staticDir,
    srcPaths: [path_2.srcDir, ...additionalSourcePaths],
    polyfill: path_1.default.join(path_2.srcDir, 'polyfill'),
    reportFolder: path_2.reportFolder,
    reportDir: path_2.reportDir,
    loadedStaticFolder: path_2.loadedStaticFolder,
    loadedStaticDir: path_2.loadedStaticDir,
    configFileTypescriptReact: path_2.configFileTypescriptReact,
    configFileBabel: path_2.configFileBabel,
    configFilePostCSS: path_2.configFilePostCSS,
};
utils_2.log.debug('pathConfig:', {
    packageRoot: exports.pathConfig.packageRoot,
    boilerplateRoot: exports.pathConfig.boilerplateRoot,
    contentRoot: exports.pathConfig.contentRoot,
    buildDir: exports.pathConfig.buildDir('<mode>'),
    staticDir: exports.pathConfig.staticDir,
    srcPaths: exports.pathConfig.srcPaths,
    polyfill: exports.pathConfig.polyfill,
    reportDir: exports.pathConfig.reportDir('<mode>'),
});
const faviconDimensions = [16, 32, 48];
const appleIconDimensions = [57, 60, 72, 76, 114, 120, 144, 152, 167, 180, 1024];
const allDimensions = _.uniq(_.concat(faviconDimensions, appleIconDimensions));
exports.logoConfig = {
    faviconDimensions,
    appleIconDimensions,
    allDimensions,
    templateSVGFile: path_1.default.join(path_2.srcDir, 'logo.svg'),
    outputDir(app) {
        return path_1.default.join(path_2.logoDir, app);
    },
    svgFile(app) {
        return path_1.default.join(path_2.logoDir, app, 'logo.svg');
    },
    pngFile(app, dimension) {
        return path_1.default.join(path_2.logoDir, app, `logo-${dimension}.png`);
    },
    icoFile(app) {
        return path_1.default.join(path_2.logoDir, app, 'logo.ico');
    },
    svgFileURLPath(servingPrefix, app) {
        return `${servingPrefix}${path_2.logoFolder}/${app}/logo.svg`;
    },
    pngFileURLPath(servingPrefix, app, dimension) {
        return `${servingPrefix}${path_2.logoFolder}/${app}/logo-${dimension}.png`;
    },
    icoFileURLPath(servingPrefix, app) {
        return `${servingPrefix}${path_2.logoFolder}/${app}/logo.ico`;
    },
};
utils_2.log.debug('logoConfig:', {
    faviconDimensions: exports.logoConfig.faviconDimensions,
    appleIconDimensions: exports.logoConfig.appleIconDimensions,
    allDimensions: exports.logoConfig.allDimensions,
    templateSVGFile: exports.logoConfig.templateSVGFile,
    outputDir: exports.logoConfig.outputDir('<app>'),
    svgFile: exports.logoConfig.svgFile('<app>'),
    pngFile: exports.logoConfig.pngFile('<app>', 32),
    icoFile: exports.logoConfig.icoFile('<app>'),
    svgFileURLPath: exports.logoConfig.svgFileURLPath(prefix, '<app>'),
    pngFileURLPath: exports.logoConfig.pngFileURLPath(prefix, '<app>', 32),
    icoFileURLPath: exports.logoConfig.icoFileURLPath(prefix, '<app>'),
});
exports.webConfig = {
    defaultHost: 'localhost',
    defaultPort: 14339,
    defaultAPI: 'http://localhost:14338',
    prefix,
    copyright,
    scriptAttribs,
    styleAttribs,
    templateHTMLFile: path_1.default.join(path_2.srcDir, 'html.ejs'),
};
utils_2.log.debug('webConfig:', exports.webConfig);
function checkEnv(expectedNodeEnv) {
    function c(key) {
        utils_2.log.assert(process.env[key] === undefined || process.env[key] === expectedNodeEnv, `Invalid environment \`${key}\`, should be \`${expectedNodeEnv}\` or unset`);
    }
    c('NODE_ENV');
    c('BABEL_ENV'); // if `BABEL_ENV` is not set, it defaults to `NODE_ENV`
    c('BROWSERSLIST_ENV'); // if `BROWSERSLIST_ENV` is not set, it defaults to `NODE_ENV`
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = expectedNodeEnv;
    }
}
exports.checkEnv = checkEnv;
function validateLessVars(camelCase) {
    const kebabCase = {};
    Object.entries(camelCase).forEach(([k, v]) => {
        utils_2.log.assert(utils_1.isCamelCase(k), invalidConfigKey('lessVars'));
        kebabCase[utils_1.camelCaseToKebabCase(k)] = v;
    });
    return kebabCase;
}
function parseApps(appNames) {
    const parsedApps = [];
    appsConfig.forEach((appConfig) => {
        utils_2.log.assert((appConfig === null || appConfig === void 0 ? void 0 : appConfig.constructor) === Object, invalidConfig('apps'));
        const name = getStringConfig(appConfig.name, undefined, (name) => !!name.match(/^[a-z0-9_-]+$/) && !name.match(/^[0-9]+$/), invalidConfig(`\`name\` is invalid for one of the elements of \`apps\``));
        const primaryColor = getStringConfig(appConfig.primaryColor, undefined, (primaryColor) => utils_2.isValidColor(primaryColor), invalidConfigApp(name, 'primaryColor'));
        let secondaryColor = getStringConfig(appConfig.secondaryColor, 'auto', (secondaryColor) => utils_2.isValidColor(secondaryColor) || secondaryColor === 'auto', invalidConfigKey('secondaryColor'));
        if (secondaryColor === 'auto') {
            secondaryColor = utils_2.invertColor(primaryColor);
        }
        const configVars = getObjectConfig(appConfig.configVars, {}, (configVars) => Object.values(configVars).every((v) => v == null ||
            typeof v === 'boolean' ||
            typeof v === 'number' ||
            typeof v === 'string' ||
            (v === null || v === void 0 ? void 0 : v.constructor) === Object), invalidConfigKey('configVars'));
        let lessVars = getObjectConfig(appConfig.lessVars, {}, (lessVars) => Object.values(lessVars).every((v) => typeof v === 'string'), invalidConfigKey('lessVars'));
        lessVars = validateLessVars(lessVars);
        const pages = getAnyArrayConfig(appConfig.pages, undefined, (pages) => pages.length > 0, invalidConfigKey('pages'));
        const app = {
            name,
            primaryColor,
            secondaryColor,
            configVars,
            lessVars,
            pages: [],
        };
        parsedApps.push(app);
        pages.forEach((p) => {
            utils_2.log.assert((p === null || p === void 0 ? void 0 : p.constructor) === Object, invalidConfig('p'));
            const title = getStringConfig(p.title, undefined, (title) => title !== '', invalidConfigPage(name, 'title'));
            const html = getStringConfig(p.html, undefined, (entry) => !!entry.match(/^[a-z0-9_/-]+\.html$/), invalidConfigPage(name, 'html'));
            let source = getStringConfig(p.source, undefined, (source) => source !== '', invalidConfigPage(name, 'source'));
            source = path_1.default.join(path_2.srcDir, source);
            app.pages.push({
                app,
                title,
                html,
                asset: html.replace(/\.html$/, '').replace(/\//g, '.'),
                source,
            });
        });
    });
    const allApps = parsedApps.map((app) => app.name);
    const allPages = parsedApps.map((app) => app.pages).flat();
    const allHTML = allPages.map((p) => p.html);
    utils_2.log.assert(allApps.length === _.uniq(allApps).length, invalidConfig('Duplicated app names'));
    utils_2.log.assert(allHTML.length === _.uniq(allHTML).length, invalidConfig('Duplicated page HTML'));
    if (appNames == null) {
        appNames = '';
    }
    else if (Array.isArray(appNames)) {
        appNames = appNames.join(',');
    }
    appNames = appNames.split(',');
    appNames = _.uniq(appNames.map((name) => name.trim()).filter((entry) => entry !== ''));
    if (appNames.length === 0) {
        return parsedApps;
    }
    let filtered = [];
    appNames.forEach((n) => {
        const f = parsedApps.filter((app) => app.name === n);
        utils_2.log.assert(f.length > 0, invalidConfig(`App \`${n}\` is not defined`));
        filtered = filtered.concat(f);
    });
    return filtered;
}
exports.parseApps = parseApps;
utils_2.log.debug('pages:', parseApps(null));
// endregion
