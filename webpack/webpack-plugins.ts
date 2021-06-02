/* eslint-disable no-underscore-dangle */

import * as _ from 'lodash'
import webpack from 'webpack'
import HTMLPlugin, {HtmlTagObject} from 'html-webpack-plugin'
import pretty from 'pretty'
import {log} from '../utils'
import {logoConfig} from '../cli/config'

export class DebugModulesChunksPlugin {
	apply(compiler: webpack.Compiler): void {
		compiler.hooks.emit.tap(this.constructor.name, (compilation) => {
			const msg = 'Unexpected webpack API'

			function debugChunk(c: any): {[p: string]: any} {
				if (c == null) {
					return c
				}
				log.assert(c.constructor.name === 'Chunk', msg)

				let entry: undefined | string
				if (c.hasEntryModule()) {
					log.assert(c.entryModule?.constructor.name === 'MultiModule', msg)
					log.assert(typeof c.entryModule.name === 'string', msg)
					entry = c.entryModule.name
				}

				return {
					name: c.name,
					id: c.id,
					files: c.files, // .join(' '),
					entry,
					chunkReason: c.chunkReason,
				}
			}

			function debugEntrypoint(ep: any): {[p: string]: any} {
				log.assert(ep?.constructor.name === 'Entrypoint', msg)
				log.assert(Array.isArray(ep.chunks), msg)

				return {
					name: ep.name,
					chunks: ep.chunks.map((c: any) => debugChunk(c)),
					runtimeChunk: debugChunk(ep.runtimeChunk),
				}
			}

			function debugModule(m: any): {[p: string]: any} {
				log.assert(m._chunks && typeof m._chunks[Symbol.iterator] === 'function', msg) // SortableSet

				return {
					constructor: m.constructor.name, // `MultiModule`, `NormalModule`, `CssModule`...
					name: m.name,
					id: m.id,
					type: m.type,
					depth: m.depth,
					source: m?._source?._name,
					sourceMap: m?.sourceMap?.sources,
					chunks: [...m._chunks].map((c: any) => debugChunk(c)),
					issuerModule: m.issuer && {id: m.issuer.id, name: m.issuer.name},
				}
			}

			log.debug(
				DebugModulesChunksPlugin.name,
				'Entry points count:',
				[...compilation.entrypoints.values()].length,
			)
			;[...compilation.entrypoints.values()].forEach((ep: any, i: number) =>
				log.debug(DebugModulesChunksPlugin.name, 'Entry point:', i, debugEntrypoint(ep)),
			)

			log.debug(DebugModulesChunksPlugin.name, 'Chunks count:', compilation.chunks.length)
			compilation.chunks.map((c: any, i: number) =>
				log.debug(DebugModulesChunksPlugin.name, 'Chunk:', i, debugChunk(c)),
			)

			log.debug(DebugModulesChunksPlugin.name, 'Modules count:', compilation.modules.length)
			compilation.modules.map((m: any, i: number) =>
				log.debug(DebugModulesChunksPlugin.name, 'Module:', i, debugModule(m)),
			)
		})
	}
}

export class DebugHTMLPlugin {
	apply(compiler: webpack.Compiler): void {
		compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {
			const title = (stage: string, outputName: string): string =>
				`${this.constructor.name} ${stage} ${outputName}`

			HTMLPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(
				this.constructor.name,
				(
					data: {
						assets: {
							publicPath: string
							js: Array<string>
							css: Array<string>
							favicon?: string
							manifest?: string
						}
						outputName: string
						plugin: HTMLPlugin
					},
					cb,
				) => {
					const {assets, outputName, plugin, ...more} = data
					log.debug(
						'%s\n%o\n%o\n%o',
						title('beforeAssetTagGeneration', outputName),
						{plugin},
						{assets},
						{more},
					)
					cb(null, data)
				},
			)

			HTMLPlugin.getHooks(compilation).alterAssetTags.tapAsync(
				this.constructor.name,
				(
					data: {
						assetTags: {
							scripts: HtmlTagObject[]
							styles: HtmlTagObject[]
							meta: HtmlTagObject[]
						}
						outputName: string
						plugin: HTMLPlugin
					},
					cb,
				) => {
					const {assetTags, outputName, ...more} = data
					log.debug(
						'%s\n%o\n%o\n%o\n%o',
						title('alterAssetTags', outputName),
						{scriptTags: assetTags.scripts},
						{styleTags: assetTags.styles},
						{metaTags: assetTags.meta},
						{more},
					)
					cb(null, data)
				},
			)

			HTMLPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
				this.constructor.name,
				(
					data: {
						headTags: HtmlTagObject[]
						bodyTags: HtmlTagObject[]
						outputName: string
						plugin: HTMLPlugin
					},
					cb,
				) => {
					const {headTags, bodyTags, outputName, ...more} = data
					log.debug(
						'%s\n%o\n%o\n%o',
						title('alterAssetTagGroups', outputName),
						{headTags},
						{bodyTags},
						{more},
					)
					cb(null, data)
				},
			)

			HTMLPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
				this.constructor.name,
				(
					data: {
						html: string
						headTags: HtmlTagObject[]
						bodyTags: HtmlTagObject[]
						outputName: string
						plugin: HTMLPlugin
					},
					cb,
				) => {
					const {html, headTags, bodyTags, outputName, ...more} = data
					log.debug(
						'%s\n%o\n%o\n%o\n%o',
						title('afterTemplateExecution', outputName),
						{html: `${html.substr(0, 64)}...`},
						{headTags},
						{bodyTags},
						{more},
					)
					cb(null, data)
				},
			)

