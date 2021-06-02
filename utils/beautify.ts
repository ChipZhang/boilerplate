import jsBeautify from 'js-beautify'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function beautify(value: any): string {
	return jsBeautify(JSON.stringify(value))
}
