const presetEnv = require('postcss-preset-env')
const flexbugsFixes = require('postcss-flexbugs-fixes')

module.exports = {
	plugins: [
		presetEnv(), // this plugin already uses `autoprefixer`
		flexbugsFixes(),
	],
}
