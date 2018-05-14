'use strict';
import { FileSystemReadSync, checkExistsSync } from 'kissfs';
import { FileProcessor, Stylable, StylableMeta, cachedProcessFile, process as stylableProcess, safeParse } from 'stylable';
import { Event, TextDocument, TextDocumentChangeEvent, TextDocuments } from 'vscode-languageserver';
import Provider from './provider';
import { ExtendedTsLanguageService } from './types';

export function createProvider(stylable: Stylable, tsLangService: ExtendedTsLanguageService, withFilePrefix: boolean = true): Provider {
    return new Provider(stylable, tsLangService)
}


let legacyBehvior = true;

export function toggleLegacy(value: boolean) {
    legacyBehvior = value;
}

const isWindows = process.platform === 'win32';
export function createFs(fileSystem: FileSystemReadSync): any {
    return {
        readFileSync(path: string) {
            // path = path.replace(rootPath, '/').replace(/\\/g, '/')
            // path = (!legacyBehvior && isWindows) ? `/${path.slice(path.lastIndexOf(':')+1).replace(/\\/g, '/')}` : path;
            
            return fileSystem.loadTextFileSync(path).toString();
        },
        statSync(path: string) {
            // path = path.replace(rootPath, '/').replace(/\\/g, '/')
            // path = (!legacyBehvior && isWindows) ? `/${path.slice(path.lastIndexOf(':')+1).replace(/\\/g, '/')}` : path;

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

export function createProcessor(fileSystem: FileSystemReadSync): FileProcessor<StylableMeta> {
    let proccesor = cachedProcessFile<StylableMeta>((fullpath, content) => {
        return stylableProcess(safeParse(content, {from: fullpath}))
    }, createFs(fileSystem))
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
