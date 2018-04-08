'use strict';
import * as path from 'path';
import {
    createConnection,
    IConnection,
    IPCMessageReader,
    IPCMessageWriter,
    NotificationType,
    TextDocument,
    TextDocuments
} from 'vscode-languageserver';
import {createFs, MinimalDocs} from './provider-factory';
import {
    ColorPresentationRequest,
    DocumentColorRequest
} from 'vscode-languageserver-protocol';
import {fromVscodePath, toVscodePath} from './utils/uri-utils';
import {StylableLanguageService} from './service'
import {Stylable} from 'stylable';
import {LocalSyncFs} from './local-sync-fs';
import *  as ts from 'typescript';
import {FileSystemReadSync} from 'kissfs';
import {ExtendedFSReadSync, ExtendedTsLanguageService} from './types';
import {createBaseHost, createLanguageServiceHost} from './utils/temp-language-service-host';

const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const docs = new TextDocuments();

docs.listen(connection);
connection.listen();

const fileSystem = new LocalSyncFs('');

export function createDocFs(fileSystem: FileSystemReadSync, docs: MinimalDocs): ExtendedFSReadSync {

    return {
        __proto__: fileSystem,
        loadTextFile(path: string) {
            return Promise.resolve(this.loadTextFileSync(path))
        },
        loadTextFileSync(path: string) {
            const vscodePath: string = toVscodePath(path);
            const fromDocs = docs.get(vscodePath);
            return fromDocs ? fromDocs.getText() : fileSystem.loadTextFileSync(fromVscodePath(path))
        },
        get(path: string) {
            return docs.get(path) || TextDocument.create(path, 'stylable', 0, this.loadTextFileSync(fromVscodePath(path)));
        },
        getOpenedFiles() {
            return docs.keys();
        }
    } as any;
}


const { docFs, wrappedTs, notificationTypes } = createTsLanguageService();

const service = new StylableLanguageService(
    connection,
    {
        tsLanguageService: wrappedTs,
        requireModule:require
    },
    docFs,
    docs,
    notificationTypes
);

function createTsLanguageService() {
    const docFs: ExtendedFSReadSync = createDocFs(fileSystem, docs);
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
    const notificationTypes = {
        openDoc: OpenDocNotificationType,
        colorPresentationRequest: ColorPresentationRequest,
        colorRequest: DocumentColorRequest
    }
    return { docFs, wrappedTs, notificationTypes };
}

