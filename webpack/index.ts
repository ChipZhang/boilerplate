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

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'

import HTMLPlugin from 'html-webpack-plugin'
import SRIPlugin from 'webpack-subresource-integrity'
import MiniCSSExtractPlugin from 'mini-css-extract-plugin'
import CSSMinimizerPlugin from 'css-minimizer-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
// @ts-ignore: no type declarations
import ErrorOverlayPlugin from 'error-overlay-webpack-plugin'
import {CleanWebpackPlugin as CleanPlugin} from 'clean-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'
import {AssetAttributesPlugin} from '@chipzhang/webpack-asset-attributes-plugin'

import {log} from '../utils'
import {pathConfig, logoConfig, webConfig, checkEnv, Page, parseApps} from '../cli/config'
import {DebugModulesChunksPlugin, DebugHTMLPlugin, DefaultHTMLPlugin} from './webpack-plugins'

const tsLoaderFile = require.resolve('ts-loader')
const babelLoaderFile = require.resolve('babel-loader')
const postcssLoaderFile = require.resolve('postcss-loader')
const cssLoaderFile = require.resolve('css-loader')
const lessLoaderFile = require.resolve('less-loader')
const lessVarsLoaderFile = require.resolve('@chipzhang/webpack-less-vars-loader')
const svgLoaderFile = require.resolve('@svgr/webpack')
const fileLoaderFile = require.resolve('file-loader')
const rawLoaderFile = require.resolve('raw-loader')

const fileExtensionsWeb = ['.tsx', '.ts', '.jsx', '.js', '.json']

/**
 * @param {object} env reflects what is passed to `webpack` with argument `--env`
 * @param {object} argv reflects the command line passed to `webpack`
 */
