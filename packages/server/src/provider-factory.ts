'use strict';
import { TextDocument } from 'vscode-languageserver';
import {
    cachedProcessFile, process as stylableProcess, safeParse, StylableMeta,
    // StylableResolver,
    FileProcessor, Stylable
} from 'stylable';
import Provider from './provider';
import * as fs from 'fs';
import { htap } from 'htap';
import { FileSystemReadSync, EventEmitter } from 'kissfs';


export {Completion} from './completion-types';
export { ProviderRange, ProviderPosition }  from './completion-providers'
export { createDiagnosis }  from './diagnosis';

export function createProvider(docs: MinimalDocs, stylable: Stylable, withFilePrefix: boolean = true): Provider {
    // const styl = new Stylable('/', createFs(docs, fileSystem, withFilePrefix), () => ({ default: {} }))
    return new Provider(stylable)
}

export function createFs(docs: MinimalDocs, fileSystem: FileSystemReadSync, withFilePrefix: boolean = true): any {

    const getDocFormatPath = (path: string) => {
        if (process.platform === 'win32') {
            return withFilePrefix ? 'file:///' + htap(path) : htap(path);
        } else {
            return withFilePrefix ? 'file://' + path : path
        }
    }

    return {
        readFileSync(path: string) {
            if (docs.keys().indexOf(getDocFormatPath(path)) !== -1) {
                return docs.get(getDocFormatPath(path)).getText();
            } else {
                return fileSystem.loadTextFileSync(path).toString();
            }
        },
        statSync(path: string) {
            const doc = docs.get(getDocFormatPath(path));
            if (docs.keys().indexOf(getDocFormatPath(path)) !== -1) {
                return {
                    mtime: new Date(doc.version)
                }
            } else {
                return {
                    mtime: new Date(Date.now())
                }
            }
        }
    }
}

export function createProcessor(docs: MinimalDocs, fileSystem: FileSystemReadSync, withFilePrefix: boolean = true): FileProcessor<StylableMeta> {
    let proccesor = cachedProcessFile<StylableMeta>((fullpath, content) => {
        return stylableProcess(safeParse(content, { from: fullpath }))
    }, createFs(docs, fileSystem, withFilePrefix))
    return proccesor;

}

export interface MinimalDocs extends Partial<FileSystemReadSync> {
    get: (uri: string) => TextDocument;
    keys: () => string[];
    // loadTextFileSync:(fullPath: string) => string;
    // events: EventEmitter;
}
