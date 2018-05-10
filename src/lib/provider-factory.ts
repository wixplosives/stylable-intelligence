'use strict';
import { FileSystemReadSync, checkExistsSync } from 'kissfs';
import { FileProcessor, Stylable, StylableMeta, cachedProcessFile, process as stylableProcess, safeParse } from 'stylable';
import { Event, TextDocument, TextDocumentChangeEvent, TextDocuments } from 'vscode-languageserver';
import Provider from './provider';
import { ExtendedTsLanguageService } from './types';

export function createProvider(stylable: Stylable, tsLangService: ExtendedTsLanguageService, withFilePrefix: boolean = true): Provider {
    return new Provider(stylable, tsLangService)
}


const isWindows = process.platform === 'win32';
export function createFs(fileSystem: FileSystemReadSync, windowsPaths: boolean = true): any {
    return {
        readFileSync(path: string) {
            path = (!windowsPaths && isWindows) ? `/${path.slice(path.lastIndexOf(':'+1)).replace(/\\/g, '/')}` : path;

            return fileSystem.loadTextFileSync(path).toString();
        },
        statSync(path: string) {
            path = (!windowsPaths && isWindows) ? `/${path.slice(path.lastIndexOf(':'+1)).replace(/\\/g, '/')}` : path;

            let isFile = checkExistsSync('file', fileSystem, path);
            return {
                isDirectory() {
                    return !isFile
                },
                isFile() {
                    return isFile
                },
                mtime: new Date(Date.now())
            }
        },
        readlinkSync(_path: string) {
            return null;
        }
    }
}

export function createProcessor(fileSystem: FileSystemReadSync, withFilePrefix: boolean = true): FileProcessor<StylableMeta> {
    let proccesor = cachedProcessFile<StylableMeta>((fullpath, content) => {
        return stylableProcess(safeParse(content, {from: fullpath}))
    }, createFs(fileSystem, withFilePrefix))
    return proccesor;
}

export interface MinimalDocs extends Partial<FileSystemReadSync> {
    get: (uri: string) => TextDocument;
    keys: () => string[];
}

export interface MinimalDocsDispatcher extends Partial<TextDocuments> {
    onDidChangeContent: Event<TextDocumentChangeEvent>;
    onDidOpen: Event<TextDocumentChangeEvent>;
}
