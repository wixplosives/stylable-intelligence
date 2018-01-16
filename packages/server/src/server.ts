'use strict';
import { createConnection, IConnection, IPCMessageReader, IPCMessageWriter, TextDocuments, NotificationType, } from 'vscode-languageserver';
import { createFs, } from './provider-factory';
import { DocumentColorRequest, ColorPresentationRequest } from 'vscode-languageserver-protocol/lib/protocol.colorProvider.proposed';
import { StylableLanguageService } from './service'
import { Stylable } from 'stylable';
import { LocalSyncFs } from './local-sync-fs';


const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const docs = new TextDocuments();

const fileSystem = new LocalSyncFs('');

const styl = new Stylable('/', createFs(docs, fileSystem, true), () => ({ default: {} }))
const OpenDocNotificationType = new NotificationType<string, void>('stylable/openDocumentNotification');

const service = new StylableLanguageService(connection, { styl }, docs, OpenDocNotificationType, DocumentColorRequest, ColorPresentationRequest)

