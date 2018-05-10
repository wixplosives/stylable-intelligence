'use strict';
import {Event, TextDocument, TextDocumentChangeEvent, TextDocuments} from 'vscode-languageserver';
import {
    cachedProcessFile,
    FileProcessor,
    process as stylableProcess,
    safeParse,
    Stylable,
    StylableMeta
} from 'stylable';
import Provider from './provider';
import {checkExistsSync, FileSystemReadSync} from 'kissfs';
import {ExtendedTsLanguageService} from './types';

export function createProvider(stylable: Stylable, tsLangService: ExtendedTsLanguageService, withFilePrefix: boolean = true): Provider {
    return new Provider(stylable, tsLangService)
}


const isWindows = process.platform === 'win32';
export function createFs(fileSystem: FileSystemReadSync, withFilePrefix: boolean = true): any {
    return {
        readFileSync(path: string) {
            // path = isWindows ? `/${path.replace(/\\/g, '/').replace(':', '%3A')}` : path;
            path = '/single-file-color.st.css'
            return fileSystem.loadTextFileSync(path).toString();
        },
        statSync(path: string) {
            path = '/single-file-color.st.css'
            // path = isWindows ? `/${path.replace(/\\/g, '/').replace(':', '%3A')}` : path;
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
