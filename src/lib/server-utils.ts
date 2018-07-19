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
import {ExtendedFSReadSync, ExtendedTsLanguageService} from './types';
import {createBaseHost, createLanguageServiceHost} from './utils/temp-language-service-host';

export function createDocFs(fileSystem: FileSystemReadSync, docs: MinimalDocs): ExtendedFSReadSync {
    return {
        __proto__: fileSystem,
        async loadTextFile(path: string) {
            return this.loadTextFileSync(path);
        },
        loadTextFileSync(path: string) {
            const vscodePath: string = toVscodePath(path);
            const fromDocs = docs.get(vscodePath);
            return fromDocs ? fromDocs.getText() : fileSystem.loadTextFileSync(fromVscodePath(path))
        },
        loadDirectoryTreeSync(path: string) {
            return fileSystem.loadDirectoryTreeSync(path);
        },
        get(path: string) {
            return docs.get(path) || TextDocument.create(path, 'stylable', 0, this.loadTextFileSync(fromVscodePath(path)));
        },
        getOpenedFiles() {
            return docs.keys();
        }
    } as any;
}

export function init(fileSystem: FileSystemReadSync, connection: IConnection, basePath: string = '/') {
    const docs = new TextDocuments();
    docs.listen(connection);
    const docFs: ExtendedFSReadSync = createDocFs(fileSystem, docs);
    const styl = new Stylable(basePath, createFs(docFs), require);
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
        baseHost: createBaseHost(docFs, path)
    });
    const tsLanguageService = ts.createLanguageService(tsLanguageServiceHost);
    const wrappedTs: ExtendedTsLanguageService = {
        setOpenedFiles: (files: string[]) => openedFiles = files,
        ts: tsLanguageService
    };

    initStylableLanguageService(connection, {styl, tsLanguageService: wrappedTs, requireModule: require}, docFs, docs, {
        openDoc: OpenDocNotificationType,
        colorPresentationRequest: ColorPresentationRequest,
        colorRequest: DocumentColorRequest
    });
}

