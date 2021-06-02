"use strict";
/**
 * | mode of code | `NODE_ENV` & `BABEL_ENV`  | `webpack` or `webpack-dev-server` | minimized | source map | error overlay[^1] | SRI | hashing | React profiling | reports | live update | caching[^2] |
 * | ---          | ---                       | ---                               | ---       | ---        | ---               | --- | ---     | ---             | ---     | ---         | ---         |
 * | development  | development               | `webpack-dev-server`              | n         | y          | y                 | n   | n       | n               | n       | HMR         | y           |
 * | serving      | production                | `webpack-dev-server`              | n         | y          | n                 | n   | n       | y               | n       | HMR         | y           |
 * | production   | production                | `webpack`                         | n         | y          | n                 | y   | y       | y               | n       | n           | n           |
 * | public       | production                | `webpack`                         | y         | n          | n                 | y   | y       | n               | y       | n           | n           |
 *
 * [^1]: only specific for `error-overlay-webpack-plugin` (which is only working in NODE's development mode),
 * `webpack-dev-server`'s overlay are always enabled when serving
 *
 * [^2]: currently only `babel-loader`, `terser-webpack-plugin`, `css-minimizer-webpack-plugin` supports caching option
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const webpack_1 = __importDefault(require("webpack"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const webpack_subresource_integrity_1 = __importDefault(require("webpack-subresource-integrity"));
const mini_css_extract_plugin_1 = __importDefault(require("mini-css-extract-plugin"));
const css_minimizer_webpack_plugin_1 = __importDefault(require("css-minimizer-webpack-plugin"));
const terser_webpack_plugin_1 = __importDefault(require("terser-webpack-plugin"));
// @ts-ignore: no type declarations
const error_overlay_webpack_plugin_1 = __importDefault(require("error-overlay-webpack-plugin"));
const clean_webpack_plugin_1 = require("clean-webpack-plugin");
const copy_webpack_plugin_1 = __importDefault(require("copy-webpack-plugin"));
const webpack_bundle_analyzer_1 = require("webpack-bundle-analyzer");
const webpack_asset_attributes_plugin_1 = require("@chipzhang/webpack-asset-attributes-plugin");
const utils_1 = require("../utils");
const config_1 = require("../cli/config");
const webpack_plugins_1 = require("./webpack-plugins");
const tsLoaderFile = require.resolve('ts-loader');
const babelLoaderFile = require.resolve('babel-loader');
const postcssLoaderFile = require.resolve('postcss-loader');
const cssLoaderFile = require.resolve('css-loader');
const lessLoaderFile = require.resolve('less-loader');
const lessVarsLoaderFile = require.resolve('@chipzhang/webpack-less-vars-loader');
const svgLoaderFile = require.resolve('@svgr/webpack');
const fileLoaderFile = require.resolve('file-loader');
const rawLoaderFile = require.resolve('raw-loader');
const fileExtensionsWeb = ['.tsx', '.ts', '.jsx', '.js', '.json'];
/**
 * @param {object} env reflects what is passed to `webpack` with argument `--env`
 * @param {object} argv reflects the command line passed to `webpack`
 */
