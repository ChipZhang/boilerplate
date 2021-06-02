import * as _ from 'lodash'
import path from 'path'
import {isCamelCase, camelCaseToKebabCase} from '@chipzhang/webpack-less-vars-loader/utils'
import {log, isValidColor, invertColor} from '../utils'
import {
	loadConfig,
	packageRoot,
	packageJSON,
	boilerplateRoot,
	boilerplateJSON,
	contentRootFolder,
	contentRoot,
	configFile,
	configFileTypescriptReact,
	configFileBabel,
	configFilePostCSS,
	reportFolder,
	loadedStaticFolder,
	logoFolder,
	buildDir,
	staticDir,
	srcDir,
	reportDir,
	loadedStaticDir,
	logoDir,
} from './path'
import {TagAttributes} from '@chipzhang/webpack-asset-attributes-plugin'

// region parse `config.js`

function invalidConfig(msg: string): string {
	if (msg) {
		msg = `: ${msg}`
	}
	return `Invalid configuration file \`${configFile}\`${msg}`
}

function invalidConfigKey(key: string): string {
	return invalidConfig(`Value for key \`${key}\` is invalid`)
}

function invalidConfigApp(app: string, key: string): string {
	return invalidConfig(`Value for key \`${key}\` of app \`${app}\` is invalid`)
}

function invalidConfigPage(app: string, key: string): string {
	return invalidConfig(`Value for key \`${key}\` of page of app \`${app}\` is invalid`)
}

function getStringConfig(
	value: any,
	defaultValue: undefined | string,
	check: (v: string) => boolean,
	message: string,
): string {
	if (value === undefined) {
		value = defaultValue
	}
	log.assert(typeof value === 'string' && check(value), message)
	return value
}

function getObjectConfig(
	value: any,
	defaultValue: undefined | Record<string, any>,
	check: (v: Record<string, any>) => boolean,
	message: string,
): Record<string, unknown> {
	if (value === undefined) {
		value = defaultValue
	}
	log.assert(value?.constructor === Object && check(value), message)
	return value
}

function getAnyArrayConfig(
	value: any,
	defaultValue: undefined | any[],
	check: (v: any[]) => boolean,
	message: string,
): any[] {
	if (value === undefined) {
		value = defaultValue
	}
	log.assert(Array.isArray(value) && check(value), message)
	return value
}

function getStringArrayConfig(
	value: any,
	defaultValue: undefined | string[],
	check: (v: string[]) => boolean,
	message: string,
): string[] {
	if (value === undefined) {
		value = defaultValue
	}
	log.assert(Array.isArray(value) && value.every((v) => typeof v === 'string') && check(value), message)
	return value
}

const config = loadConfig(configFile)
log.assert(config?.constructor === Object, invalidConfig(''))

const prefix = getStringConfig(
	config.prefix,
	'/',
	(prefix) => prefix.startsWith('/') && prefix.endsWith('/'),
	invalidConfigKey('prefix'),
)
const additionalSourcePaths = getStringArrayConfig(
	config.additionalSourcePaths,
	[],
	() => true,
	invalidConfigKey('additionalSourcePaths'),
)
const copyright = getStringConfig(
	config.copyright,
	`© ${new Date().getFullYear()}`,
	(copyright) => copyright !== '',
	invalidConfigKey('copyright'),
)
const scriptAttribs = getObjectConfig(
	config.scriptAttribs,
	{},
	(scriptAttribs) => Object.values(scriptAttribs).every((v) => typeof v === 'string' || typeof v === 'boolean'),
	invalidConfigKey('apps'),
) as TagAttributes
const styleAttribs = getObjectConfig(
	config.styleAttribs,
	{},
	(styleAttribs) => Object.values(styleAttribs).every((v) => typeof v === 'string' || typeof v === 'boolean'),
	invalidConfigKey('apps'),
) as TagAttributes
const appsConfig = getAnyArrayConfig(config.apps, undefined, (apps) => apps.length > 0, invalidConfigKey('apps'))

// endregion

// region exporting configs

