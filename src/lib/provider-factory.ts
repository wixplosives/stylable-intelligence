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
            path = (!legacyBehvior && isWindows) ? `/${path.slice(path.lastIndexOf(':')+1).replace(/\\/g, '/')}` : path;

            return fileSystem.loadTextFileSync(path).toString();
        },
        statSync(path: string) {

            path = (!legacyBehvior && isWindows) ? `/${path.slice(path.lastIndexOf(':')+1).replace(/\\/g, '/')}` : path;

            const s = fileSystem.statSync(path)

            const stat = {
                type: s.type,
                isDirectory() {
                    return s.type === 'dir'
                },
                isFile() {
                    return s.type === 'file'
                },
                mtime: new Date(Date.now())
            }

            return stat;
        },
        readlinkSync(_path: string) {
            return null//require('fs').readlinkSync(_path);
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
    get: (uri: string) => TextDocument | undefined;
    keys: () => string[];
}

export interface MinimalDocsDispatcher extends Partial<TextDocuments> {
    onDidChangeContent: Event<TextDocumentChangeEvent>;
    onDidOpen: Event<TextDocumentChangeEvent>;
}