function webpackConfigFunc(env, argv) {
    // region check for parameters and environment
    var _a;
    utils_1.log.assert((env === null || env === void 0 ? void 0 : env.constructor) === Object, 'Unexpected value for `env`');
    utils_1.log.assert((argv === null || argv === void 0 ? void 0 : argv.constructor) === Object, 'Unexpected value for `argv');
    utils_1.log.debug('env & argv:', { env, argv });
    let argv$0 = argv.$0;
    let argvHost = argv.host;
    let argvPort = argv.port;
    let envMode = env.mode;
    let envApi = env.api;
    const envApps = env.apps;
    // assume default values for `$0`, `mode`, useful for tools depending on `webpack.config.js`
    if (argv$0 == null) {
        argv$0 = 'node';
    }
    if (argvHost == null) {
        argvHost = config_1.webConfig.defaultHost;
    }
    if (argvPort == null) {
        argvPort = config_1.webConfig.defaultPort;
    }
    if (envMode == null) {
        envMode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    }
    if (envApi == null) {
        envApi = config_1.webConfig.defaultAPI;
    }
    utils_1.log.assert(typeof argv$0 === 'string', 'Unexpected value for `$0`');
    utils_1.log.assert(typeof argvHost === 'string', 'Unexpected value for `--host`');
    utils_1.log.assert(typeof argvPort === 'number', 'Unexpected value for `--port`');
    utils_1.log.assert(typeof envMode === 'string', 'Unexpected value for `--env.mode`');
    utils_1.log.assert(typeof envApi === 'string', 'Unexpected value for `--env.api`');
    utils_1.log.assert(envApps == null ||
        typeof envApps === 'string' ||
        (Array.isArray(envApps) && envApps.every((a) => typeof a === 'string')), 'Unexpected value for `--env.apps`');
    const $0 = argv$0;
    const host = argvHost;
    const port = argvPort;
    const mode = envMode;
    const api = envApi;
    const appNames = envApps;
    const $0Title = path_1.default.basename($0).split('.')[0];
    let logDisabled = false;
    // disable logging when not using `webpack`, i.e. when using tools depending on `webpack.config.js`
    if ($0Title !== '<internal>' && $0Title !== 'webpack' && $0Title !== 'webpack-dev-server') {
        logDisabled = true;
        utils_1.log.disable();
    }
    utils_1.log.info('Mode:', mode);
    utils_1.log.debug('Parameters:', { $0, host, port, mode, api, apps: appNames });
    let nodeEnv;
    let isModeDevelopment = false;
    let isModeServing = false;
    let isModeProduction = false;
    let isModePublic = false;
    switch (mode) {
        case 'development':
            nodeEnv = 'development';
            isModeDevelopment = true;
            break;
        case 'serving':
            nodeEnv = 'production';
            isModeServing = true;
            break;
        case 'production':
            nodeEnv = 'production';
            isModeProduction = true;
            break;
        case 'public':
            nodeEnv = 'production';
            isModePublic = true;
            break;
        default:
            utils_1.log.assert(false, mode ? `Invalid mode \`${mode}\`` : 'Mode not specified');
            return {};
    }
    const enableServing = isModeDevelopment || isModeServing;
    // only specific for files in source directories; check above
    const enableMinify = isModePublic;
    const enableSourceMap = isModeDevelopment || isModeServing || isModeProduction;
    // only specific for `error-overlay-webpack-plugin`; check above
    const enableErrorOverlay = isModeDevelopment;
    const enableSRI = isModeProduction || isModePublic;
    const enableHashing = isModeProduction || isModePublic;
    const enableReactProfiling = isModeServing || isModeProduction;
    const enableReports = isModePublic;
    // `hmr` or `fullRefresh` or false
    const enableLiveUpdating = isModeDevelopment || isModeServing ? 'hmr' : false;
    // currently only `babel-loader`, `terser-webpack-plugin`, `css-minimizer-webpack-plugin` supports caching option; check above
    const enableCaching = isModeDevelopment || isModeServing;
    const enableVersionTextInTitle = isModeDevelopment || isModeServing;
    config_1.checkEnv(nodeEnv);
    if (enableServing) {
        utils_1.log.assert($0Title !== 'webpack', 'Should run `webpack-dev-server` for this mode');
    }
    else {
        utils_1.log.assert($0Title !== 'webpack-dev-server', 'Should run `webpack` for this mode');
    }
    const apps = config_1.parseApps(appNames);
    const pages = apps.map((a) => a.pages).flat();
    utils_1.log.info(`Building apps: ${apps.map((a) => a.name).join(', ')}`);
    utils_1.log.info(`Including pages: ${pages.map((p) => p.source).join(', ')}`);
    // endregion
    // region configurations, files and directories
    const built = ((d) => {
        const p = (v) => (v < 10 ? `0${v}` : v.toString());
        let tzh = d.getTimezoneOffset() * -1;
        const tzs = tzh < 0 ? '-' : '+';
        tzh = Math.abs(tzh);
        const tzm = tzh % 60;
        tzh = (tzh - tzm) / 60;
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ${tzs}${p(tzh)}${p(tzm)}`;
    })(new Date());
    let version = '0.0.0';
    if (typeof ((_a = config_1.pathConfig.packageJSON) === null || _a === void 0 ? void 0 : _a.version) === 'string') {
        version = config_1.pathConfig.packageJSON.version;
    }
    const { copyright } = config_1.webConfig;
    const servingPrefix = enableServing ? '/' : config_1.webConfig.prefix;
    const watchWait = 2000;
    const hashFunction = 'md5';
    const hashDigest = 'hex';
    const hashDigestLength = 6;
    const buildDir = config_1.pathConfig.buildDir(mode);
    const { contentRoot, reportFolder, staticDir, loadedStaticFolder, loadedStaticDir, srcPaths, polyfill } = config_1.pathConfig;
    const { configFileTypescriptReact, configFileBabel, configFilePostCSS } = config_1.pathConfig;
    const filenameHTML = (p) => path_1.default.join(...p.html.split('/'));
    // use POSIX path to keep the chunk ID the same across different OS-es
    const filenameJS = path_1.default.posix.join('js', !enableHashing ? '[name].js' : '[name]-[contenthash].js');
    const filenameChunkJS = path_1.default.posix.join('js-chunk', !enableHashing ? '[name].js' : '[name]-[contenthash].js');
    const filenameCSS = path_1.default.posix.join('css', !enableHashing ? '[name].css' : '[name]-[contenthash].css');
    const filenameChunkCSS = path_1.default.posix.join('css-chunk', !enableHashing ? '[name].css' : '[name]-[contenthash].css');
    const filenameStatsOutput = path_1.default.join(reportFolder, 'stats.json');
    const filenameBundleAnalyzerOutput = path_1.default.join(reportFolder, 'bundle-analyzer.html');
    // endregion
    // region plugins
    const plugins = [
        // some package may rely on this variable `NODE_ENV`
        // this plugin uses pure string replacement rather than creating a global variable
        new webpack_1.default.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(nodeEnv),
        }),
        new webpack_1.default.BannerPlugin(copyright),
        new mini_css_extract_plugin_1.default({
            filename: filenameCSS,
            chunkFilename: filenameChunkCSS,
        }),
    ];
    if (enableErrorOverlay) {
        plugins.push(new error_overlay_webpack_plugin_1.default());
    }
    if (enableSRI) {
        // adds SRI check to the assets inserted by `html-webpack-plugin`
        // need to configure HTTP server to add response header `Cache-Control: no-transform` to avoid modifications made by a proxy (e.g. Chrome Data Saver)
        plugins.push(new webpack_subresource_integrity_1.default({ hashFuncNames: ['sha256'] }));
    }
    if (enableHashing) {
        // make module id stable, used for hashed filenames
        plugins.push(new webpack_1.default.HashedModuleIdsPlugin({
            hashFunction,
            hashDigest,
            hashDigestLength,
        }));
        // make chunk id stable, used for hashed filenames, code from [](https://github.com/webpack/webpack/issues/4837#issuecomment-397545259), or use [](https://github.com/hxlniada/webpack-hashed-chunkids/blob/master/index.js)
        // this plugin may break HMR, so do not use it for development mode
        plugins.push(new webpack_1.default.NamedChunksPlugin((() => {
            const used = new Set();
            return (chunk) => {
                const moduleIDs = chunk
                    .getModules()
                    .map((m) => m.id)
                    .sort()
                    .join(';');
                const hash = crypto_1.default.createHash(hashFunction);
                hash.update(moduleIDs);
                const hashResult = hash.digest(hashDigest);
                let len = hashDigestLength;
                let result;
                do {
                    if (len > hashResult.length) {
                        throw new Error();
                    }
                    result = hashResult.substr(0, len);
                    len += 1;
                } while (used.has(result));
                used.add(result);
                return result;
            };
        })()));
    }
    if (enableLiveUpdating === 'hmr') {
        // this plugin must be explicitly specified to enable HMR when using `webpack` node API
        plugins.push(new webpack_1.default.HotModuleReplacementPlugin());
    }
    // rather than using `filemanager-webpack-plugin`, which has vulnerable dependencies
    if (!enableServing) {
        plugins.push(new clean_webpack_plugin_1.CleanWebpackPlugin()); // clean the output folder first
        if (fs_1.default.existsSync(staticDir)) {
            plugins.push(new copy_webpack_plugin_1.default({
                patterns: [
                    {
                        from: staticDir,
                        // ignore sub-folder `loaded`, files in this folder will be loaded by `file-loader` or `raw-loader`,
                        // and will be automatically emitted or injected, thus no need of manual copying
                        filter: (path) => 
                        // on Windows, `path` contains backslashes
                        !path.replace(/\\/g, '/').startsWith(loadedStaticDir.replace(/\\/g, '/')),
                        // do not overwrite files generated by other plugins (files already in `compilation.assets`)
                        // but will overwrite previously copied files
                        force: false,
                    },
                ],
            }));
        }
    }
    if (enableReports) {
        plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin({
            openAnalyzer: false,
            analyzerMode: 'static',
            defaultSizes: 'gzip',
            generateStatsFile: true,
            statsFilename: filenameStatsOutput,
            reportFilename: filenameBundleAnalyzerOutput,
        }));
        try {
            // eslint-disable-next-line global-require, node/no-missing-require, @typescript-eslint/no-var-requires
            const BundleStatsPlugin = require('bundle-stats-webpack-plugin').BundleStatsWebpackPlugin;
            plugins.push(
            // @ts-ignore: wrong type declaration, method `apply` not defined
            new BundleStatsPlugin({
                compare: false,
                outDir: reportFolder,
            }));
        }
        catch (e) {
            if (e.code !== 'MODULE_NOT_FOUND') {
                throw e;
            }
            utils_1.log.warn(`Optional dependency \`bundle-stats-webpack-plugin\` (v2 or v3) not installed, skipping it`);
        }
    }
    // as per [](https://github.com/jantimon/html-webpack-plugin):
    // > If you have plugins that make use of it, html-webpack-plugin should be ordered first before any of the integrated plugins.
    const templateHTML = fs_1.default.existsSync(config_1.webConfig.templateHTMLFile)
        ? config_1.webConfig.templateHTMLFile
        : require.resolve('./html.ejs');
    pages.forEach((p) => {
        const title = enableVersionTextInTitle ? `${p.title} (${mode}, ${version}, ${built})` : p.title;
        const logoFile = config_1.logoConfig.svgFile(p.app.name);
        const logoGenerated = fs_1.default.existsSync(logoFile);
        if (!logoGenerated) {
            utils_1.log.warn(`Logo not generated yet for app \`${p.app.name}\``);
        }
        plugins.push(new html_webpack_plugin_1.default({
            title,
            template: templateHTML,
            filename: filenameHTML(p),
            inject: true,
            hash: false,
            chunks: [p.asset],
            meta: {},
            minify: enableMinify
                ? {
                    // `html-webpack-plugin` uses `html-minifier-terser` to minify HTML
                    html5: true,
                    collapseWhitespace: true,
                    removeComments: true,
                    keepClosingSlash: true,
                    ignoreCustomComments: [/^!/],
                    quoteCharacter: '"',
                    minifyCSS: true,
                    minifyJS: true, // `html-minifier-terser` uses `clean-css` to minify CSS in the HTML
                }
                : false,
            // custom parameters available in the template HTML file
            templateParameters: {
                // will be used by `DefaultHTMLPlugin`, which will insert a inline script tag,
                // to create a global configuration variable `window.CONFIG`
                // why not use `webpack.DefinePlugin`:
                // this plugin uses pure string replacement, and does not support different variables per entry
                // why not use `webpack-inject-plugin` or similar:
                // the JS file changes everytime when the configuration changes, especially when re-building, as the version string changes
                CONFIG: {
                    mode,
                    isModeDevelopment,
                    isModeServing,
                    isModeProduction,
                    isModePublic,
                    version,
                    built,
                    enableErrorOverlay,
                    api,
                    prefix: servingPrefix,
                    copyright,
                    app: p.app.name,
                    title,
                    primaryColor: p.app.primaryColor,
                    secondaryColor: p.app.secondaryColor,
                    ...p.app.configVars,
                },
            },
            // used by `DefaultHTMLPlugin`
            logoGenerated,
            // if passing `p` or `p.app` directly here, it results in `Maximum call stack size exceeded` when running ESLint
            appName: p.app.name,
            primaryColor: p.app.primaryColor,
        }));
    });
    plugins.push(new webpack_plugins_1.DefaultHTMLPlugin({ mode, version, built }, copyright, servingPrefix, !enableMinify));
    plugins.push(new webpack_asset_attributes_plugin_1.AssetAttributesPlugin({
        scriptAttribs: config_1.webConfig.scriptAttribs,
        styleAttribs: config_1.webConfig.styleAttribs,
    }));
    if (utils_1.log.isDebugEnabled()) {
        plugins.push(new webpack_plugins_1.DebugModulesChunksPlugin());
        plugins.push(new webpack_plugins_1.DebugHTMLPlugin());
    }
    utils_1.log.info('Plugins:', plugins.map((plugin) => plugin.constructor.name).join(', '));
    utils_1.log.debug('plugins:', plugins);
    // endregion
    // region loaders
    const svgLoader = {
        loader: svgLoaderFile,
        // options other than `babel` will be passed to `@svgr/core`, despite its docs
        // for `@svgr/webpack` loader options, check [link](https://github.com/gregberge/svgr/blob/main/packages/webpack/src/index.js)
        // for `@svgr/core` more options, check [link](https://react-svgr.com/docs/options/)
        options: {
            // if true, will use babel with pre-defined options by @svgr/webpack, if false, will not use babel
            babel: true,
            // replace SVG attributes of `width` and `height` by `1em` in order to make SVG size inherits from text size
            icon: true,
            // whether properties given to the component will be forwarded to the SVG tag
            expandProps: 'end',
            // forward `ref` to the root SVG tag
            ref: true,
            // replace attribute values
            replaceAttrValues: {},
            // use `svgo` to optimize SVG code
            svgo: true,
            // for more `svgo` options, check [link](https://github.com/svg/svgo)
            svgoConfig: {},
        },
    };
    const rawLoader = {
        loader: rawLoaderFile,
    };
    const fileLoader = {
        loader: fileLoaderFile,
        options: {
            outputPath: loadedStaticFolder,
        },
    };
    const babelLoader = {
        loader: babelLoaderFile,
        options: {
            cacheDirectory: enableCaching,
            root: contentRoot,
            // possible values: `'root' | 'upward' | 'upward-optional'`, check [link](https://babeljs.io/docs/en/options#rootmode)
            rootMode: 'root',
            // the project-wide configuration `babel.config.js` `babel.config.json`
            // check [link](https://babeljs.io/docs/en/config-files)
            configFile: configFileBabel,
            // directory-specific configuration `.babelrc` `.babelrc.js` `.babelrc.json`
            // babelrc: false,
            envName: nodeEnv, // process.env.BABEL_ENV || process.env.NODE_ENV || 'development'
        },
    };
    const tsLoader = {
        loader: tsLoaderFile,
        options: {
            context: contentRoot,
            // set to true to only check used files by webpack,
            // rather than all files matching the `include/exclude/files` patterns in `tsconfig.json`
            onlyCompileBundledFiles: true,
            configFile: configFileTypescriptReact,
        },
    };
    const cssLoader = {
        loader: cssLoaderFile,
        options: {},
    };
    const cssLoaderWithModules = {
        loader: cssLoaderFile,
        options: {
            modules: 'global', // the scope of identifiers not prefixed with `:local` or `:global`
        },
    };
    const lessLoader = (modifyVars) => ({
        loader: lessLoaderFile,
        options: {
            lessOptions: {
                javascriptEnabled: true,
                // less vars is case sensitive here
                // `modifyVars` of `less-loader` won't do automatic `caseCase` to `case-case` conversion
                modifyVars,
            },
        },
    });
    const defaultLessLoader = lessLoader({});
    const themedLessLoaders = {};
    apps.forEach((a) => {
        themedLessLoaders[a.name] = lessLoader({
            ...a.lessVars,
            'primary-color': a.primaryColor,
            'secondary-color': a.secondaryColor,
        });
    });
    const lessVarsLoader = {
        loader: lessVarsLoaderFile,
        options: {},
    };
    // `postcss-loader` should be used before `css-loader` and `style-loader`, but after others, such as `less-loaders`
    const postCSSLoader = {
        loader: postcssLoaderFile,
        options: {
            postcssOptions: {
                config: configFilePostCSS,
            },
        },
    };
    // use `MiniCSSExtractPlugin.loader` instead
    // const styleLoader: webpack.RuleSetUseItem = {
    // 	loader: 'style-loader',
    // 	options: {
    // 		// injectType: 'styleTag', // default behavior
    // 		injectType: 'lazyStyleTag', // use `.use()` / `.unuse()` to enable/disable styles
    // 		// sourceMap: // this loader automatically inject source maps when previous loader emit them
    // 	},
    // }
    // `mini-css-extract-plugin` does not support the usage `.use()` `.unuse()` like `style-loader`
    const miniCSSExtractLoader = {
        loader: mini_css_extract_plugin_1.default.loader,
        options: {
            hmr: enableLiveUpdating === 'hmr',
            // reloadAll: true, // if HMR does not work, uncomment this line as a workaround to force enable HMR
        },
    };
    const loaders = [
        // for non-script and non-style files
        {
            test: /\.(svg)$/i,
            exclude: loadedStaticDir,
            use: [svgLoader],
        },
        {
            test: /\.(txt|md)$/i,
            exclude: loadedStaticDir,
            use: [rawLoader],
        },
        {
            test: /\.(webp|jpg|jpeg|png|gif|bmp|tif|tiff)$/i,
            exclude: loadedStaticDir,
            use: [fileLoader],
        },
        {
            include: loadedStaticDir,
            oneOf: [
                {
                    test: /\.(svg)$/i,
                    use: [svgLoader],
                },
                {
                    test: /\.(txt|md)$/i,
                    use: [rawLoader],
                },
                {
                    use: [fileLoader],
                },
            ],
        },
        // for script files not in the source paths (i.e. `node_modules`)
        {
            test: /\.(js)$/i,
            exclude: srcPaths,
            use: [], // should use `babel-loader` here?
        },
        {
            test: /\.(jsx)$/i,
            exclude: srcPaths,
            use: [babelLoader],
        },
        {
            test: /\.(ts|tsx)$/i,
            exclude: srcPaths,
            use: [babelLoader, tsLoader],
        },
        // for script files in the source paths
        {
            test: /\.(js|jsx)$/i,
            include: srcPaths,
            use: [babelLoader],
        },
        {
            test: /\.(ts|tsx)$/i,
            include: srcPaths,
            use: [babelLoader, tsLoader],
        },
        // for style files not in the source paths (i.e. `node_modules`)
        {
            test: /\.(css)$/i,
            exclude: srcPaths,
            use: [miniCSSExtractLoader, cssLoader], // should use `postcss-loader` here?
        },
        {
            test: /\.(less)$/i,
            exclude: srcPaths,
            use: [miniCSSExtractLoader, cssLoader, postCSSLoader, defaultLessLoader],
        },
        // for style files in the source paths
        {
            test: /\.(css)$/i,
            include: srcPaths,
            use: [miniCSSExtractLoader, cssLoaderWithModules, postCSSLoader],
        },
        {
            test: /\.(less)$/i,
            include: srcPaths,
            oneOf: [
                ...apps.map((a) => ({
                    issuer: a.pages.map((p) => p.source),
                    test: /\bvars\.less$/i,
                    use: [lessVarsLoader, themedLessLoaders[a.name]],
                })),
                ...apps.map((a) => ({
                    issuer: a.pages.map((p) => p.source),
                    use: [miniCSSExtractLoader, cssLoaderWithModules, postCSSLoader, themedLessLoaders[a.name]],
                })),
                {
                    test: /\bvars\.less$/i,
                    use: [lessVarsLoader, defaultLessLoader],
                },
                {
                    use: [miniCSSExtractLoader, cssLoaderWithModules, postCSSLoader, defaultLessLoader],
                },
            ],
        },
    ];
    // endregion
    // region `webpack` configurations
    const alias = {
        static: staticDir,
    };
    const config = {
        // options for file and directory
        entry: pages.reduce((prev, p) => ({ ...prev, [p.asset]: [polyfill, p.source] }), {}),
        externals: [],
        resolve: {
            extensions: [
                ...fileExtensionsWeb.map((ext) => `.${mode}${ext}`),
                ...fileExtensionsWeb.map((ext) => `.${nodeEnv === 'development' ? 'dev' : 'prod'}${ext}`),
                ...fileExtensionsWeb,
            ],
            alias: enableReactProfiling
                ? {
                    ...alias,
                    // enable React profiling in serving mode and production mode, check [](https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977#webpack-4)
                    'react-dom$': 'react-dom/profiling',
                    'scheduler/tracing': 'scheduler/tracing-profiling', // check above
                }
                : alias,
        },
        output: {
            path: buildDir,
            filename: filenameJS,
            chunkFilename: filenameChunkJS,
            // if `output.publicPath` is not set, `webpack` runtime use the path of HTML file rather than `output.path`
            // as the base path to resolved the relative path of dynamically imported chunks
            // check [](https://webpack.js.org/configuration/output/#outputpublicpath) (go to the end of this section), [](https://github.com/webpack/webpack/issues/2776#issuecomment-233208623), [](https://github.com/webpack/webpack/issues/443)
            publicPath: servingPrefix,
            crossOriginLoading: 'anonymous',
            hashFunction,
            hashDigest,
            hashDigestLength,
        },
        // watchOptions: { // options for file watching when running `webpack` in watch mode (with `--watch`, then re-compile on file changes)
        // 	aggregateTimeout: watchWait, // wait this many milliseconds before re-compiling
        // 	ignored: /[\\/]node_modules[\\/]/,
        // },
        // options for code generation
        mode: nodeEnv,
        target: 'web',
        devtool: enableSourceMap ? 'source-map' : false,
        performance: {
            maxEntrypointSize: Number.MAX_SAFE_INTEGER,
            maxAssetSize: Number.MAX_SAFE_INTEGER, // to eliminate messages: WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).
        },
        optimization: {
            minimize: enableMinify,
            // needed if using `mini-css-extract-plugin`
            minimizer: enableMinify
                ? [
                    // '...' // for webpack 5, we can use the `...` to extend webpack default minimizers (i.e. `terser-webpack-plugin`)
                    // webpack by default uses `terser-webpack-plugin` which uses `terser` to minify JS, if without `mini-css-extract-plugin`
                    new terser_webpack_plugin_1.default({
                        cache: enableCaching,
                        parallel: true,
                        extractComments: false,
                    }),
                    new css_minimizer_webpack_plugin_1.default({
                        cache: enableCaching,
                    }), // `css-minimizer-webpack-plugin` uses `cssnano` to minify CSS
                ]
                : undefined,
            // runtimeChunk: false | 'single' | 'multiple',
            splitChunks: {
                chunks: 'all',
                minChunks: 2,
                minSize: 0,
                maxSize: 0,
                maxInitialRequests: Number.MAX_SAFE_INTEGER,
                maxAsyncRequests: Number.MAX_SAFE_INTEGER,
                automaticNameDelimiter: '~',
                name: true,
                cacheGroups: {
                    default: false,
                    commons: {
                        // name: 'commons',
                        priority: 20,
                        reuseExistingChunk: true,
                        test: srcPaths[0],
                        // or:
                        // test: (module, chunks) => {
                        // 	const allChunksNames = chunks.map(item => item.name).join('~')
                        // 	const moduleContext = module.context
                        // 	const moduleFileName = module.identifier()
                        // 	return true
                        // },
                    },
                    vendors: {
                        // name: 'vendors',
                        priority: 10,
                        reuseExistingChunk: true,
                    },
                },
            },
        },
        // options for plugins and loaders
        plugins,
        module: { rules: loaders },
    };
    const serverConfig = enableServing
        ? {
            host,
            port,
            compress: false,
            injectClient: true,
            // liveReload: enableLiveUpdating === 'fullRefresh', // full page refreshing
            injectHot: enableLiveUpdating === 'hmr',
            hot: enableLiveUpdating === 'hmr',
            // hotOnly: enableLiveUpdating == 'hmr', // HMR, wo/ fallback to full page refreshing on failures
            serveIndex: true,
            publicPath: '/',
            contentBase: [staticDir],
            watchContentBase: false,
            watchOptions: {
                // options for file watching when running `webpack-dev-server`
                aggregateTimeout: watchWait,
                ignored: /[\\/]node_modules[\\/]/,
            },
            overlay: {
                warnings: false,
                errors: true,
            },
        }
        : {};
    if (enableServing) {
        config.devServer = serverConfig;
    }
    utils_1.log.debug('Final Webpack config:', config);
    if (logDisabled) {
        utils_1.log.enable();
    }
    return config;
    // endregion
}
function webpackConfigHook(hook = undefined) {
    utils_1.log.assert(hook == null || typeof hook === 'function', 'Unexpected parameter `hook`');
    return function callWebpackConfigFunc(env, argv) {
        const config = webpackConfigFunc(env, argv);
        return hook ? hook(config) : config;
    };
}
exports.default = webpackConfigHook;
