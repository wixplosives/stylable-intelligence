'use strict';
import {
    IPCMessageReader, IPCMessageWriter,
    createConnection, IConnection, TextDocumentSyncKind,
    TextDocuments, Diagnostic, DiagnosticSeverity,
    InitializeParams, InitializeResult, TextDocumentPositionParams, CompletionItem
} from 'vscode-languageserver';

import {
    workspace, languages, window, commands,
    ExtensionContext, TextDocument, Disposable, CompletionItemProvider,
    Position, CancellationToken,
    CompletionItemKind, Range, SnippetString, Command
} from 'vscode';


import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
// import Provider, { Completion, snippet, ExtendedResolver, ProviderRange, Dir, File, FsEntity } from '../provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// let documents: TextDocuments = new TextDocuments();
// // Make the text document manager listen on the connection
// // for open, change and close text document events
// documents.listen(connection);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
    workspaceRoot = <string>params.rootUri;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            // textDocumentSync: documents.syncKind
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"']
            }
        }
    }
});

// Listen on the connection
connection.listen();

connection.onCompletion((params): CompletionItem[] => {
     return [
         {
             label: 'garrrrr',
             kind: 1,
             data: 'some data'
         }
    ]
})




