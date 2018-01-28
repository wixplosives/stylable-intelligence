'use strict';
import { setInterval } from 'timers';
import * as path from 'path';
import { CompletionItem, createConnection, IConnection, InitializeResult, InsertTextFormat, IPCMessageReader, IPCMessageWriter, TextDocuments, TextEdit, Location, Definition, Hover, TextDocument, Range, Position, ServerCapabilities, SignatureHelp, NotificationType, RequestType, RequestType0, Command, ParameterInformation, Diagnostic } from 'vscode-languageserver';
import { createProvider, createFs, MinimalDocs, } from './provider-factory';
import { ProviderPosition, ProviderRange } from './completion-providers';
import { Completion } from './completion-types';
import * as VCL from 'vscode-css-languageservice';
import { ServerCapabilities as CPServerCapabilities, DocumentColorRequest, ColorPresentationRequest } from 'vscode-languageserver-protocol/lib/protocol.colorProvider.proposed';
import { valueMapping } from 'stylable/dist/src/stylable-value-parsers';
import { fromVscodePath, toVscodePath } from './utils/uri-utils';
import { createMeta } from './provider';
import { start } from 'repl';
import { StylableLanguageService } from './service'
import { Stylable } from 'stylable';
import { LocalSyncFs } from './local-sync-fs';
import *  as ts from 'typescript';
import { FileSystemReadSync, Events, FileChangedEvent } from 'kissfs';
import { ExtendedFSReadSync, ExtendedTsLanguageService } from './types';
import { createLanguageServiceHost, createBaseHost } from './utils/temp-language-service-host';

const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const docs = new TextDocuments();

docs.listen(connection);
connection.listen();

const fileSystem = new LocalSyncFs('');

export function createDocFs(fileSystem: FileSystemReadSync, docs: MinimalDocs): ExtendedFSReadSync {

    return {
        __proto__: fileSystem,
        loadTextFile(path: string) { return Promise.resolve(this.loadTextFileSync(path)) },
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

const docFs: ExtendedFSReadSync = createDocFs(fileSystem, docs);

const styl = new Stylable('/', createFs(docFs, true), require);
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

const service = new StylableLanguageService(connection, { styl, tsLanguageService: wrappedTs, requireModule:require }, docFs, docs, {
    openDoc: OpenDocNotificationType,
    colorPresentationRequest: ColorPresentationRequest,
    colorRequest: DocumentColorRequest
});
