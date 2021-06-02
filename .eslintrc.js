const path = require('path')

module.exports = {
	extends: '@chipzhang/eslint-config/node',
	parserOptions: {
		project: [path.join(__dirname, 'tsconfig.json')],
	},
	rules: {
		'node/shebang': [
			'error',
			{
				convertPath: {
					'**/*.ts': ['^(.*)\\.ts$', '$1.js'],
				},
			},
		],
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'@typescript-eslint/no-unsafe-member-access': 'off',
		'@typescript-eslint/no-unsafe-return': 'off',
		'@typescript-eslint/no-unsafe-call': 'off',
	},
}
