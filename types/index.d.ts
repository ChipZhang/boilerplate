declare type AppConfig = {
	mode: string
	isModeDevelopment: boolean
	isModeServing: boolean
	isModeProduction: boolean
	isModePublic: boolean
	version: string
	built: string
	enableErrorOverlay: boolean
	api: string

	prefix: string
	copyright: string
	app: string
	title: string
	primaryColor: string
	secondaryColor: string
	[configVars: string]: any
}

declare function importName(path: string, webpackChunkName: string): Promise<any>

interface Window {
	CONFIG: AppConfig
}

// declare global {
// 	declare function importName(path: string, webpackChunkName: string): Promise<any>
//
// 	interface Window {
// 		CONFIG: AppConfig
// 	}
// }

declare module '*.svg' {
	import React from 'react'

	const SVG: React.VFC<React.SVGProps<SVGSVGElement>>
	export default SVG
}

declare module '*.txt' {
	const content: string
	export default content
}

declare module '*.md' {
	const content: string
	export default content
}

declare module '*.webp' {
	const path: string
	export default path
}

declare module '*.jpg' {
	const path: string
	export default path
}

declare module '*.jpeg' {
	const path: string
	export default path
}

declare module '*.png' {
	const path: string
	export default path
}

declare module '*.gif' {
	const path: string
	export default path
}

declare module '*.bmp' {
	const path: string
	export default path
}

declare module '*.tif' {
	const path: string
	export default path
}

declare module '*.tiff' {
	const path: string
	export default path
}

// declare module 'static/loaded/*' {
// 	const path: string
// 	export default path
// }
