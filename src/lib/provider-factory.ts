'use strict';
import {FileSystemReadSync} from 'kissfs';
import {
    cachedProcessFile,
    FileProcessor,
    process as stylableProcess,
    safeParse,
    Stylable,
    StylableMeta
} from 'stylable';
import {Event, TextDocument, TextDocumentChangeEvent, TextDocuments} from 'vscode-languageserver';
import Provider from './provider';
import {ExtendedTsLanguageService} from './types';

export function createProvider(stylable: Stylable, tsLangService: ExtendedTsLanguageService): Provider {
    return new Provider(stylable, tsLangService)
}

let legacyBehvior = true;

export function toggleLegacy(value: boolean) {
    legacyBehvior = value;
}

export function createFs(fileSystem: FileSystemReadSync): any {
    return {
        readFileSync(path: string) {
            return fileSystem.loadTextFileSync(path).toString();
        },
        statSync(path: string) {
            const simpleStats = fileSystem.statSync(path);
            return {
                isDirectory() {
                    return simpleStats.type === 'dir';
                },
                isFile() {
                    return simpleStats.type === 'file';
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