export const pathConfig = {
	packageRoot,
	packageJSON,
	boilerplateRoot,
	boilerplateJSON,
	contentRootFolder,
	contentRoot,

	buildDir,
	staticDir,
	srcPaths: [srcDir, ...additionalSourcePaths],
	polyfill: path.join(srcDir, 'polyfill'),
	reportFolder,
	reportDir,
	loadedStaticFolder,
	loadedStaticDir,

	configFileTypescriptReact,
	configFileBabel,
	configFilePostCSS,
}

log.debug('pathConfig:', {
	packageRoot: pathConfig.packageRoot,
	boilerplateRoot: pathConfig.boilerplateRoot,
	contentRoot: pathConfig.contentRoot,
	buildDir: pathConfig.buildDir('<mode>'),
	staticDir: pathConfig.staticDir,
	srcPaths: pathConfig.srcPaths,
	polyfill: pathConfig.polyfill,
	reportDir: pathConfig.reportDir('<mode>'),
})

const faviconDimensions = [16, 32, 48]
const appleIconDimensions = [57, 60, 72, 76, 114, 120, 144, 152, 167, 180, 1024]
const allDimensions = _.uniq(_.concat(faviconDimensions, appleIconDimensions))

export const logoConfig = {
	faviconDimensions,
	appleIconDimensions,
	allDimensions,

	templateSVGFile: path.join(srcDir, 'logo.svg'),

	outputDir(app: string): string {
		return path.join(logoDir, app)
	},
	svgFile(app: string): string {
		return path.join(logoDir, app, 'logo.svg')
	},
	pngFile(app: string, dimension: number): string {
		return path.join(logoDir, app, `logo-${dimension}.png`)
	},
	icoFile(app: string): string {
		return path.join(logoDir, app, 'logo.ico')
	},
	svgFileURLPath(servingPrefix: string, app: string): string {
		return `${servingPrefix}${logoFolder}/${app}/logo.svg`
	},
	pngFileURLPath(servingPrefix: string, app: string, dimension: number): string {
		return `${servingPrefix}${logoFolder}/${app}/logo-${dimension}.png`
	},
	icoFileURLPath(servingPrefix: string, app: string): string {
		return `${servingPrefix}${logoFolder}/${app}/logo.ico`
	},
}

log.debug('logoConfig:', {
	faviconDimensions: logoConfig.faviconDimensions,
	appleIconDimensions: logoConfig.appleIconDimensions,
	allDimensions: logoConfig.allDimensions,

	templateSVGFile: logoConfig.templateSVGFile,

	outputDir: logoConfig.outputDir('<app>'),
	svgFile: logoConfig.svgFile('<app>'),
	pngFile: logoConfig.pngFile('<app>', 32),
	icoFile: logoConfig.icoFile('<app>'),
	svgFileURLPath: logoConfig.svgFileURLPath(prefix, '<app>'),
	pngFileURLPath: logoConfig.pngFileURLPath(prefix, '<app>', 32),
	icoFileURLPath: logoConfig.icoFileURLPath(prefix, '<app>'),
})

export const webConfig = {
	defaultHost: 'localhost',
	defaultPort: 14339,
	defaultAPI: 'http://localhost:14338',

	prefix,
	copyright,
	scriptAttribs,
	styleAttribs,

	templateHTMLFile: path.join(srcDir, 'html.ejs'),
}

log.debug('webConfig:', webConfig)

export function checkEnv(expectedNodeEnv: string): void {
	function c(key: string) {
		log.assert(
			process.env[key] === undefined || process.env[key] === expectedNodeEnv,
			`Invalid environment \`${key}\`, should be \`${expectedNodeEnv}\` or unset`,
		)
	}

	c('NODE_ENV')
	c('BABEL_ENV') // if `BABEL_ENV` is not set, it defaults to `NODE_ENV`
	c('BROWSERSLIST_ENV') // if `BROWSERSLIST_ENV` is not set, it defaults to `NODE_ENV`

	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = expectedNodeEnv
	}
}

// endregion

// region parsing apps/pages

interface ConfigVars {
	[k: string]: null | undefined | boolean | number | string | {[k: string]: any}
}

interface LessVars {
	[k: string]: string
}

export interface App {
	name: string
	primaryColor: string
	secondaryColor: string
	configVars: ConfigVars
	lessVars: LessVars
	pages: Page[]
}

export interface Page {
	app: App
	title: string
	html: string
	asset: string // used for JS/CSS file title
	source: string
}

