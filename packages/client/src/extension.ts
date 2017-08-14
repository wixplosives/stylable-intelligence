'use strict';
import { connect } from 'tls';
import { Trace } from 'vscode-jsonrpc'
import { ExtensionContext, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, Executable } from 'vscode-languageclient';
import path = require('path');

import * as glob from 'glob';

export function activate(context: ExtensionContext) {

    console.log('client lalala');
    workspace.findFiles('**/*.css').then((files) => {
        files.forEach((file) => {
            console.log(file)
            workspace.openTextDocument(file)
        })
    })

    let serverModule = context.asAbsolutePath(path.join('server', 'src', 'server.js'));
    let debugOptions = { execArgv: ['--inspect'] };


    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions, runtime: 'node' }

    }

    let clientOptions: LanguageClientOptions = {
        documentSelector: ['css'],
    }

    let client = new LanguageClient('stylable', serverOptions, clientOptions);
    client.trace = Trace.Verbose;


    context.subscriptions.push(client.start());
}

