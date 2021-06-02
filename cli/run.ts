#!/usr/bin/env node

/**
 * | command     | `NODE_ENV`  | `BABEL_ENV` |
 * | ---         | ---         | ---         |
 * | development | development | development |
 * | serving     | production  | production  |
 * | production  | production  | production  |
 * | public      | production  | production  |
 * | logo        |             |             |
 *
 * ways to invoke:
 *
 * - `node <this-script-file> <command> [options] [--] [<app1[.app2]>]] [<app3[.app4]>]]...`
 *
 * - `npx <bin-name> <command> [options] [--] [<app1[.app2]>]] [<app3[.app4]>]]...`
 * (`<bin-name>` is specified in `bin` section in `package.json` of this package, this script file will be symlinked in `node_modules/.bin` when installed)
 *
 * - `npm run <command> -- [options] [--] [<app1[.app2]>]] [<app3[.app4]>]]...`
 * (if `<command>` is specified in `scripts` section in `package.json`; `--` followed by `<command>` is required)
 *
 * - directly invoke `<webpack|webpack-dev-server> [--config <`webpack.config.js` file>] --env.mode <mode> [--host <host>] [--port <port>] [--env.api <url>] [<--env.apps> <app1[.app2]> [<--env.apps> <app3[.app4]>]...]`
 */

import fs from 'fs'
import child_process from 'child_process'
import semver from 'semver'
import yargs from 'yargs'
import {log} from '../utils'
import {pathConfig, logoConfig, webConfig, parseApps} from './config'
import {getWebpackConfig} from '../webpack/get-webpack-config'
import {runWebpackConfig} from '../webpack/webpack-run'

interface RunWebpackArgv {
	host: string
	port: number
	api: string
	[k: string]: any
}

function runWebpack(mode: string, argv: RunWebpackArgv, apps: string[]): void {
	const config = getWebpackConfig({mode, apps, api: argv.api}, {$0: '<internal>', host: argv.host, port: argv.port})
	runWebpackConfig(config)
}

// disable stdin, inherit stderr handler from parent, return stdout
function exec(exe: string, args: string[]): {code: number; stdout: undefined | string} {
	log.debug(`Running \`${exe}\` with args:`, args)

	try {
		const stdout = child_process.execFileSync(exe, args, {encoding: 'utf-8', stdio: ['ignore', 'pipe', 'inherit']})
		return {code: 0, stdout: stdout || ''}
	} catch (err) {
		return {code: err.status as number, stdout: undefined}
	}
}

// generate the logos manually using Inkscape and ImageMagick rather than using `favicons-webpack-plugin`, which runs too slowly
function runLogo(appNames: string[]): void {
	const apps = parseApps(appNames)
	const content = fs.readFileSync(logoConfig.templateSVGFile, {encoding: 'utf-8'})

	const inkExe = process.platform === 'win32' ? 'inkscape.com' : 'inkscape'
	let inkV = 0
	const inkM = exec(inkExe, ['--version']).stdout?.match(/\d+\.\d+/)
	if (inkM && inkM[0]) {
		inkV = Number.parseFloat(inkM[0])
	}
	log.assert(inkV > 0, `\`${inkExe}\` not found`)
	log.info(`Inkscape version`, inkV)

	const imgExe = 'convert'
	let imgV = 0
	const imgM = exec(imgExe, ['--version']).stdout?.match(/\d+\.\d+/)
	if (imgM && imgM[0]) {
		imgV = Number.parseFloat(imgM[0])
	}
	log.assert(imgV >= 6, `\`${imgExe}\` v6+ not found`)
	log.info(`ImageMagic version`, imgV)

	apps.forEach((app) => {
		const svgFile = logoConfig.svgFile(app.name)
		log.info(`Generating logos for app \`${app.name}\``)
		log.info(`Generating \`${svgFile}\` from template SVG file \`${logoConfig.templateSVGFile}\``)
		log.debug(`Replacing \`#000000\` with \`${app.primaryColor}\`, \`#ffffff\` with \`${app.secondaryColor}\``)
		const newContent = content.replace(/#000000\b/gm, app.primaryColor).replace(/#ffffff\b/gm, app.secondaryColor) // used to use `simple-svg-tools`, but not so good
		fs.mkdirSync(logoConfig.outputDir(app.name), {recursive: true})
		fs.writeFileSync(svgFile, newContent, {encoding: 'utf-8'})

		logoConfig.allDimensions.forEach((dim) => {
			const pngFile = logoConfig.pngFile(app.name, dim)
			const inkArgs: string[] = [
				...(inkV < 1 ? ['--without-gui', '--export-png'] : ['--export-filename']),
				pngFile,
				'-w',
				dim.toString(),
				'-h',
				dim.toString(),
				svgFile,
			]
			log.info(`Converting \`${svgFile}\` to \`${pngFile}\``)
			log.assert(exec(inkExe, inkArgs).code === 0, `Command failed!`)
		})

		const pngFiles = logoConfig.faviconDimensions.map((dim) => logoConfig.pngFile(app.name, dim))
		const icoFile = logoConfig.icoFile(app.name)
		const imgArgs: string[] = [...pngFiles, icoFile]
		log.info(`Generating multi-page ICO file \`${icoFile}\``)
		log.assert(exec(imgExe, imgArgs).code === 0, `Command failed!`)
	})
}

function run(): void {
	const currentV = process.versions.node
	const targetV = pathConfig.boilerplateJSON?.engines?.node
	if (targetV) {
		log.assert(
			semver.satisfies(currentV, targetV),
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			`Node version \`${targetV}\` required`,
		)
	}

	const {argv} = yargs
		.wrap(Math.min(150, yargs.terminalWidth()))
		.parserConfiguration({'parse-numbers': false})
		.usage(
			`Usage: $0 <command> [options]...
Usage: $0 development|serving|production|public [options] [--] [app] [app] [app]...
Usage: $0 logo [--] [app] [app] [app]...
(Check file \`${__filename}\` for more details)`,
		)
		.command('development', '`development` mode')
		.command('serving', '`serving` mode')
		.command('production', '`production` mode')
		.command('public', '`public` mode')
		.command('logo', "Build logo (require Inkscape and ImageMagick's `convert` be in $PATH)")
		.describe('host', 'Binding host for `webpack-dev-server`')
		.describe('port', 'Binding port for `webpack-dev-server`')
		.describe('api', 'API URL prefix, will be available as global variable `CONFIG.api` in generated HTML')
		.number(['port'])
		.default('host', webConfig.defaultHost)
		.default('port', webConfig.defaultPort)
		.default('api', webConfig.defaultAPI)
		.help('help')
		.alias('host', 'b')
		.alias('port', 'p')
		.alias('api', 'i')
		.alias('help', 'h')

	const argvDash = argv._.map((f) => String(f))
	const [command, ...files] = argvDash

	switch (command) {
		case 'development':
		case 'serving':
		case 'production':
		case 'public':
			runWebpack(command, argv, files)
			break

		case 'logo':
			runLogo(files)
			break

		default:
			log.assert(false, command ? `Invalid command \`${command}\`` : 'Command not specified')
			break
	}
}

run()
