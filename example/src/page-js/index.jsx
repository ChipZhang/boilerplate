import * as _ from 'lodash'
import 'alias-name'
import * as PropTypes from 'prop-types'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import '../common/common'
import json from '../common/common.json'
//
import lessVars from '../style/vars.less'
import jsStaticFR from './js-static-full-refresh'
import jsStaticHMR from './js-static-hmr'
import './style-js-css.css'
import './style-js-less.less'
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

let isHotEnabled
let jsLazyFR
let jsLazyHMR

console.log('index.jsx loaded')
_.uniq([]) // test `babel-plugin-lodash`

function handleLazyLoadError(err) {
	if (err.name === 'ChunkLoadError') {
		alert(`Lazy JS failed to load:\n${err.request}`)
	} else if (err.code === 'CSS_CHUNK_LOAD_FAILED') {
		alert(`Lazy CSS failed to load:\n${err.request}`)
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

	module.hot.accept('./js-static-hmr', () => {
		console.log('-----updating hot module-----')
		jsStaticHMR()
	})

	module.hot.accept('./js-lazy-hmr', () => {
		console.log('-----updating hot module-----')

		// this works
		importName('./js-lazy-hmr', 'js-lazy-hmr')
			.then((module) => {
				jsLazyHMR = module.default
				jsLazyHMR()
			})
			.catch(() => alert('Failed to load HMR'))

		// this does not work
		// jsLazyHMR()
	})
} else {
	isHotEnabled = false
}

function Button({onClick, children}) {
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

	jsLazyFR = () => {
		importName('./js-lazy-full-refresh', 'js-lazy-full-refresh')
			.then((module) => {
				console.log('`js-lazy-full-refresh` Loaded')
				jsLazyFR = module.default
				jsLazyFR()
			})
			.catch(handleLazyLoadError)
	}

	jsLazyHMR = () => {
		importName('./js-lazy-hmr', 'js-lazy-hmr')
			.then((module) => {
				console.log('`js-lazy-hmr` Loaded')
				jsLazyHMR = module.default
				jsLazyHMR()
			})
			.catch(handleLazyLoadError)
	}

	render() {
		return (
			<>
				<Button onClick={this.cssLazy}>Load: CSS Lazy</Button>
				<Button onClick={this.lessLazy}>Load: LESS Lazy</Button>
				<Button onClick={this.jsLazyFR}>Load & Run: JS Lazy (FR)</Button>
				<Button onClick={this.jsLazyHMR}>Load & Run: JS Lazy (HRM)</Button>
				<br />
				<Button onClick={() => jsStaticFR && jsStaticFR()}>Run: JS Static (FR)</Button>
				<Button onClick={() => jsStaticHMR && jsStaticHMR()}>Run: JS Static (HMR)</Button>
				<Button onClick={() => jsLazyFR && jsLazyFR()}>Run: JS Lazy (FR)</Button>
				<Button onClick={() => jsLazyHMR && jsLazyHMR()}>Run: JS Lazy (HRM)</Button>
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
			<h2>index.jsx</h2>
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
