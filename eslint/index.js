const {buildFolder, staticFolder} = require('../cli/path')
const {fileExtensionsWeb, json, jsonComment, jsNode, tsNode, jsWeb, tsWeb, jsx, tsx} = require('./lib')

const tsConfigPatterns = ['tsconfig.json', 'tsconfig.*.json']
const isNodePatterns = ['.*rc.js', '*.config.js', './*.js', './tests/**/*.js']
const tsNodePatterns = ['.*rc.ts', '*.config.ts', './*.ts', './tests/**/*.ts']
const jsxExcludePatterns = ['./*.jsx', './tests/**/*.jsx']
const tsxExcludePatterns = ['./*.tsx', './tests/**/*.tsx']

module.exports = {
	root: true, // do not load `.eslintrc.*` files in parent folders up to the root directory
	overrides: [
		{
			files: ['*.json'],
			excludedFiles: tsConfigPatterns,
			...json,
		},
		{
			files: tsConfigPatterns,
			...jsonComment,
		},

		{
			files: isNodePatterns,
			...jsNode,
		},
		{
			files: ['*.js'],
			excludedFiles: isNodePatterns,
			...jsWeb,
		},
		{
			files: tsNodePatterns,
			...tsNode,
		},
		{
			files: ['*.ts'],
			excludedFiles: tsNodePatterns,
			...tsWeb,
		},

		{
			files: ['*.jsx'],
			excludedFiles: jsxExcludePatterns,
			...jsx,
		},
		{
			files: ['*.tsx'],
			excludedFiles: tsxExcludePatterns,
			...tsx,
		},
	],
	ignorePatterns: [
		'node_modules',
		...fileExtensionsWeb.map((ext) => `!.*${ext}`), // ignore dot folders but not dot files
		`/${buildFolder}`,
		`/${staticFolder}`,
	],
}
