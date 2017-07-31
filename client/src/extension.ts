'use strict';


import { workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionItemKind, Range, SnippetString, Command } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import Provider, { Completion, snippet, ExtendedResolver, ProviderRange, Dir, File, FsEntity } from '../provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');


export function activate(context: ExtensionContext) {
    let serverModule = context.asAbsolutePath(path.join(__dirname, '..', 'server', 'server.js'));
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

    let disposable = new LanguageClient('stylable', serverOptions, clientOptions);

    context.subscriptions.push(disposable.start());
    // context.subscriptions.push(languages.registerCompletionItemProvider('css', new StylableDotCompletionProvider(), '.', '-', ':', '"'));
}

