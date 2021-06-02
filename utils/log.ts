/* eslint-disable no-console */

import chalk from 'chalk'

type LogFunc = (...msg: any[]) => void

let enabled = true

function disable(): void {
	enabled = false
}

function enable(): void {
	enabled = true
}

function isDebugEnabled(): boolean {
	switch (process.env.DEBUG?.toLowerCase() || '') {
		case '':
		case '0':
		case 'n':
		case 'no':
		case 'off':
			return false
		default:
			return true
	}
}

// used to make the first parameter of console.xxx is string, thus enabling formatting when needed
function helper(color: string, ...msg: any[]): {first: string; rest: any[]} {
	if (msg.length > 0 && typeof msg[0] === 'string') {
		return {first: `${color} ${msg[0]}`, rest: msg.slice(1)}
	}
	return {first: color, rest: msg}
}

function print(...msg: any[]): void {
	if (!enabled) {
		return
	}
	console.log(...msg)
}

function debug(...msg: any[]): void {
	if (!enabled) {
		return
	}
	if (isDebugEnabled()) {
		const {first, rest} = helper(chalk.bgBlue.white('DBG'), ...msg)
		console.debug(first, ...rest)
	}
}

function info(...msg: any[]): void {
	if (!enabled) {
		return
	}
	const {first, rest} = helper(chalk.bgGreen.black('INF'), ...msg)
	console.info(first, ...rest)
}

function warn(...msg: any[]): void {
	if (!enabled) {
		return
	}
	const {first, rest} = helper(chalk.bgYellow.black('WRN'), ...msg)
	console.warn(first, ...rest)
}

function error(...msg: any[]): void {
	if (!enabled) {
		return
	}
	const {first, rest} = helper(chalk.bgRed.white('ERR'), ...msg)
	console.error(first, ...rest)
}

function assert(condition: boolean, err: string | Error): asserts condition {
	if (!condition) {
		console.error(chalk.bgRed.white('FTL:'))

		if (typeof err === 'string') {
			throw new Error(err)
		} else {
			throw err
		}
	}
}

export const log: {
	disable: () => void
	enable: () => void
	isDebugEnabled: typeof isDebugEnabled
	print: LogFunc
	debug: LogFunc
	info: LogFunc
	warn: LogFunc
	error: LogFunc
	assert: typeof assert
} = {
	disable,
	enable,
	isDebugEnabled,
	print,
	debug,
	info,
	warn,
	error,
	assert,
}
