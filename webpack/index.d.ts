/**
 * | mode of code | `NODE_ENV` & `BABEL_ENV`  | `webpack` or `webpack-dev-server` | minimized | source map | error overlay[^1] | SRI | hashing | React profiling | reports | live update | caching[^2] |
 * | ---          | ---                       | ---                               | ---       | ---        | ---               | --- | ---     | ---             | ---     | ---         | ---         |
 * | development  | development               | `webpack-dev-server`              | n         | y          | y                 | n   | n       | n               | n       | HMR         | y           |
 * | serving      | production                | `webpack-dev-server`              | n         | y          | n                 | n   | n       | y               | n       | HMR         | y           |
 * | production   | production                | `webpack`                         | n         | y          | n                 | y   | y       | y               | n       | n           | n           |
 * | public       | production                | `webpack`                         | y         | n          | n                 | y   | y       | n               | y       | n           | n           |
 *
 * [^1]: only specific for `error-overlay-webpack-plugin` (which is only working in NODE's development mode),
 * `webpack-dev-server`'s overlay are always enabled when serving
 *
 * [^2]: currently only `babel-loader`, `terser-webpack-plugin`, `css-minimizer-webpack-plugin` supports caching option
 */
/// <reference types="webpack-dev-server" />
import webpack from 'webpack';
/**
 * @param {object} env reflects what is passed to `webpack` with argument `--env`
 * @param {object} argv reflects the command line passed to `webpack`
 */
declare function webpackConfigFunc(env: any, argv: any): webpack.Configuration;
declare type WebpackConfigHook = (config: webpack.Configuration) => webpack.Configuration;
export default function webpackConfigHook(hook?: undefined | WebpackConfigHook): typeof webpackConfigFunc;
export {};
