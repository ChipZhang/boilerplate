module.exports = {
	// the url path prefix used when visiting pages/files in browser
	// do not affect the files output path in file system
	// only effective for `production` and `public` modes
	// i.e. for `development` and `serving` modes, prefix is `/`
	prefix: '/prefix/',

	// additional paths which will be applied with the same loaders rules as directory `src`
	// when using various webpack source loaders
	additionalSourcePaths: [],

	// copyright string, it will be prepended to the generated assets
	copyright: 'Copyright',

	// attributes to add to JS/CSS asset tags
	scriptAttribs: {
		onload: 'console.log("JS loaded", this.src)',
		onerror: 'alert("Entry JS failed to load: " + this.src)',
	},
	styleAttribs: {
		onload: 'console.log("CSS loaded", this.href)',
		onerror: 'alert("Entry CSS failed to load: " + this.href)',
	},

	// defining apps, each app contains a single page or multiple pages
	apps: [
		{
			// can be used in command line via `--apps <app1[.app2]>`
			// also used as the logo output folder name
			// should only contains: `a-z`, `0-9`, `_`, `-`
			name: 'example-app',
			primaryColor: '#248',
			secondaryColor: 'auto',
			configVars: {myVar1: 111, myVar2: '222'},
			// LESS vars must be defined here in camelCase, will be available in kebab case in LESS files
			lessVars: {myVar1: '#333', myVar2: '#ccc'},
			pages: [
				{
					// used in HTML title
					title: 'Page JS',
					// the path of the generated HTML file, must ends with `.html`
					// should only contains (without the suffix `.html`): `a-z`, `0-9`, `_`, `-` `/`
					html: 'output-page-js/index.html',
					// relative to the `src` directory
					// can be file (with or without the extension), or directory
					source: 'page-js',
				},
				{
					title: 'Page TS',
					html: 'output-page-ts/index.html',
					source: 'page-ts',
				},
			],
		},
	],
}
