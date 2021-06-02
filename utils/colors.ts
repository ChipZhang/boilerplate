import chroma from 'chroma-js'
import invert from 'invert-color'

export function isValidColor(color: string): boolean {
	return !!color.toLowerCase().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
}

export function invertColor(color: string): string {
	return chroma
		.scale([invert(color), invert(color, true)])(0.7)
		.hex()
		.toUpperCase()
}
