'use strict';
import { Trace } from 'vscode-jsonrpc/lib/main';
import { LogTraceNotification, LogTraceParams } from 'vscode-jsonrpc'
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, RequestType } from 'vscode-languageclient';
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
    client.onNotification(LogTraceNotification.type, (notif) => {
        console.log('message:', notif.message, 'verbose:', notif.verbose)
    })
    // client.onReady().then(
    //     () => {
    //         client.onRequest()
    //     }
    // )

    context.subscriptions.push(client.start());
}

