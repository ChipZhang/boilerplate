import { TagAttributes } from '@chipzhang/webpack-asset-attributes-plugin';
export declare const pathConfig: {
    packageRoot: string;
    packageJSON: any;
    boilerplateRoot: string;
    boilerplateJSON: any;
    contentRootFolder: string;
    contentRoot: string;
    buildDir: (mode: string) => string;
    staticDir: string;
    srcPaths: string[];
    polyfill: string;
    reportFolder: string;
    reportDir: (mode: string) => string;
    loadedStaticFolder: string;
    loadedStaticDir: string;
    configFileTypescriptReact: string;
    configFileBabel: string;
    configFilePostCSS: string;
};
export declare const logoConfig: {
    faviconDimensions: number[];
    appleIconDimensions: number[];
    allDimensions: number[];
    templateSVGFile: string;
    outputDir(app: string): string;
    svgFile(app: string): string;
    pngFile(app: string, dimension: number): string;
    icoFile(app: string): string;
    svgFileURLPath(servingPrefix: string, app: string): string;
    pngFileURLPath(servingPrefix: string, app: string, dimension: number): string;
    icoFileURLPath(servingPrefix: string, app: string): string;
};
export declare const webConfig: {
    defaultHost: string;
    defaultPort: number;
    defaultAPI: string;
    prefix: string;
    copyright: string;
    scriptAttribs: TagAttributes;
    styleAttribs: TagAttributes;
    templateHTMLFile: string;
};
export declare function checkEnv(expectedNodeEnv: string): void;
interface ConfigVars {
    [k: string]: null | undefined | boolean | number | string | {
        [k: string]: any;
    };
}
interface LessVars {
    [k: string]: string;
}
export interface App {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    configVars: ConfigVars;
    lessVars: LessVars;
    pages: Page[];
}
export interface Page {
    app: App;
    title: string;
    html: string;
    asset: string;
    source: string;
}
export declare function parseApps(appNames: null | undefined | string | string[]): App[];
export {};
