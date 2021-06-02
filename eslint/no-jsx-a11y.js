const _ = require('lodash')
let config = require('./index')

config = _.cloneDeep(config)
config.overrides.forEach((o) => {
	if (o.rules) {
		Object.keys(o.rules).forEach((r) => {
			if (r.startsWith('jsx-a11y/')) {
				o.rules[r] = 'off'
			}
		})
	}
})

module.exports = config