			HTMLPlugin.getHooks(compilation).beforeEmit.tapAsync(
				this.constructor.name,
				(
					data: {
						html: string
						outputName: string
						plugin: HTMLPlugin
					},
					cb,
				) => {
					const {html, outputName, ...more} = data
					log.debug('%s\n%o\n%o', title('beforeEmit', outputName), {html: `${html.substr(0, 64)}...`}, {more})
					cb(null, data)
				},
			)

			HTMLPlugin.getHooks(compilation).afterEmit.tapAsync(
				this.constructor.name,
				(
					data: {
						outputName: string
						plugin: HTMLPlugin
					},
					cb,
				) => {
					const {outputName, ...more} = data
					log.debug('%s\n%o', title('afterEmit', outputName), {more})
					cb(null, data)
				},
			)
		})
	}
}

export class DefaultHTMLPlugin {
	private readonly consoleLog: any

	private readonly copyright: string

	private readonly servingPrefix: string

	private readonly beautify: boolean

	constructor(
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		consoleLog: any,
		copyright: string,
		servingPrefix: string,
		beautify: boolean,
	) {
		this.consoleLog = consoleLog
		this.copyright = copyright
		this.servingPrefix = servingPrefix
		this.beautify = beautify
	}

	apply(compiler: webpack.Compiler): void {
		compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {
			HTMLPlugin.getHooks(compilation).alterAssetTags.tapAsync(
				this.constructor.name,
				(
					data: {
						assetTags: {
							scripts: HtmlTagObject[]
							styles: HtmlTagObject[]
							meta: HtmlTagObject[]
						}
						outputName: string
						plugin: HTMLPlugin
					},
					cb,
				) => {
					const {meta} = data.assetTags
					meta.unshift(
						{tagName: 'meta', voidTag: true, attributes: {charset: 'utf-8'}},
						{
							tagName: 'meta',
							voidTag: true,
							attributes: {'http-equiv': 'Content-Type', 'content': 'text/html; charset=utf-8'},
						},
						{
							tagName: 'meta',
							voidTag: true,
							attributes: {'http-equiv': 'X-UA-Compatible', 'content': 'ie=edge,chrome=1'},
						},
						{
							tagName: 'meta',
							voidTag: true,
							attributes: {name: 'viewport', content: 'width=device-width, initial-scale=1.0'},
						},
					)
					cb(null, data)
				},
			)

			HTMLPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
				this.constructor.name,
				(
					data: {
						headTags: HtmlTagObject[]
						bodyTags: HtmlTagObject[]
						outputName: string
						plugin: HTMLPlugin
					},
					cb,
				) => {
					const {headTags, bodyTags, plugin} = data

					const options = (plugin as any)?.options as HTMLPlugin.Options
					log.assert(options?.constructor === Object, 'Changed `html-webpack-plugin` API')
					const {CONFIG} = options.templateParameters as any
					const logoGenerated = options.logoGenerated as boolean
					const appName = options.appName as string
					const primaryColor = options.primaryColor as string

					const js = `window.CONFIG = ${JSON.stringify(CONFIG)}
if (console) {
	if (console.table) {
		console.table(${JSON.stringify(this.consoleLog)})
	} else if (console.log) {
		console.log(${JSON.stringify(this.consoleLog)})
	}
}`

					headTags.push({
						tagName: 'title',
						voidTag: false,
						attributes: {},
						innerHTML: _.escape(options.title),
					})

					// handle favicons manually rather than using `favicons-webpack-plugin`, which runs too slowly, also check `./scripts.js`
					headTags.push({
						tagName: 'meta',
						voidTag: true,
						attributes: {name: 'theme-color', content: primaryColor},
					})
					if (logoGenerated) {
						headTags.push(
							{
								tagName: 'link',
								voidTag: true,
								attributes: {
									rel: 'shortcut icon',
									href: logoConfig.icoFileURLPath(this.servingPrefix, appName),
								},
							},
							...logoConfig.faviconDimensions.map((dim) => ({
								tagName: 'link',
								voidTag: true,
								attributes: {
									rel: 'icon',
									type: 'image/png',
									sizes: `${dim}x${dim}`,
									href: logoConfig.pngFileURLPath(this.servingPrefix, appName, dim),
								},
							})),
							...logoConfig.appleIconDimensions.map((dim) => ({
								tagName: 'link',
								voidTag: true,
								attributes: {
									rel: 'apple-touch-icon',
									sizes: `${dim}x${dim}`,
									href: logoConfig.pngFileURLPath(this.servingPrefix, appName, dim),
								},
							})),
						)
					}

					headTags.push({
						tagName: 'script',
						voidTag: false,
						attributes: {type: 'text/javascript'},
						innerHTML: js,
					})

					bodyTags.unshift(
						{tagName: 'div', voidTag: false, attributes: {id: 'app-root'}},
						{
							tagName: 'noscript',
							voidTag: false,
							attributes: {type: 'text/javascript'},
							innerHTML: '<p>JavaScript 已被禁用</p>',
						},
					)

					cb(null, data)
				},
			)

			HTMLPlugin.getHooks(compilation).beforeEmit.tapAsync(
				this.constructor.name,
				(
					data: {
						html: string
						outputName: string
						plugin: HTMLPlugin
					},
					cb,
				) => {
					let cr = _.escape(this.copyright)
					if (cr.indexOf('\n') >= 0) {
						cr = cr.replace(/^/gm, '  -- ')
						cr = `\n${cr}\n`
					} else {
						cr = ` ${cr} `
					}
					data.html = `<!--!${cr}-->\n${data.html}`

					if (this.beautify) {
						data.html = pretty(data.html)
					}
					cb(null, data)
				},
			)
		})
	}
}