function webpackConfigFunc(env: any, argv: any): webpack.Configuration {
	// region check for parameters and environment

	log.assert(env?.constructor === Object, 'Unexpected value for `env`')
	log.assert(argv?.constructor === Object, 'Unexpected value for `argv')
	log.debug('env & argv:', {env, argv})

	let argv$0: any = argv.$0
	let argvHost: any = argv.host
	let argvPort: any = argv.port
	let envMode: any = env.mode
	let envApi: any = env.api
	const envApps: any = env.apps

	// assume default values for `$0`, `mode`, useful for tools depending on `webpack.config.js`
	if (argv$0 == null) {
		argv$0 = 'node'
	}
	if (argvHost == null) {
		argvHost = webConfig.defaultHost
	}
	if (argvPort == null) {
		argvPort = webConfig.defaultPort
	}
	if (envMode == null) {
		envMode = process.env.NODE_ENV === 'production' ? 'production' : 'development'
	}
	if (envApi == null) {
		envApi = webConfig.defaultAPI
	}

	log.assert(typeof argv$0 === 'string', 'Unexpected value for `$0`')
	log.assert(typeof argvHost === 'string', 'Unexpected value for `--host`')
	log.assert(typeof argvPort === 'number', 'Unexpected value for `--port`')
	log.assert(typeof envMode === 'string', 'Unexpected value for `--env.mode`')
	log.assert(typeof envApi === 'string', 'Unexpected value for `--env.api`')
	log.assert(
		envApps == null ||
			typeof envApps === 'string' ||
			(Array.isArray(envApps) && envApps.every((a: any) => typeof a === 'string')),
		'Unexpected value for `--env.apps`',
	)

	const $0: string = argv$0
	const host: string = argvHost
	const port: number = argvPort
	const mode: string = envMode
	const api: string = envApi
	const appNames: null | undefined | string | string[] = envApps
	const $0Title = path.basename($0).split('.')[0]

	let logDisabled = false
	// disable logging when not using `webpack`, i.e. when using tools depending on `webpack.config.js`
	if ($0Title !== '<internal>' && $0Title !== 'webpack' && $0Title !== 'webpack-dev-server') {
		logDisabled = true
		log.disable()
	}
	log.info('Mode:', mode)
	log.debug('Parameters:', {$0, host, port, mode, api, apps: appNames})

	let nodeEnv: 'development' | 'production'
	let isModeDevelopment = false
	let isModeServing = false
	let isModeProduction = false
	let isModePublic = false
	switch (mode) {
		case 'development':
			nodeEnv = 'development'
			isModeDevelopment = true
			break

		case 'serving':
			nodeEnv = 'production'
			isModeServing = true
			break

		case 'production':
			nodeEnv = 'production'
			isModeProduction = true
			break

		case 'public':
			nodeEnv = 'production'
			isModePublic = true
			break

		default:
			log.assert(false, mode ? `Invalid mode \`${mode}\`` : 'Mode not specified')
			return {}
	}

	const enableServing = isModeDevelopment || isModeServing
	// only specific for files in source directories; check above
	const enableMinify = isModePublic
	const enableSourceMap = isModeDevelopment || isModeServing || isModeProduction
	// only specific for `error-overlay-webpack-plugin`; check above
	const enableErrorOverlay = isModeDevelopment
	const enableSRI = isModeProduction || isModePublic
	const enableHashing = isModeProduction || isModePublic
	const enableReactProfiling = isModeServing || isModeProduction
	const enableReports = isModePublic
	// `hmr` or `fullRefresh` or false
	const enableLiveUpdating = isModeDevelopment || isModeServing ? 'hmr' : false
	// currently only `babel-loader`, `terser-webpack-plugin`, `css-minimizer-webpack-plugin` supports caching option; check above
	const enableCaching = isModeDevelopment || isModeServing
	const enableVersionTextInTitle = isModeDevelopment || isModeServing

	checkEnv(nodeEnv)
	if (enableServing) {
		log.assert($0Title !== 'webpack', 'Should run `webpack-dev-server` for this mode')
	} else {
		log.assert($0Title !== 'webpack-dev-server', 'Should run `webpack` for this mode')
	}

	const apps = parseApps(appNames)
	const pages: Page[] = apps.map((a) => a.pages).flat()
	log.info(`Building apps: ${apps.map((a) => a.name).join(', ')}`)
	log.info(`Including pages: ${pages.map((p) => p.source).join(', ')}`)

	// endregion

	// region configurations, files and directories

	const built = ((d: Date) => {
		const p = (v: number): string => (v < 10 ? `0${v}` : v.toString())
		let tzh = d.getTimezoneOffset() * -1
		const tzs = tzh < 0 ? '-' : '+'
		tzh = Math.abs(tzh)
		const tzm = tzh % 60
		tzh = (tzh - tzm) / 60
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(
			d.getSeconds(),
		)} ${tzs}${p(tzh)}${p(tzm)}`
	})(new Date())
	let version = '0.0.0'
	if (typeof pathConfig.packageJSON?.version === 'string') {
		version = pathConfig.packageJSON.version
	}
	const {copyright} = webConfig
	const servingPrefix = enableServing ? '/' : webConfig.prefix
	const watchWait = 2000
	const hashFunction = 'md5'
	const hashDigest = 'hex'
	const hashDigestLength = 6

	const buildDir = pathConfig.buildDir(mode)
	const {contentRoot, reportFolder, staticDir, loadedStaticFolder, loadedStaticDir, srcPaths, polyfill} = pathConfig
	const {configFileTypescriptReact, configFileBabel, configFilePostCSS} = pathConfig

	const filenameHTML = (p: Page) => path.join(...p.html.split('/'))
	// use POSIX path to keep the chunk ID the same across different OS-es
	const filenameJS = path.posix.join('js', !enableHashing ? '[name].js' : '[name]-[contenthash].js')
	const filenameChunkJS = path.posix.join('js-chunk', !enableHashing ? '[name].js' : '[name]-[contenthash].js')
	const filenameCSS = path.posix.join('css', !enableHashing ? '[name].css' : '[name]-[contenthash].css')
	const filenameChunkCSS = path.posix.join('css-chunk', !enableHashing ? '[name].css' : '[name]-[contenthash].css')
	const filenameStatsOutput = path.join(reportFolder, 'stats.json')
	const filenameBundleAnalyzerOutput = path.join(reportFolder, 'bundle-analyzer.html')

	// endregion

	// region plugins

	const plugins: webpack.WebpackPluginInstance[] = [
		// some package may rely on this variable `NODE_ENV`
		// this plugin uses pure string replacement rather than creating a global variable
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(nodeEnv),
		}),

		new webpack.BannerPlugin(copyright),

		new MiniCSSExtractPlugin({
			filename: filenameCSS,
			chunkFilename: filenameChunkCSS,
		}),
	]

	if (enableErrorOverlay) {
		plugins.push(new ErrorOverlayPlugin())
	}

	if (enableSRI) {
		// adds SRI check to the assets inserted by `html-webpack-plugin`
		// need to configure HTTP server to add response header `Cache-Control: no-transform` to avoid modifications made by a proxy (e.g. Chrome Data Saver)
		plugins.push(new SRIPlugin({hashFuncNames: ['sha256']}))
	}

	if (enableHashing) {
		// make module id stable, used for hashed filenames
		plugins.push(
			new webpack.HashedModuleIdsPlugin({
				hashFunction,
				hashDigest,
				hashDigestLength,
			}),
		)

		// make chunk id stable, used for hashed filenames, code from [](https://github.com/webpack/webpack/issues/4837#issuecomment-397545259), or use [](https://github.com/hxlniada/webpack-hashed-chunkids/blob/master/index.js)
		// this plugin may break HMR, so do not use it for development mode
		plugins.push(
			new webpack.NamedChunksPlugin(
				(() => {
					const used = new Set()

					return (chunk: webpack.Chunk): string => {
						const moduleIDs = chunk
							.getModules()
							.map((m: any) => m.id)
							.sort()
							.join(';')
						const hash = crypto.createHash(hashFunction)
						hash.update(moduleIDs)
						const hashResult = hash.digest(hashDigest)

						let len = hashDigestLength
						let result
						do {
							if (len > hashResult.length) {
								throw new Error()
							}
							result = hashResult.substr(0, len)
							len += 1
						} while (used.has(result))
						used.add(result)

						return result
					}
				})(),
			),
		)
	}

	if (enableLiveUpdating === 'hmr') {
		// this plugin must be explicitly specified to enable HMR when using `webpack` node API
		plugins.push(new webpack.HotModuleReplacementPlugin())
	}

	// rather than using `filemanager-webpack-plugin`, which has vulnerable dependencies
	if (!enableServing) {
		plugins.push(new CleanPlugin()) // clean the output folder first

		if (fs.existsSync(staticDir)) {
			plugins.push(
				new CopyPlugin({
					patterns: [
						{
							from: staticDir,
							// ignore sub-folder `loaded`, files in this folder will be loaded by `file-loader` or `raw-loader`,
							// and will be automatically emitted or injected, thus no need of manual copying
							filter: (path: string) =>
								// on Windows, `path` contains backslashes
								!path.replace(/\\/g, '/').startsWith(loadedStaticDir.replace(/\\/g, '/')),
							// do not overwrite files generated by other plugins (files already in `compilation.assets`)
							// but will overwrite previously copied files
							force: false,
						},
					],
				}),
			)
		}
	}

	if (enableReports) {
		plugins.push(
			new BundleAnalyzerPlugin({
				openAnalyzer: false,
				analyzerMode: 'static',
				defaultSizes: 'gzip', // possible values: 'stat' | 'parsed' | 'gzip'
				generateStatsFile: true,
				statsFilename: filenameStatsOutput,
				reportFilename: filenameBundleAnalyzerOutput,
			}),
		)

		try {
			// eslint-disable-next-line global-require, node/no-missing-require, @typescript-eslint/no-var-requires
			const BundleStatsPlugin = require('bundle-stats-webpack-plugin').BundleStatsWebpackPlugin
			plugins.push(
				// @ts-ignore: wrong type declaration, method `apply` not defined
				new BundleStatsPlugin({
					compare: false,
					outDir: reportFolder,
				}),
			)
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e
			}
			log.warn(`Optional dependency \`bundle-stats-webpack-plugin\` (v2 or v3) not installed, skipping it`)
		}
	}

	// as per [](https://github.com/jantimon/html-webpack-plugin):
	// > If you have plugins that make use of it, html-webpack-plugin should be ordered first before any of the integrated plugins.
	const templateHTML = fs.existsSync(webConfig.templateHTMLFile)
		? webConfig.templateHTMLFile
		: require.resolve('./html.ejs')

	pages.forEach((p: Page) => {
		const title = enableVersionTextInTitle ? `${p.title} (${mode}, ${version}, ${built})` : p.title

		const logoFile = logoConfig.svgFile(p.app.name)
		const logoGenerated = fs.existsSync(logoFile)
		if (!logoGenerated) {
			log.warn(`Logo not generated yet for app \`${p.app.name}\``)
		}

		plugins.push(
			new HTMLPlugin({
				title,
				template: templateHTML, // template HTML file; if no loader specified for this file, it uses `lodash` template engine, with similar syntax to EJS
				filename: filenameHTML(p),
				inject: true,
				hash: false, // outputs `xxx.js?89656f` or `xxx.css?89656f`; not needed if already using hashes in filenames
				chunks: [p.asset], // dependencies are included automatically in recent versions of `html-webpack-plugin`
				meta: {},
				minify: enableMinify
					? {
							// `html-webpack-plugin` uses `html-minifier-terser` to minify HTML
							html5: true,
							collapseWhitespace: true,
							removeComments: true,
							keepClosingSlash: true,
							ignoreCustomComments: [/^!/], // ignore such HTML comments
							quoteCharacter: '"',
							minifyCSS: true, // `html-minifier-terser` uses `terser` to minify JS in the HTML
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
					CONFIG: <AppConfig>{
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
			}),
		)
	})

	plugins.push(new DefaultHTMLPlugin({mode, version, built}, copyright, servingPrefix, !enableMinify))
	plugins.push(
		new AssetAttributesPlugin({
			scriptAttribs: webConfig.scriptAttribs,
			styleAttribs: webConfig.styleAttribs,
		}),
	)

	if (log.isDebugEnabled()) {
		plugins.push(new DebugModulesChunksPlugin())
		plugins.push(new DebugHTMLPlugin())
	}

	log.info('Plugins:', plugins.map((plugin) => plugin.constructor.name).join(', '))
	log.debug('plugins:', plugins)

	// endregion

	// region loaders

	const svgLoader: webpack.RuleSetUseItem = {
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
	}

	const rawLoader: webpack.RuleSetUseItem = {
		loader: rawLoaderFile,
	}

	const fileLoader: webpack.RuleSetUseItem = {
		loader: fileLoaderFile,
		options: {
			outputPath: loadedStaticFolder,
		},
	}

	const babelLoader: webpack.RuleSetUseItem = {
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
	}

	const tsLoader: webpack.RuleSetUseItem = {
		loader: tsLoaderFile,
		options: {
			context: contentRoot,
			// set to true to only check used files by webpack,
			// rather than all files matching the `include/exclude/files` patterns in `tsconfig.json`
			onlyCompileBundledFiles: true,
			configFile: configFileTypescriptReact,
		},
	}

	const cssLoader: webpack.RuleSetUseItem = {
		loader: cssLoaderFile,
		options: {},
	}

	const cssLoaderWithModules: webpack.RuleSetUseItem = {
		loader: cssLoaderFile,
		options: {
			modules: 'global', // the scope of identifiers not prefixed with `:local` or `:global`
		},
	}

	const lessLoader: (modifyVars: {[p: string]: string}) => webpack.RuleSetUseItem = (modifyVars) => ({
		loader: lessLoaderFile,
		options: {
			lessOptions: {
				javascriptEnabled: true,
				// less vars is case sensitive here
				// `modifyVars` of `less-loader` won't do automatic `caseCase` to `case-case` conversion
				modifyVars,
			},
		},
	})

	const defaultLessLoader: webpack.RuleSetUseItem = lessLoader({})

	const themedLessLoaders: {[appName: string]: webpack.RuleSetUseItem} = {}
	apps.forEach((a) => {
		themedLessLoaders[a.name] = lessLoader({
			...a.lessVars,
			'primary-color': a.primaryColor,
			'secondary-color': a.secondaryColor,
		})
	})

	const lessVarsLoader: webpack.RuleSetUseItem = {
		loader: lessVarsLoaderFile,
		options: {},
	}

	// `postcss-loader` should be used before `css-loader` and `style-loader`, but after others, such as `less-loaders`
	const postCSSLoader: webpack.RuleSetUseItem = {
		loader: postcssLoaderFile,
		options: {
			postcssOptions: {
				config: configFilePostCSS,
			},
		},
	}

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
	const miniCSSExtractLoader: webpack.RuleSetUseItem = {
		loader: MiniCSSExtractPlugin.loader,
		options: {
			hmr: enableLiveUpdating === 'hmr',
			// reloadAll: true, // if HMR does not work, uncomment this line as a workaround to force enable HMR
		},
	}

	const loaders: webpack.RuleSetRule[] = [
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
				...apps.map(
					(a): webpack.RuleSetRule => ({
						issuer: a.pages.map((p) => p.source),
						test: /\bvars\.less$/i,
						use: [lessVarsLoader, themedLessLoaders[a.name]],
					}),
				),
				...apps.map(
					(a): webpack.RuleSetRule => ({
						issuer: a.pages.map((p) => p.source),
						use: [miniCSSExtractLoader, cssLoaderWithModules, postCSSLoader, themedLessLoaders[a.name]],
					}),
				),
				{
					test: /\bvars\.less$/i,
					use: [lessVarsLoader, defaultLessLoader],
				},
				{
					use: [miniCSSExtractLoader, cssLoaderWithModules, postCSSLoader, defaultLessLoader],
				},
			],
		},
	]

	// endregion

	// region `webpack` configurations

	const alias = {
		static: staticDir,
	}

	const config: webpack.Configuration = {
		// options for file and directory
		entry: pages.reduce((prev, p) => ({...prev, [p.asset]: [polyfill, p.source]}), {}),
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
			path: buildDir, // directory of the output assets
			filename: filenameJS, // filename of the entry assets, placeholders such as `[name]` can be used
			chunkFilename: filenameChunkJS, // filename of the `splitChunks` assets, placeholders such as `[name]` can be used
			// if `output.publicPath` is not set, `webpack` runtime use the path of HTML file rather than `output.path`
			// as the base path to resolved the relative path of dynamically imported chunks
			// check [](https://webpack.js.org/configuration/output/#outputpublicpath) (go to the end of this section), [](https://github.com/webpack/webpack/issues/2776#issuecomment-233208623), [](https://github.com/webpack/webpack/issues/443)
			publicPath: servingPrefix,
			crossOriginLoading: 'anonymous', // needed by `webpack-subresource-integrity`

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
		devtool: enableSourceMap ? 'source-map' : false, // JS/CSS source map
		performance: {
			maxEntrypointSize: Number.MAX_SAFE_INTEGER, // to eliminate messages: WARNING in entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit (244 KiB).
			maxAssetSize: Number.MAX_SAFE_INTEGER, // to eliminate messages: WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).
		},
		optimization: {
			minimize: enableMinify,

			// needed if using `mini-css-extract-plugin`
			minimizer: enableMinify
				? [
						// '...' // for webpack 5, we can use the `...` to extend webpack default minimizers (i.e. `terser-webpack-plugin`)
						// webpack by default uses `terser-webpack-plugin` which uses `terser` to minify JS, if without `mini-css-extract-plugin`
						new TerserPlugin({
							cache: enableCaching,
							parallel: true,
							extractComments: false,
						}),
						new CSSMinimizerPlugin({
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
		module: {rules: loaders},
	}

	const serverConfig: WebpackDevServer.Configuration = enableServing
		? {
				host,
				port,
				compress: false, // disable gzip, for better bandwidth throttling testing, when using browser developer tools

				injectClient: true, // inject relevant `webpack` code needed by HMR or full page refreshing or error printing in console
				// liveReload: enableLiveUpdating === 'fullRefresh', // full page refreshing
				injectHot: enableLiveUpdating === 'hmr', // inject relevant `webpack` code needed by HMR
				hot: enableLiveUpdating === 'hmr', // HMR, w/ fallback to full page refreshing on failures
				// hotOnly: enableLiveUpdating == 'hmr', // HMR, wo/ fallback to full page refreshing on failures

				serveIndex: true, // directory listings
				publicPath: '/', // `publicPath` here only affects files generated by `webpack`, i.e. static files in `contentBase` are still served at `/`, so this option is useless, and we make `webpack-dev-server` to always serve the files at `/`
				contentBase: [staticDir], // serve from multiple directories
				watchContentBase: false, // this option is only for static files
				watchOptions: {
					// options for file watching when running `webpack-dev-server`
					aggregateTimeout: watchWait, // wait this many milliseconds before re-compiling
					ignored: /[\\/]node_modules[\\/]/,
				},
				overlay: {
					warnings: false,
					errors: true,
				},
		  }
		: {}

	if (enableServing) {
		config.devServer = serverConfig
	}

	log.debug('Final Webpack config:', config)
	if (logDisabled) {
		log.enable()
	}
	return config

	// endregion
}

type WebpackConfigHook = (config: webpack.Configuration) => webpack.Configuration

export default function webpackConfigHook(hook: undefined | WebpackConfigHook = undefined): typeof webpackConfigFunc {
	log.assert(hook == null || typeof hook === 'function', 'Unexpected parameter `hook`')

	return function callWebpackConfigFunc(env: any, argv: any): webpack.Configuration {
		const config = webpackConfigFunc(env, argv)
		return hook ? hook(config) : config
	}
}
