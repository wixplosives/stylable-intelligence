'use strict';
import { Trace } from 'vscode-jsonrpc'
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, Executable } from 'vscode-languageclient';
import path = require('path');


export function activate(context: ExtensionContext) {

    console.log('client lalala');
    let serverModule = context.asAbsolutePath(path.join('server', 'src', 'server.js'));
    let debugOptions = { execArgv: ['--inspect'] };

    let serverOptions: ServerOptions = {
         run: { module: serverModule, transport: TransportKind.ipc },
         debug: { module: serverModule, transport: TransportKind.ipc, options:debugOptions, runtime:'node', args:['--inspect:6004'] }

    }
    // let serverOptions: ServerOptions = {
    //      run:  {command: 'node', args:[serverModule]},
    //      debug:  {command: 'node', args:[serverModule]}
    // }
    let clientOptions: LanguageClientOptions = {
        documentSelector: ['css'],
    }

    let client = new LanguageClient('stylable', serverOptions, clientOptions);
    client.trace = Trace.Verbose;
    context.subscriptions.push(client.start());
}

