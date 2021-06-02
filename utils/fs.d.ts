declare type FileType = 'file' | 'directory' | 'symlink' | 'others';
export declare function testFileSync(p: string): false | FileType;
export declare function listDirSync(p: string): undefined | {
    file: string;
    type: FileType;
}[];
export declare function copyFileSync(src: string, dst: string): void;
export declare function copyDirRecursivelySync(src: string, dst: string, ignore: string[]): void;
export {};
