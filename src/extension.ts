import { Trace } from 'vscode-jsonrpc';
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';

/**
 * vs-code plugin API implementation
 * this is the main entry point for the vs studio code extension API
 * see https://code.visualstudio.com/docs/extensionAPI/activation-events
 */
export async function activate(context: ExtensionContext) {
    const serverModule = require.resolve('./lib/server');
    const debugOptions = { execArgv: ['--inspect'] }; // Turn on debugging messages in output

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions, runtime: 'node' },
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { language: 'stylable', scheme: 'untitled' },
            { language: 'stylable', scheme: 'file' },
        ],
        diagnosticCollectionName: 'stylable',
    };

    const client = new LanguageClient('stylable', serverOptions, clientOptions);
    client.trace = Trace.Messages; // Elevated debugging message info in output

    context.subscriptions.push(client.start());
    await client.onReady();
    return client;
}

/**
 * vs-code plugin API implementation
 * deactivation cleanup
 */
export async function deactivate() {
    /**/
}
