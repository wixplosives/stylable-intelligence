'use strict';
import {Trace} from 'vscode-jsonrpc'
import {
    ExtensionContext,
    Uri,
    workspace
} from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    NotificationType,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient';
import path = require('path');

namespace OpenDocNotification {
    export const type = new NotificationType<string, void>('stylable/openDocumentNotification');
}

/**
 * vs-code plugin API implementation
 * this is the main entry point for the vs studio code extension API
 * see https://code.visualstudio.com/docs/extensionAPI/activation-events
 */
export async function activate(context: ExtensionContext) {
    let serverModule = require.resolve('./lib/server.js'); //context.asAbsolutePath(path.join('dist', 'src', 'server', 'server.js'));
    // let debugOptions = {execArgv: ['']};
    let debugOptions = {execArgv: ['--inspect']}; // Turn on debugging messages in output

    let serverOptions: ServerOptions = {
        run: {module: serverModule, transport: TransportKind.ipc},
        debug: {module: serverModule, transport: TransportKind.ipc, options: debugOptions, runtime: 'node'}
    };

    let clientOptions: LanguageClientOptions = {
        documentSelector: [{language: 'stylable'}, {language: 'typescript'}, {language: 'javascript'},],
        diagnosticCollectionName: 'stylable',
    };

    const client = new LanguageClient('stylable', serverOptions, clientOptions);
    client.trace = Trace.Verbose; // Elevate debugging message info in output

    context.subscriptions.push(client.start());
    await client.onReady();
    const files = await workspace.findFiles('**/*.st.css');
    await Promise.all(files.map((file: any) => workspace.openTextDocument(file.fsPath)));
    client.onNotification(OpenDocNotification.type, async (uri: string) => {
        const doc = await workspace.openTextDocument(Uri.parse(uri));
        if (doc.fileName.endsWith('.js')) {
            const uris = await workspace.findFiles('**/' + path.basename(doc.fileName).slice(0, -3) + '.d.ts');
            uris.forEach(u => {
                workspace.openTextDocument(u);
            });
        }
    });
    return client;
}

/**
 * vs-code plugin API implementation
 * deactivation cleanup
 */
export async function deactivate() {

}
