'use strict';
import { Trace } from 'vscode-jsonrpc/lib/main';
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
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

