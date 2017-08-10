'use strict';
import { Trace } from 'vscode-jsonrpc'
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, Executable } from 'vscode-languageclient';
import path = require('path');


export function activate(context: ExtensionContext) {
    console.log('client lalala');
    let serverModule = context.asAbsolutePath(path.join('server', 'src', 'server.js'));

    let debugOptions:Executable = {command: 'node', args:['--inspect', '--debug-brk', serverModule]}
    let runOptions:Executable = {command: 'node', args:[serverModule]}

    let serverOptions: ServerOptions = {
        run: runOptions,
        debug: debugOptions

    }
    let clientOptions: LanguageClientOptions = {
        documentSelector: ['css'],
    }

    let client = new LanguageClient('stylable', serverOptions, clientOptions);
    client.trace = Trace.Verbose;
    context.subscriptions.push(client.start());
}

