'use strict';
import * as path from 'path';
import {IConnection, NotificationType, TextDocument, TextDocuments} from 'vscode-languageserver';
import {createFs, MinimalDocs,} from './provider-factory';
import {ColorPresentationRequest, DocumentColorRequest} from 'vscode-languageserver-protocol';
import {fromVscodePath, toVscodePath} from './utils/uri-utils';
import {initStylableLanguageService} from './service'
import {Stylable} from 'stylable';
import *  as ts from 'typescript';
import {FileSystemReadSync} from 'kissfs';
import {ExtendedTsLanguageService} from './types';
import {createBaseHost, createLanguageServiceHost} from './utils/temp-language-service-host';
import {normalizeMeta} from "./utils/stylable";

export function createDocFs<T extends FileSystemReadSync>(fileSystem: T, docs: MinimalDocs): T {
    return Object.create(fileSystem, {
        loadTextFile: {
            value: function loadTextFile(path: string) {
                return Promise.resolve(this.loadTextFileSync(path));
            }
        },
        loadTextFileSync: {
            value: function loadTextFileSync(path: string) {
                const vscodePath: string = toVscodePath(path);
                const fromDocs = docs.get(vscodePath);
                if (fromDocs){
                    console.log('fs loadTextFile[sync]?() fetching from docs');
                    return fromDocs.getText();
                } else {
                    return fileSystem.loadTextFileSync(fromVscodePath(path))
                }
            }
        }
    });
}

export function init(fileSystem: FileSystemReadSync, connection: IConnection) {
    const docs = new TextDocuments();
    docs.listen(connection);
    const combinedFs: FileSystemReadSync = createDocFs(fileSystem, docs);
    const styl = new Stylable('/', createFs(combinedFs), require, undefined, normalizeMeta);
    const OpenDocNotificationType = new NotificationType<string, void>('stylable/openDocumentNotification');
    let openedFiles: string[] = [];
    const tsLanguageServiceHost = createLanguageServiceHost({
        cwd: '/',
        getOpenedDocs: () => openedFiles,
        compilerOptions: {
            target: ts.ScriptTarget.ES5, sourceMap: false, declaration: true, outDir: 'dist',
            lib: [],
            module: ts.ModuleKind.CommonJS,
            typeRoots: ["./node_modules/@types"]
        },
        defaultLibDirectory: '',
        baseHost: createBaseHost(combinedFs, path)
    });
    const tsLanguageService = ts.createLanguageService(tsLanguageServiceHost);
    const wrappedTs: ExtendedTsLanguageService = {
        setOpenedFiles: (files: string[]) => openedFiles = files,
        ts: tsLanguageService
    };

    initStylableLanguageService(connection, {styl, tsLanguageService: wrappedTs, requireModule: require}, combinedFs, docs, {
        openDoc: OpenDocNotificationType,
        colorPresentationRequest: ColorPresentationRequest,
        colorRequest: DocumentColorRequest
    });
}

