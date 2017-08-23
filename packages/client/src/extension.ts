'use strict';
import { connect } from 'tls';
import { Trace } from 'vscode-jsonrpc'
import { ExtensionContext, workspace, TextDocument } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, Executable, NotificationType } from 'vscode-languageclient';
import path = require('path');

import * as glob from 'glob';

namespace OpenDocNotification {
    export const type = new NotificationType<string, void>('stylable/openDocument');
}

export function activate(context: ExtensionContext) {

    console.log('client lalala');

    let serverModule = context.asAbsolutePath(path.join('server', 'src', 'server.js'));
    let debugOptions = { execArgv: ['--inspect=9229'] };


    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions, runtime: 'node' }
    }

    let clientOptions: LanguageClientOptions = {
        documentSelector: ['css'],
        diagnosticCollectionName: 'stylable'
    }

    let client = new LanguageClient('stylable', serverOptions, clientOptions);
    client.trace = Trace.Verbose;


    context.subscriptions.push(client.start());


    return client
        .onReady()
        .then(() => workspace.findFiles('**/*.css'))
        .then((files) => Promise.all(files.map((file) => workspace.openTextDocument(file.fsPath))))
        .then(() => {
            client.onNotification(OpenDocNotification.type, (uri: string) => {
                // debugger;
                console.log(uri);
            })

            return client
        })

}

