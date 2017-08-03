'use strict';
import { disconnect } from 'cluster';

import {Trace} from 'vscode-jsonrpc'
import { workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionItemKind, Range, SnippetString, Command } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
// import Provider, { Completion, snippet, ExtendedResolver, ProviderRange, Dir, File, FsEntity } from '../provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');


export function activate(context: ExtensionContext) {
    console.log('client lalala');
    let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc }
    }
    let clientOptions: LanguageClientOptions = {
        documentSelector: ['css'],
    }

    let client = new LanguageClient('stylable', serverOptions, clientOptions);
    client.trace = Trace.Verbose;
    context.subscriptions.push(client.start());
}

