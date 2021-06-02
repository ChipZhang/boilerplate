import fs from 'fs'
import path from 'path'
import {log} from './log'

type FileType = 'file' | 'directory' | 'symlink' | 'others'

// if the path does not exist, it returns false
// for broken symlinks, it returns `symlink` as well
export function testFileSync(p: string): false | FileType {
	try {
		const stats = fs.lstatSync(p)
		if (stats.isDirectory()) {
			return 'directory'
		}
		if (stats.isFile()) {
			return 'file'
		}
		if (stats.isSymbolicLink()) {
			return 'symlink'
		}
		return 'others'
	} catch (err) {
		if (err.code === 'ENOENT') {
			return false
		}
		throw err
	}
}

// if the path is not a directory, returns undefined
// returned `file` has prefix `p`
export function listDirSync(p: string): undefined | {file: string; type: FileType}[] {
	if (testFileSync(p) !== 'directory') {
		return undefined
	}

	const files = fs.readdirSync(p)
	return files
		.map((f) => {
			f = path.join(p, f)
			return {file: f, type: testFileSync(f)}
		})
		.filter(({type}) => type !== false) as {file: string; type: FileType}[]
}

// if the source path is not a file, the program exits with errors
// the meta-data atime, mtime, mode of `dst` is synced with `src`
export function copyFileSync(src: string, dst: string): void {
	log.assert(testFileSync(src) === 'file', `\`${src}\` is not a file`)

	if (testFileSync(dst) === 'file') {
		fs.unlinkSync(dst)
	}
	fs.copyFileSync(src, dst)
	const stats = fs.statSync(src)
	const {mode} = stats
	fs.chmodSync(dst, mode)
	fs.utimesSync(dst, stats.atime, stats.mtime)
}

// symlinks are ignored
export function copyDirRecursivelySync(src: string, dst: string, ignore: string[]): void {
	fs.mkdirSync(dst, {recursive: true})

	listDirSync(src)?.forEach(({file, type}) => {
		if (ignore.includes(file)) {
			return
		}

		const d = path.join(dst, path.basename(file))
		switch (type) {
			case 'file':
				copyFileSync(file, d)
				break
			case 'directory':
				copyDirRecursivelySync(file, d, ignore)
				break
			default:
				log.warn(`Ignored \`${file}\` when copying \`${src}\` to \`${dst}\``)
		}
	})
}
