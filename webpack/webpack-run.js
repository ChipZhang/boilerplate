"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWebpackConfig = void 0;
const webpack_1 = __importDefault(require("webpack"));
const webpack_dev_server_1 = __importDefault(require("webpack-dev-server"));
const utils_1 = require("../utils");
const config_1 = require("../cli/config");
function runWebpackConfig(config) {
    const compiler = webpack_1.default(config);
    if (!config.devServer) {
        compiler.run((err, stats) => {
            if (err) {
                utils_1.log.assert(false, err);
            }
            if (stats) {
                const info = stats.toJson();
                if (stats.hasWarnings() && info.warnings) {
                    info.warnings.forEach((warning) => {
                        utils_1.log.warn(`${warning}\n`);
                    });
                }
                if (stats.hasErrors() && info.errors) {
                    info.errors.forEach((error) => {
                        utils_1.log.error(`${error}\n`);
                    });
                    utils_1.log.error('Failed to compile');
                    process.exitCode = 1;
                    return;
                }
                utils_1.log.info(`Managed to compile`);
                if (stats.endTime != null && stats.startTime != null) {
                    utils_1.log.info(`Cost ${Math.round((stats.endTime - stats.startTime) / 1000)} second(s)`);
                }
            }
        });
    }
    else {
        const host = config.devServer.host || config_1.webConfig.defaultHost;
        const port = config.devServer.port || config_1.webConfig.defaultPort;
        if (config.devServer.hot) {
            webpack_dev_server_1.default.addDevServerEntrypoints(config, config.devServer); // needed to enable HMR when using `webpack` node API
        }
        const server = new webpack_dev_server_1.default(compiler, config.devServer);
        server.listen(port, host /* callback is useless here */);
    }
}
exports.runWebpackConfig = runWebpackConfig;
