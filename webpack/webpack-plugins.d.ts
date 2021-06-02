import webpack from 'webpack';
export declare class DebugModulesChunksPlugin {
    apply(compiler: webpack.Compiler): void;
}
export declare class DebugHTMLPlugin {
    apply(compiler: webpack.Compiler): void;
}
export declare class DefaultHTMLPlugin {
    private readonly consoleLog;
    private readonly copyright;
    private readonly servingPrefix;
    private readonly beautify;
    constructor(consoleLog: any, copyright: string, servingPrefix: string, beautify: boolean);
    apply(compiler: webpack.Compiler): void;
}
