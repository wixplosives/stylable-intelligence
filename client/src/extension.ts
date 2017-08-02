'use strict';
import { Trace } from 'vscode-jsonrpc/lib/main';
import { Server } from 'https';
import { RequestType0 } from 'vscode-jsonrpc/lib/messages';
import { ServerRequest } from 'http';
import { Request } from '_debugger';
import * as server from 'vscode-languageserver';


import { workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionItemKind, Range, SnippetString, Command } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
// import Provider, { Completion, snippet, ExtendedResolver, ProviderRange, Dir, File, FsEntity } from '../provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');


export function activate(context: ExtensionContext) {
    let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc }
    }
    let clientOptions: LanguageClientOptions = {
        documentSelector: ['css'],
        // synchronize: {
        //     fileEvents: workspace.createFileSystemWatcher('**/.css')
        // }

    }

    let client = new LanguageClient('stylable', serverOptions, clientOptions);

    client.trace = Trace.Verbose;

    context.subscriptions.push(client.start());
}

