module.exports = {
	extends: '../eslint/no-jsx-a11y',
	// extends: require.resolve('@chipzhang/boilerplate/eslint/no-jsx-a11y'), // uncomment this line and delete the upper line in a real project
	rules: {
		'no-console': 'off',
		'no-alert': 'off',
		'no-unused-vars': 'off',
		'import/no-extraneous-dependencies': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
	},
}
