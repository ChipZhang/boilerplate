import path from 'path'
import {configFileWebpack} from '../cli/path'
import webpack from 'webpack'

let wc: any

export function getWebpackConfig(env: Record<string, any>, argv: Record<string, any>): webpack.Configuration {
	if (!wc) {
		wc = require(path.join(configFileWebpack)) // eslint-disable-line global-require
		if (typeof wc === 'function') {
			wc = wc(env, argv)
		}
	}

	return wc
}
