'use strict';
import { TextDocument } from 'vscode-languageserver';
import {
    cachedProcessFile, process as stylableProcess, safeParse, StylableMeta,
    // StylableResolver,
    FileProcessor, Stylable
} from 'stylable';
import Provider from './provider';
import * as fs from 'fs';
import * as ts from 'typescript';
import { htap } from 'htap';
import { FileSystemReadSync, EventEmitter } from 'kissfs';


export {Completion} from './completion-types';
export { ProviderRange, ProviderPosition }  from './completion-providers'
export { createDiagnosis }  from './diagnosis';

export function createProvider(stylable: Stylable, tsLangService:ts.LanguageService, withFilePrefix: boolean = true): Provider {
    // const styl = new Stylable('/', createFs(docs, fileSystem, withFilePrefix), () => ({ default: {} }))
    return new Provider(stylable, tsLangService)
}

export function createFs(fileSystem: FileSystemReadSync, withFilePrefix: boolean = true): any {

    const getDocFormatPath = (path: string) => {
        if (process.platform === 'win32') {
            return withFilePrefix ? 'file:///' + htap(path) : htap(path);
        } else {
            return withFilePrefix ? 'file://' + path : path
        }
    }

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
        return stylableProcess(safeParse(content, { from: fullpath }))
    }, createFs(fileSystem, withFilePrefix))
    return proccesor;

}

export interface MinimalDocs extends Partial<FileSystemReadSync> {
    get: (uri: string) => TextDocument;
    keys: () => string[];
    // loadTextFileSync:(fullPath: string) => string;
    // events: EventEmitter;
}
