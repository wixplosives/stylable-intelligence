'use strict';
import {TextDocument, TextDocumentChangeEvent, TextDocuments, Event} from 'vscode-languageserver';
import {
    cachedProcessFile,
    FileProcessor,
    process as stylableProcess,
    safeParse,
    Stylable,
    StylableMeta
} from 'stylable';
import Provider from './provider';
import {FileSystemReadSync} from 'kissfs';
import {ExtendedTsLanguageService} from './types';

export function createProvider(stylable: Stylable, tsLangService: ExtendedTsLanguageService, withFilePrefix: boolean = true): Provider {
    // const styl = new Stylable('/', createFs(docs, fileSystem, withFilePrefix), () => ({ default: {} }))
    return new Provider(stylable, tsLangService)
}

export function createFs(fileSystem: FileSystemReadSync, withFilePrefix: boolean = true): any {
    return {
        readFileSync(path: string) {
            return fileSystem.loadTextFileSync(path).toString();
        },
        statSync(path: string) {
            return {
                mtime: new Date(Date.now())
            }
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
