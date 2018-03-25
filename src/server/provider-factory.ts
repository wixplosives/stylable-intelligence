'use strict';
import {TextDocument, TextDocumentChangeEvent, TextDocuments, Event} from 'vscode-languageserver';
import {
    cachedProcessFile,
    FileProcessor,
    process as stylableProcess,
    safeParse,
    Stylable,
    StylableMeta,
    MinimalFS
} from 'stylable';
import Provider from './provider';
import {checkExistsSync} from 'kissfs';
import {ExtendedTsLanguageService, ExtendedFSReadSync} from './types';

export function createProvider(stylable: Stylable, tsLangService: ExtendedTsLanguageService, withFilePrefix: boolean = true): Provider {
    return new Provider(stylable, tsLangService)
}

export function createFs(fileSystem: ExtendedFSReadSync, withFilePrefix: boolean = true): any {
    return {
        readFileSync(path: string) {
            return fileSystem.loadTextFileSync(path).toString();
        },
        statSync(path: string) {
            let isDir = false;
            let isFile = false;
            try{
                checkExistsSync('dir', fileSystem, path);
                fileSystem.get(path);
                isFile = true;
            } catch(e){
                isDir = true;
            }
            return {
                isDirectory(){return isDir},
                isFile(){return isFile},
                mtime: new Date(Date.now())
            }
        }
    }
}

export function createProcessor(fileSystem: ExtendedFSReadSync, withFilePrefix: boolean = true): FileProcessor<StylableMeta> {
    let proccesor = cachedProcessFile<StylableMeta>((fullpath, content) => {
        return stylableProcess(safeParse(content, {from: fullpath}))
    }, createFs(fileSystem, withFilePrefix))
    return proccesor;
}

export interface MinimalDocs extends Partial<ExtendedFSReadSync> {
    get: (uri: string) => TextDocument;
    keys: () => string[];
}

export interface MinimalDocsDispatcher extends Partial<TextDocuments> {
    onDidChangeContent: Event<TextDocumentChangeEvent>;
    onDidOpen: Event<TextDocumentChangeEvent>;
}
