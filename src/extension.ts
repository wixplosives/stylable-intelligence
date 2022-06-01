// import { Trace } from 'vscode-jsonrpc';
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

/**
 * vs-code plugin API implementation
 * this is the main entry point for the vs studio code extension API
 * see https://code.visualstudio.com/docs/extensionAPI/activation-events
 */

let client: LanguageClient;

export async function activate(_context: ExtensionContext) {
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

    client = new LanguageClient('stylable', serverOptions, clientOptions);
    // client.trace = Trace.Messages; // Elevated debugging message info in output

    await client.start();
}

/**
 * vs-code plugin API implementation
 * deactivation cleanup
 */
export async function deactivate(): Promise<void> {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
