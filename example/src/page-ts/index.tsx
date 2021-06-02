import * as _ from 'lodash'
import 'alias-name'
import * as PropTypes from 'prop-types'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import '../common/common'
// @ts-ignore: allow default import
import json from '../common/common.json'
//
import lessVars from '../style/vars.less'
import tsStaticFR from './ts-static-full-refresh'
import tsStaticHMR from './ts-static-hmr'
import './style-ts-css.css'
import './style-ts-less.less'
import '../style/common.css'
import '../style/css-static.css'
import '../style/less-static.less'
//
import loadedPNG from 'static/loaded/file.png'
import LoadedSVG from 'static/loaded/file.svg'
import loadedTXT from 'static/loaded/file.txt'
import othersPNG from 'static/others/file.png'
import OthersSVG from 'static/others/file.svg'
import othersTXT from 'static/others/file.txt'

const pngURLPath = `${window.CONFIG.prefix}logo/example-app/logo-72.png`

let isHotEnabled: boolean
let tsLazyFR: () => void
let tsLazyHMR: () => void

console.log('index.tsx loaded')
_.uniq([]) // test `babel-plugin-lodash`

function handleLazyLoadError(err: Error): void {
	interface ChunkJSError extends Error {
		request: string
	}
	interface ChunkCSSError extends Error {
		request: string
		code: string
	}
	const jsErr = err as ChunkJSError
	const cssErr = err as ChunkCSSError

	if (jsErr.name === 'ChunkLoadError') {
		alert(`Lazy JS failed to load:\n${jsErr.request}`)
	} else if (cssErr.code === 'CSS_CHUNK_LOAD_FAILED') {
		alert(`Lazy CSS failed to load:\n${cssErr.request}`)
	} else {
		alert(
			`Other Error:
err.name = \`${err.name}\`
err.message = \`${err.message}\``,
		)
	}
}

if (module && module.hot) {
	isHotEnabled = true

	module.hot.accept('./ts-static-hmr', () => {
		console.log('-----updating hot module-----')
		tsStaticHMR()
	})

	module.hot.accept('./ts-lazy-hmr', () => {
		console.log('-----updating hot module-----')

		// this works
		importName('./ts-lazy-hmr', 'ts-lazy-hmr')
			.then((module) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				tsLazyHMR = module.default
				tsLazyHMR()
			})
			.catch(() => alert('Failed to load HMR'))

		// this does not work
		// tsLazyHMR()
	})
} else {
	isHotEnabled = false
}

function Button({onClick, children}: {onClick: React.MouseEventHandler<HTMLInputElement>; children: string}) {
	return <input style={{margin: '4px'}} type='button' onClick={onClick} value={children} />
}

Button.propTypes = {
	onClick: PropTypes.func.isRequired,
	children: PropTypes.node,
}
Button.defaultProps = {
	children: undefined,
}

function TestStyle() {
	const style = {
		display: 'inline-block',
		margin: 8,
		width: 196,
		height: 196,
		borderColor: 'black',
		borderWidth: 8,
		borderStyle: 'solid',
	}

	return (
		<>
			<div style={style} className='css-static'>
				for css-static
			</div>
			<div style={style} className='css-lazy'>
				for css-lazy
			</div>
			<br />
			<div style={style} className='less-static'>
				for less-static
			</div>
			<div style={style} className='less-lazy'>
				for less-lazy
			</div>
			<br />
			lessVars:
			<br />
			<pre>{JSON.stringify(lessVars).replaceAll(',', '\n')}</pre>
		</>
	)
}

class TestLazy extends React.Component {
	cssLazy = () => {
		importName('../style/css-lazy.css', 'css-lazy')
			.then(() => {
				console.log('`css-lazy.css` Loaded')
			})
			.catch(handleLazyLoadError)
	}

	lessLazy = () => {
		importName('../style/less-lazy.less', 'less-lazy')
			.then(() => {
				console.log('`less-lazy.less` Loaded')
			})
			.catch(handleLazyLoadError)
	}

	tsLazyFR = () => {
		importName('./ts-lazy-full-refresh', 'ts-lazy-full-refresh')
			.then((module) => {
				console.log('`ts-lazy-full-refresh` Loaded')
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				tsLazyFR = module.default
				tsLazyFR()
			})
			.catch(handleLazyLoadError)
	}

	tsLazyHMR = () => {
		importName('./ts-lazy-hmr', 'ts-lazy-hmr')
			.then((module) => {
				console.log('`ts-lazy-hmr` Loaded')
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				tsLazyHMR = module.default
				tsLazyHMR()
			})
			.catch(handleLazyLoadError)
	}

	render() {
		return (
			<>
				<Button onClick={this.cssLazy}>Load: CSS Lazy</Button>
				<Button onClick={this.lessLazy}>Load: LESS Lazy</Button>
				<Button onClick={this.tsLazyFR}>Load & Run: TS Lazy (FR)</Button>
				<Button onClick={this.tsLazyHMR}>Load & Run: TS Lazy (HRM)</Button>
				<br />
				<Button onClick={() => tsStaticFR && tsStaticFR()}>Run: TS Static (FR)</Button>
				<Button onClick={() => tsStaticHMR && tsStaticHMR()}>Run: TS Static (HMR)</Button>
				<Button onClick={() => tsLazyFR && tsLazyFR()}>Run: TS Lazy (FR)</Button>
				<Button onClick={() => tsLazyHMR && tsLazyHMR()}>Run: TS Lazy (HRM)</Button>
			</>
		)
	}
}

function TestLoaders() {
	return (
		<>
			<h4>JSON</h4>
			<pre>{JSON.stringify(json)}</pre>
			<h4>
				Use URL path as {'<'}img src{'>'}
			</h4>
			<pre>{pngURLPath}</pre>
			<img src={pngURLPath} alt='' />
			<br />
			<h4>Raw loader</h4>
			loadedTXT:
			<br />
			<pre>{loadedTXT}</pre>
			othersTXT:
			<br />
			<pre>{othersTXT}</pre>
			<h4>File loader</h4>
			loadedPNG:
			<br />
			<pre>{loadedPNG}</pre>
			<img src={loadedPNG} alt='' />
			<br />
			othersPNG:
			<br />
			<pre>{othersPNG}</pre>
			<img src={othersPNG} alt='' />
			<br />
			<h4>SVG loader (/static/others)</h4>
			text size
			<OthersSVG />
			text size
			<h4>SVG loader (/static/loaded)</h4>
			text size
			<LoadedSVG />
			text size
			<br />
			<div style={{fontSize: 32}}>
				text size
				<LoadedSVG />
				text size
			</div>
			text size
			<LoadedSVG width={32} height={32} />
			text size
		</>
	)
}

function App() {
	return (
		<>
			<h2>index.tsx</h2>
			<pre>{navigator.userAgent}</pre>
			<h2>CONFIG</h2>
			<pre>{JSON.stringify(window.CONFIG).replaceAll(',', '\n')}</pre>
			<h2>`module.hot` enabled?</h2>
			{isHotEnabled.toString()}
			<h2>Example Usage of CSS / LESS</h2>
			<TestStyle />
			<h2>Example Usage of Lazy / Dynamic Import</h2>
			<TestLazy />
			<h2>Example Usage of Various Loaders</h2>
			<TestLoaders />
		</>
	)
}

if (document.getElementById('app-root')) {
	ReactDOM.render(<App />, document.getElementById('app-root'))
} else {
	console.error('No `app-root` element')
}
