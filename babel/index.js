const options = {
	browserslistConfigFile: true,
	compact: false, // to eliminate messages `[BABEL] Note: The code generator has deoptimised the styling of xxx.js as it exceeds the max of 500KB.`
}

// plugins run from first to last
const plugins = [
	// class property proposal, i.e. `static propTypes = {...}`, `onChange = (e) => {}`
	'@babel/plugin-proposal-class-properties',

	// `importName('./dynamic.js', 'my-chunk-name')` will be transformed roughly to
	// `import( /*webpackChunkName: 'my-chunk-name'*/ './dynamic.js');`
	'babel-plugin-webpack-async-module-name',

	// `import _ from 'lodash'; _.map(...)` will be transformed roughly to
	// `import _map from 'lodash/map'; _map(...)`
	'babel-plugin-lodash',
]

// presets run from last to first
const presets = (development, enableDebug) => [
	[
		'@babel/preset-env',
		{
			// print babel debug info, such as targets/plugins/polyfills used by `@babel/preset-env`
			// #NOTES if caching is enabled for `babel-loader`, if the source file is not changed, on re-compiling,
			// babel debug info for this file is not printed
			debug: enableDebug,
			useBuiltIns: development ? false : 'usage',
			corejs: development ? undefined : {version: '3.13.1', proposals: true},
		},
	],
	[
		'@babel/preset-react',
		{
			development,
		},
	],
]

module.exports = (api) => {
	// disable logging when not using `webpack`, i.e. when using tools depending on `babel.config.js`
	const enableDebug = api.caller((caller) => caller.name === 'babel-loader')

	return {
		env: {
			development: {
				...options,
				plugins,
				presets: presets(true, enableDebug),
			},
			production: {
				...options,
				plugins,
				presets: presets(false, enableDebug),
			},
		},
	}
}
