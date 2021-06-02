declare type LogFunc = (...msg: any[]) => void;
declare function isDebugEnabled(): boolean;
declare function assert(condition: boolean, err: string | Error): asserts condition;
export declare const log: {
    disable: () => void;
    enable: () => void;
    isDebugEnabled: typeof isDebugEnabled;
    print: LogFunc;
    debug: LogFunc;
    info: LogFunc;
    warn: LogFunc;
    error: LogFunc;
    assert: typeof assert;
};
export {};
