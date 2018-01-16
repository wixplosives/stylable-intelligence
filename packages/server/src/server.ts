'use strict';
import { setInterval } from 'timers';
import * as path from 'path';
import { CompletionItem, createConnection, IConnection, InitializeResult, InsertTextFormat, IPCMessageReader, IPCMessageWriter, TextDocuments, TextEdit, Location, Definition, Hover, TextDocument, Range, Position, ServerCapabilities, SignatureHelp, NotificationType, RequestType, RequestType0, Command, ParameterInformation, Diagnostic } from 'vscode-languageserver';
import { createProvider, createFs, MinimalDocs, } from './provider-factory';
import { ProviderPosition, ProviderRange } from './completion-providers';
import { Completion } from './completion-types';
import { createDiagnosis } from './diagnosis';
import * as VCL from 'vscode-css-languageservice';
import { ServerCapabilities as CPServerCapabilities, DocumentColorRequest, ColorPresentationRequest } from 'vscode-languageserver-protocol/lib/protocol.colorProvider.proposed';
import { valueMapping } from 'stylable/dist/src/stylable-value-parsers';
import { fileUriToNativePath, nativePathToFileUri } from './utils/uri-utils';
import { createMeta } from './provider';
import { start } from 'repl';
import { StylableLanguageService } from './service'
import { Stylable } from 'stylable';
import {LocalSyncFs} from './local-sync-fs';
import *  as fs from 'fs';
import { FileSystemReadSync } from 'kissfs';
import { ExtendedFSReadSync } from './types';
const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const docs = new TextDocuments();
docs.listen(connection);
const fileSystem = new LocalSyncFs('');

export function createDocFs(fileSystem:FileSystemReadSync,docs:MinimalDocs):ExtendedFSReadSync{
    return {
        __proto__:fileSystem,
        loadTextFile(path:string) { return Promise.resolve(this.loadTextFileSync(path)) },
        loadTextFileSync: (path:string) => docs.get(path) ? docs.get(path).getText() : fileSystem.loadTextFileSync(path),
        get(path:string) {
            return docs.get(path) || TextDocument.create(path, 'stylable', 0, fileSystem.loadTextFileSync(path));
        },
        getOpenedFiles(){
            return docs.keys();
        }
     } as any;

}

const docFs:ExtendedFSReadSync = createDocFs(fileSystem, docs);

const styl = new Stylable('/', createFs(docFs, true), () => ({ default: {} }))
const OpenDocNotificationType = new NotificationType<string, void>('stylable/openDocumentNotification');

const service =  new StylableLanguageService(connection, {styl}, docFs ,{
    openDoc:OpenDocNotificationType,
    colorPresentationRequest:ColorPresentationRequest,
    colorRequest:DocumentColorRequest
});
