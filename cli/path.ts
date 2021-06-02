import path from 'path'
import findRoot from 'find-root'
import {log} from '../utils'

// @ts-ignore: no type declarations
process.traceDeprecation = true

export function loadConfig(file: string): any {
	let o: any
	try {
		o = require(file) // eslint-disable-line global-require
		return o
	} catch (err: any) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		log.assert(false, `Failed to load file \`${file}\`: ${err}`)
		return undefined
	}
}

export const packageRoot = findRoot(process.cwd())
export const packageJSON = loadConfig(path.join(packageRoot, 'package.json'))
export const boilerplateRoot = findRoot(__filename)
export const boilerplateJSON = loadConfig(path.join(boilerplateRoot, 'package.json'))
// look for environment variable `CONTENT_ROOT` first, then `contentRoot` key in `package.json` file
const contentRootConfig = process.env.CONTENT_ROOT != null ? process.env.CONTENT_ROOT : packageJSON?.contentRoot
export const contentRootFolder = (typeof contentRootConfig === 'string' ? contentRootConfig : '')
	.replace(/[\\/]+/g, '/')
	.replace(/^\/|\/$/g, '')
	.replace(/\//g, path.sep)
export const contentRoot = path.join(packageRoot, contentRootFolder)

export const configFile = path.join(contentRoot, 'config.js')
export const configFileTypescriptNode = path.join(contentRoot, 'tsconfig.node.json')
export const configFileTypescriptReact = path.join(contentRoot, 'tsconfig.json')
export const configFileWebpack = path.join(contentRoot, 'webpack.config.js')
export const configFileBabel = path.join(contentRoot, 'babel.config.js')
export const configFilePostCSS = path.join(contentRoot, 'postcss.config.js')

export const buildFolder = 'build' // relative to `contentRoot`
export const staticFolder = 'static' // relative to `contentRoot`
export const srcFolder = 'src' // relative to `contentRoot`
export const reportFolder = 'report' // relative to `buildDir`
export const loadedStaticFolder = 'loaded' // relative to `staticFolder`
export const logoFolder = 'logo' // relative to `staticFolder`

export const buildDir = (mode: string): string => path.join(contentRoot, buildFolder, mode)
export const staticDir = path.join(contentRoot, staticFolder)
export const srcDir = path.join(contentRoot, srcFolder)
export const reportDir = (mode: string): string => path.join(buildDir(mode), reportFolder)
export const loadedStaticDir = path.join(staticDir, loadedStaticFolder)
export const logoDir = path.join(staticDir, logoFolder)
