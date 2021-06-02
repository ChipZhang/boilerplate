"use strict";
/* eslint-disable no-underscore-dangle */
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
exports.DefaultHTMLPlugin = exports.DebugHTMLPlugin = exports.DebugModulesChunksPlugin = void 0;
const _ = __importStar(require("lodash"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const pretty_1 = __importDefault(require("pretty"));
const utils_1 = require("../utils");
const config_1 = require("../cli/config");
class DebugModulesChunksPlugin {
    apply(compiler) {
        compiler.hooks.emit.tap(this.constructor.name, (compilation) => {
            const msg = 'Unexpected webpack API';
            function debugChunk(c) {
                var _a;
                if (c == null) {
                    return c;
                }
                utils_1.log.assert(c.constructor.name === 'Chunk', msg);
                let entry;
                if (c.hasEntryModule()) {
                    utils_1.log.assert(((_a = c.entryModule) === null || _a === void 0 ? void 0 : _a.constructor.name) === 'MultiModule', msg);
                    utils_1.log.assert(typeof c.entryModule.name === 'string', msg);
                    entry = c.entryModule.name;
                }
                return {
                    name: c.name,
                    id: c.id,
                    files: c.files,
                    entry,
                    chunkReason: c.chunkReason,
                };
            }
            function debugEntrypoint(ep) {
                utils_1.log.assert((ep === null || ep === void 0 ? void 0 : ep.constructor.name) === 'Entrypoint', msg);
                utils_1.log.assert(Array.isArray(ep.chunks), msg);
                return {
                    name: ep.name,
                    chunks: ep.chunks.map((c) => debugChunk(c)),
                    runtimeChunk: debugChunk(ep.runtimeChunk),
                };
            }
            function debugModule(m) {
                var _a, _b;
                utils_1.log.assert(m._chunks && typeof m._chunks[Symbol.iterator] === 'function', msg); // SortableSet
                return {
                    constructor: m.constructor.name,
                    name: m.name,
                    id: m.id,
                    type: m.type,
                    depth: m.depth,
                    source: (_a = m === null || m === void 0 ? void 0 : m._source) === null || _a === void 0 ? void 0 : _a._name,
                    sourceMap: (_b = m === null || m === void 0 ? void 0 : m.sourceMap) === null || _b === void 0 ? void 0 : _b.sources,
                    chunks: [...m._chunks].map((c) => debugChunk(c)),
                    issuerModule: m.issuer && { id: m.issuer.id, name: m.issuer.name },
                };
            }
            utils_1.log.debug(DebugModulesChunksPlugin.name, 'Entry points count:', [...compilation.entrypoints.values()].length);
            [...compilation.entrypoints.values()].forEach((ep, i) => utils_1.log.debug(DebugModulesChunksPlugin.name, 'Entry point:', i, debugEntrypoint(ep)));
            utils_1.log.debug(DebugModulesChunksPlugin.name, 'Chunks count:', compilation.chunks.length);
            compilation.chunks.map((c, i) => utils_1.log.debug(DebugModulesChunksPlugin.name, 'Chunk:', i, debugChunk(c)));
            utils_1.log.debug(DebugModulesChunksPlugin.name, 'Modules count:', compilation.modules.length);
            compilation.modules.map((m, i) => utils_1.log.debug(DebugModulesChunksPlugin.name, 'Module:', i, debugModule(m)));
        });
    }
}
exports.DebugModulesChunksPlugin = DebugModulesChunksPlugin;
class DebugHTMLPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {
            const title = (stage, outputName) => `${this.constructor.name} ${stage} ${outputName}`;
            html_webpack_plugin_1.default.getHooks(compilation).beforeAssetTagGeneration.tapAsync(this.constructor.name, (data, cb) => {
                const { assets, outputName, plugin, ...more } = data;
                utils_1.log.debug('%s\n%o\n%o\n%o', title('beforeAssetTagGeneration', outputName), { plugin }, { assets }, { more });
                cb(null, data);
            });
            html_webpack_plugin_1.default.getHooks(compilation).alterAssetTags.tapAsync(this.constructor.name, (data, cb) => {
                const { assetTags, outputName, ...more } = data;
                utils_1.log.debug('%s\n%o\n%o\n%o\n%o', title('alterAssetTags', outputName), { scriptTags: assetTags.scripts }, { styleTags: assetTags.styles }, { metaTags: assetTags.meta }, { more });
                cb(null, data);
            });
            html_webpack_plugin_1.default.getHooks(compilation).alterAssetTagGroups.tapAsync(this.constructor.name, (data, cb) => {
                const { headTags, bodyTags, outputName, ...more } = data;
                utils_1.log.debug('%s\n%o\n%o\n%o', title('alterAssetTagGroups', outputName), { headTags }, { bodyTags }, { more });
                cb(null, data);
            });
            html_webpack_plugin_1.default.getHooks(compilation).afterTemplateExecution.tapAsync(this.constructor.name, (data, cb) => {
                const { html, headTags, bodyTags, outputName, ...more } = data;
                utils_1.log.debug('%s\n%o\n%o\n%o\n%o', title('afterTemplateExecution', outputName), { html: `${html.substr(0, 64)}...` }, { headTags }, { bodyTags }, { more });
                cb(null, data);
            });
            html_webpack_plugin_1.default.getHooks(compilation).beforeEmit.tapAsync(this.constructor.name, (data, cb) => {
                const { html, outputName, ...more } = data;
                utils_1.log.debug('%s\n%o\n%o', title('beforeEmit', outputName), { html: `${html.substr(0, 64)}...` }, { more });
                cb(null, data);
            });
            html_webpack_plugin_1.default.getHooks(compilation).afterEmit.tapAsync(this.constructor.name, (data, cb) => {
                const { outputName, ...more } = data;
                utils_1.log.debug('%s\n%o', title('afterEmit', outputName), { more });
                cb(null, data);
            });
        });
    }
}
exports.DebugHTMLPlugin = DebugHTMLPlugin;
class DefaultHTMLPlugin {
    constructor(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    consoleLog, copyright, servingPrefix, beautify) {
        this.consoleLog = consoleLog;
        this.copyright = copyright;
        this.servingPrefix = servingPrefix;
        this.beautify = beautify;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {
            html_webpack_plugin_1.default.getHooks(compilation).alterAssetTags.tapAsync(this.constructor.name, (data, cb) => {
                const { meta } = data.assetTags;
                meta.unshift({ tagName: 'meta', voidTag: true, attributes: { charset: 'utf-8' } }, {
                    tagName: 'meta',
                    voidTag: true,
                    attributes: { 'http-equiv': 'Content-Type', 'content': 'text/html; charset=utf-8' },
                }, {
                    tagName: 'meta',
                    voidTag: true,
                    attributes: { 'http-equiv': 'X-UA-Compatible', 'content': 'ie=edge,chrome=1' },
                }, {
                    tagName: 'meta',
                    voidTag: true,
                    attributes: { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
                });
                cb(null, data);
            });
            html_webpack_plugin_1.default.getHooks(compilation).alterAssetTagGroups.tapAsync(this.constructor.name, (data, cb) => {
                var _a;
                const { headTags, bodyTags, plugin } = data;
                const options = (_a = plugin) === null || _a === void 0 ? void 0 : _a.options;
                utils_1.log.assert((options === null || options === void 0 ? void 0 : options.constructor) === Object, 'Changed `html-webpack-plugin` API');
                const { CONFIG } = options.templateParameters;
                const logoGenerated = options.logoGenerated;
                const appName = options.appName;
                const primaryColor = options.primaryColor;
                const js = `window.CONFIG = ${JSON.stringify(CONFIG)}
if (console) {
	if (console.table) {
		console.table(${JSON.stringify(this.consoleLog)})
	} else if (console.log) {
		console.log(${JSON.stringify(this.consoleLog)})
	}
}`;
                headTags.push({
                    tagName: 'title',
                    voidTag: false,
                    attributes: {},
                    innerHTML: _.escape(options.title),
                });
                // handle favicons manually rather than using `favicons-webpack-plugin`, which runs too slowly, also check `./scripts.js`
                headTags.push({
                    tagName: 'meta',
                    voidTag: true,
                    attributes: { name: 'theme-color', content: primaryColor },
                });
                if (logoGenerated) {
                    headTags.push({
                        tagName: 'link',
                        voidTag: true,
                        attributes: {
                            rel: 'shortcut icon',
                            href: config_1.logoConfig.icoFileURLPath(this.servingPrefix, appName),
                        },
                    }, ...config_1.logoConfig.faviconDimensions.map((dim) => ({
                        tagName: 'link',
                        voidTag: true,
                        attributes: {
                            rel: 'icon',
                            type: 'image/png',
                            sizes: `${dim}x${dim}`,
                            href: config_1.logoConfig.pngFileURLPath(this.servingPrefix, appName, dim),
                        },
                    })), ...config_1.logoConfig.appleIconDimensions.map((dim) => ({
                        tagName: 'link',
                        voidTag: true,
                        attributes: {
                            rel: 'apple-touch-icon',
                            sizes: `${dim}x${dim}`,
                            href: config_1.logoConfig.pngFileURLPath(this.servingPrefix, appName, dim),
                        },
                    })));
                }
                headTags.push({
                    tagName: 'script',
                    voidTag: false,
                    attributes: { type: 'text/javascript' },
                    innerHTML: js,
                });
                bodyTags.unshift({ tagName: 'div', voidTag: false, attributes: { id: 'app-root' } }, {
                    tagName: 'noscript',
                    voidTag: false,
                    attributes: { type: 'text/javascript' },
                    innerHTML: '<p>JavaScript 已被禁用</p>',
                });
                cb(null, data);
            });
            html_webpack_plugin_1.default.getHooks(compilation).beforeEmit.tapAsync(this.constructor.name, (data, cb) => {
                let cr = _.escape(this.copyright);
                if (cr.indexOf('\n') >= 0) {
                    cr = cr.replace(/^/gm, '  -- ');
                    cr = `\n${cr}\n`;
                }
                else {
                    cr = ` ${cr} `;
                }
                data.html = `<!--!${cr}-->\n${data.html}`;
                if (this.beautify) {
                    data.html = pretty_1.default(data.html);
                }
                cb(null, data);
            });
        });
    }
}
exports.DefaultHTMLPlugin = DefaultHTMLPlugin;