function validateLessVars(camelCase: LessVars): LessVars {
	const kebabCase: LessVars = {}
	Object.entries(camelCase).forEach(([k, v]) => {
		log.assert(isCamelCase(k), invalidConfigKey('lessVars'))
		kebabCase[camelCaseToKebabCase(k)] = v
	})
	return kebabCase
}

export function parseApps(appNames: null | undefined | string | string[]): App[] {
	const parsedApps: App[] = []

	appsConfig.forEach((appConfig) => {
		log.assert(appConfig?.constructor === Object, invalidConfig('apps'))
		const name = getStringConfig(
			appConfig.name,
			undefined,
			(name) => !!name.match(/^[a-z0-9_-]+$/) && !name.match(/^[0-9]+$/),
			invalidConfig(`\`name\` is invalid for one of the elements of \`apps\``),
		)
		const primaryColor = getStringConfig(
			appConfig.primaryColor,
			undefined,
			(primaryColor) => isValidColor(primaryColor),
			invalidConfigApp(name, 'primaryColor'),
		)
		let secondaryColor = getStringConfig(
			appConfig.secondaryColor,
			'auto',
			(secondaryColor) => isValidColor(secondaryColor) || secondaryColor === 'auto',
			invalidConfigKey('secondaryColor'),
		)
		if (secondaryColor === 'auto') {
			secondaryColor = invertColor(primaryColor)
		}
		const configVars = getObjectConfig(
			appConfig.configVars,
			{},
			(configVars) =>
				Object.values(configVars).every(
					(v) =>
						v == null ||
						typeof v === 'boolean' ||
						typeof v === 'number' ||
						typeof v === 'string' ||
						v?.constructor === Object,
				),
			invalidConfigKey('configVars'),
		) as ConfigVars
		let lessVars = getObjectConfig(
			appConfig.lessVars,
			{},
			(lessVars) => Object.values(lessVars).every((v) => typeof v === 'string'),
			invalidConfigKey('lessVars'),
		) as LessVars
		lessVars = validateLessVars(lessVars)
		const pages = getAnyArrayConfig(
			appConfig.pages,
			undefined,
			(pages) => pages.length > 0,
			invalidConfigKey('pages'),
		)

		const app: App = {
			name,
			primaryColor,
			secondaryColor,
			configVars,
			lessVars,
			pages: [],
		}
		parsedApps.push(app)

		pages.forEach((p) => {
			log.assert(p?.constructor === Object, invalidConfig('p'))

			const title = getStringConfig(p.title, undefined, (title) => title !== '', invalidConfigPage(name, 'title'))
			const html = getStringConfig(
				p.html,
				undefined,
				(entry) => !!entry.match(/^[a-z0-9_/-]+\.html$/),
				invalidConfigPage(name, 'html'),
			)
			let source = getStringConfig(
				p.source,
				undefined,
				(source) => source !== '',
				invalidConfigPage(name, 'source'),
			)
			source = path.join(srcDir, source)

			app.pages.push({
				app,
				title,
				html,
				asset: html.replace(/\.html$/, '').replace(/\//g, '.'),
				source,
			})
		})
	})

	const allApps = parsedApps.map((app) => app.name)
	const allPages = parsedApps.map((app) => app.pages).flat()
	const allHTML = allPages.map((p) => p.html)
	log.assert(allApps.length === _.uniq(allApps).length, invalidConfig('Duplicated app names'))
	log.assert(allHTML.length === _.uniq(allHTML).length, invalidConfig('Duplicated page HTML'))

	if (appNames == null) {
		appNames = ''
	} else if (Array.isArray(appNames)) {
		appNames = appNames.join(',')
	}
	appNames = appNames.split(',')
	appNames = _.uniq(appNames.map((name) => name.trim()).filter((entry) => entry !== ''))
	if (appNames.length === 0) {
		return parsedApps
	}

	let filtered: App[] = []
	appNames.forEach((n) => {
		const f = parsedApps.filter((app) => app.name === n)
		log.assert(f.length > 0, invalidConfig(`App \`${n}\` is not defined`))
		filtered = filtered.concat(f)
	})
	return filtered
}

log.debug('pages:', parseApps(null))

// endregion
