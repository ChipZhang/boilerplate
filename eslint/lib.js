const path = require('path')
const _ = require('lodash')
const config = require('@chipzhang/eslint-config/lib')
const {configFileTypescriptNode, configFileTypescriptReact, configFileBabel} = require('../cli/path')
const {log} = require('../utils')
let babelConfig = require(configFileBabel)
const webpackConfig = require('../webpack/get-webpack-config').getWebpackConfig({}, {})

log.assert(
	typeof babelConfig !== 'function',
	`Exporting a function in \`${configFileBabel}\` is not supported currently`,
)

// convert relative path in babel config `extends` key to absolute path
if (typeof babelConfig.extends === 'string' && babelConfig.extends.startsWith('.')) {
	babelConfig = _.cloneDeep(babelConfig)
	babelConfig.extends = path.join(path.dirname(configFileBabel), babelConfig.extends)
}

const {fileExtensionsNode, fileExtensionsWeb, json, jsonComment, jsNode, tsNode, jsWeb, tsWeb, jsx, tsx} =
	_.cloneDeep(config)

const globals = {
	CONFIG: 'readonly', // for `DefaultHTMLPlugin`
	importName: 'readonly', // for `babel-plugin-webpack-async-module-name`
	module: 'readonly', // for webpack `module.hot`
}

const rules = {
	'import/order': [
		'warn',
		{
			groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'unknown', 'type'],
			pathGroups: [{pattern: 'static/**', group: 'unknown', position: 'after'}],
			alphabetize: {order: 'asc', caseInsensitive: true},
		},
	],
}

const parserOptionsTypescriptNode = {
	project: [configFileTypescriptNode],
}

const parserOptionsTypescriptReact = {
	project: [configFileTypescriptReact],
}

const parserOptionsBabel = {
	requireConfigFile: false,
	babelOptions: babelConfig,
}

const settings = {
	// options for `eslint-plugin-import` plugin `eslint-import-resolver-webpack`
	'import/resolver': {
		webpack: {
			config: webpackConfig,
		},
	},
}

Object.assign(jsWeb.globals, globals)
Object.assign(tsWeb.globals, globals)
Object.assign(jsx.globals, globals)
Object.assign(tsx.globals, globals)

Object.assign(jsWeb.rules, rules)
Object.assign(tsWeb.rules, rules)
Object.assign(jsx.rules, rules)
Object.assign(tsx.rules, rules)

Object.assign(tsNode.parserOptions, parserOptionsTypescriptNode)

Object.assign(jsWeb.parserOptions, parserOptionsBabel)
Object.assign(tsWeb.parserOptions, parserOptionsTypescriptReact)
Object.assign(jsx.parserOptions, parserOptionsBabel)
Object.assign(tsx.parserOptions, parserOptionsTypescriptReact)

Object.assign(jsWeb.settings, settings)
Object.assign(tsWeb.settings, settings)
Object.assign(jsx.settings, settings)
Object.assign(tsx.settings, settings)

module.exports = {
	fileExtensionsNode,
	fileExtensionsWeb,
	json,
	jsonComment,
	jsNode,
	tsNode,
	jsWeb,
	tsWeb,
	jsx,
	tsx,
}
