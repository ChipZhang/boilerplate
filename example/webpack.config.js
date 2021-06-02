const path = require('path')
const webpack = require('../webpack').default
// const webpack = require('@chipzhang/boilerplate/webpack').default // uncomment this line and delete the upper line in a real project

module.exports = webpack((c) => {
	c.resolve.alias['alias-name'] = path.join(__dirname, 'src/common/alias')
	return c
})
