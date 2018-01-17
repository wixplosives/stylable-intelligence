import * as ts from 'typescript';
import {FileSystemReadSync, checkExistsSync} from 'kissfs';
import * as path from 'path';

declare module 'typescript' {
    function matchFiles(path: string, extensions: ReadonlyArray<string>, excludes: ReadonlyArray<string>,
                        includes: ReadonlyArray<string>, useCaseSensitiveFileNames: boolean, currentDirectory: string,
                        depth: number | undefined, getFileSystemEntries: (path: string) => FileSystemEntries): string[];

    export interface FileSystemEntries {
        files: ReadonlyArray<string>;
        directories: ReadonlyArray<string>;
    }

    export interface SourceFile {
        parseDiagnostics: ts.Diagnostic[];
    }

    export function getNewLineCharacter(options: ts.CompilerOptions | ts.PrinterOptions): string;
}


export interface BaseHost extends ts.ParseConfigHost {
    syncFs: FileSystemReadSync;
    path: typeof path.posix;
}

export function createBaseHost(syncFs: FileSystemReadSync, systemPath: typeof path.posix): BaseHost {
    //TODO: support in kissfs.
    const useCaseSensitiveFileNames = false;

    return {syncFs, useCaseSensitiveFileNames, readDirectory, fileExists, readFile, path: systemPath};

    function readFile(filePath: string): string | undefined {
        try {
            return syncFs.loadTextFileSync(filePath);
        } catch {
            return undefined;
        }
    }

    function readDirectory(rootDir: string,
                           extensions: ReadonlyArray<string>,
                           excludes: ReadonlyArray<string>,
                           includes: ReadonlyArray<string>,
                           depth: number): string[] {
        return ts.matchFiles(
            rootDir, extensions, excludes, includes, useCaseSensitiveFileNames, rootDir, depth, getFileSystemEntries
        );
    }

    function getFileSystemEntries(path: string): ts.FileSystemEntries {
        const files: string[] = [];
        const directories: string[] = [];
        const entries = syncFs.loadDirectoryChildrenSync(path);
        for (const entry of entries) {
            if (entry.type == "file") {
                files.push(entry.name);
            } else {
                directories.push(entry.name);
            }
        }
        return {files, directories};
    }


    function fileExists(fullPath: string) {
        try {
            syncFs.loadTextFileSync(fullPath);
            return true;
        } catch (error) {
            return false;
        }
    }
}


export interface LanguageServicesHostOptions {
    baseHost: BaseHost;
    compilerOptions: ts.CompilerOptions;
    getOpenedDocs(): string[];
    cwd: string;
    defaultLibDirectory: string;
    customTransformers?: ts.CustomTransformers;

    log?(s: string): void;

    trace?(s: string): void;

    error?(s: string): void;

    getProjectVersion?(): string;
}

export function createLanguageServiceHost(hostOptions: LanguageServicesHostOptions): ts.LanguageServiceHost {
    const {
        baseHost, compilerOptions, getOpenedDocs, cwd, customTransformers, defaultLibDirectory,
        log, trace, error, getProjectVersion
    } = hostOptions;

    const {syncFs} = baseHost;

    function getDirectories(path: string) {
        return syncFs.loadDirectoryChildrenSync(path).filter((child) => child.type === 'dir').map(child => child.name);
    }

    function dirExistsSync(targetPath: string) {
        return checkExistsSync('dir', syncFs, targetPath)
    }

    const tempCounters: { [key: string]: number } = {};

    function getVersion(targetPath: string) {
        //add capability to kiss-fs
        if (tempCounters[targetPath] !== undefined) {
            tempCounters[targetPath]++
        } else {
            tempCounters[targetPath] = 0;
        }
        return tempCounters[targetPath]
    }

    return {
        getCompilationSettings: () => compilerOptions,
        getNewLine: () => ts.getNewLineCharacter(compilerOptions),
        getProjectVersion,
        getScriptFileNames: getOpenedDocs,//() => [],//
        // getScriptKind?(fileName: string): ScriptKind;
        getScriptVersion: (filePath: string) => getVersion(filePath) + '',
        getScriptSnapshot: (filePath: string) => ts.ScriptSnapshot.fromString(syncFs.loadTextFileSync(filePath)),
        // getLocalizedDiagnosticMessages?(): any;
        // getCancellationToken?(): HostCancellationToken;
        getCurrentDirectory: () => cwd,
        getDefaultLibFileName: (options: ts.CompilerOptions) =>
            baseHost.path.join(defaultLibDirectory, ts.getDefaultLibFileName(options)),
        log,
        trace,
        error,
        useCaseSensitiveFileNames: () => baseHost.useCaseSensitiveFileNames,
        readDirectory: baseHost.readDirectory,
        readFile: baseHost.readFile,
        fileExists: baseHost.fileExists,
        // getTypeRootsVersion?(): number;
        // resolveModuleNames?(moduleNames: string[], containingFile: string): ResolvedModule[];
        // resolveTypeReferenceDirectives?(
        //     typeDirectiveNames: string[], containingFile: string
        // ): ResolvedTypeReferenceDirective[];
        directoryExists: dirExistsSync,
        getDirectories: getDirectories,
        getCustomTransformers: () => customTransformers
    };
}
