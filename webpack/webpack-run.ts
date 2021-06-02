import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import {log} from '../utils'
import {webConfig} from '../cli/config'

export function runWebpackConfig(config: webpack.Configuration): void {
	const compiler = webpack(config)

	if (!config.devServer) {
		compiler.run((err: undefined | Error, stats: undefined | webpack.Stats): void => {
			if (err) {
				log.assert(false, err)
			}

			if (stats) {
				const info = stats.toJson()

				if (stats.hasWarnings() && info.warnings) {
					info.warnings.forEach((warning) => {
						log.warn(`${warning}\n`)
					})
				}

				if (stats.hasErrors() && info.errors) {
					info.errors.forEach((error) => {
						log.error(`${error}\n`)
					})

					log.error('Failed to compile')
					process.exitCode = 1
					return
				}

				log.info(`Managed to compile`)
				if (stats.endTime != null && stats.startTime != null) {
					log.info(`Cost ${Math.round((stats.endTime - stats.startTime) / 1000)} second(s)`)
				}
			}
		})
	} else {
		const host = config.devServer.host || webConfig.defaultHost
		const port = config.devServer.port || webConfig.defaultPort

		if (config.devServer.hot) {
			WebpackDevServer.addDevServerEntrypoints(config, config.devServer) // needed to enable HMR when using `webpack` node API
		}

		const server = new WebpackDevServer(compiler, config.devServer)
		server.listen(port, host /* callback is useless here */)
	}
}
