#!/usr/bin/env node
/**
 * | command     | `NODE_ENV`  | `BABEL_ENV` |
 * | ---         | ---         | ---         |
 * | development | development | development |
 * | serving     | production  | production  |
 * | production  | production  | production  |
 * | public      | production  | production  |
 * | logo        |             |             |
 *
 * ways to invoke:
 *
 * - `node <this-script-file> <command> [options] [--] [<app1[.app2]>]] [<app3[.app4]>]]...`
 *
 * - `npx <bin-name> <command> [options] [--] [<app1[.app2]>]] [<app3[.app4]>]]...`
 * (`<bin-name>` is specified in `bin` section in `package.json` of this package, this script file will be symlinked in `node_modules/.bin` when installed)
 *
 * - `npm run <command> -- [options] [--] [<app1[.app2]>]] [<app3[.app4]>]]...`
 * (if `<command>` is specified in `scripts` section in `package.json`; `--` followed by `<command>` is required)
 *
 * - directly invoke `<webpack|webpack-dev-server> [--config <`webpack.config.js` file>] --env.mode <mode> [--host <host>] [--port <port>] [--env.api <url>] [<--env.apps> <app1[.app2]> [<--env.apps> <app3[.app4]>]...]`
 */
export {};
