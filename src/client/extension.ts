'use strict';
import {Trace} from 'vscode-jsonrpc'
import {
    Color,
    ColorInformation,
    ColorPresentation,
    ExtensionContext,
    languages,
    TextDocument,
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
import {
    ColorPresentationParams,
    ColorPresentationRequest,
    DocumentColorParams,
    DocumentColorRequest
} from 'vscode-languageserver-protocol';
import path = require('path');

namespace OpenDocNotification {
    export const type = new NotificationType<string, void>('stylable/openDocumentNotification');
}

let closeable: LanguageClient | undefined;

export async function activate(context: ExtensionContext) {
    let serverModule = path.resolve(__dirname, '..', 'server', 'server.js'); //context.asAbsolutePath(path.join('dist', 'src', 'server', 'server.js'));
    let debugOptions = {execArgv: ['--inspect']};

    let serverOptions: ServerOptions = {
        run: {module: serverModule, transport: TransportKind.ipc},
        debug: {module: serverModule, transport: TransportKind.ipc, options: debugOptions, runtime: 'node'}
    };

    let clientOptions: LanguageClientOptions = {
        documentSelector: [{language: 'stylable'}, {language: 'typescript'}, {language: 'javascript'},],
        diagnosticCollectionName: 'stylable',
    };

    const client = closeable = new LanguageClient('stylable', serverOptions, clientOptions);
    client.trace = Trace.Verbose;


    context.subscriptions.push(client.start());

    await client.onReady()
    context.subscriptions.push(languages.registerColorProvider('stylable', {
        provideDocumentColors(document: TextDocument): Thenable<ColorInformation[]> {
            let params: DocumentColorParams = {
                textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(document)
            };
            return client.sendRequest(DocumentColorRequest.type, params).then(symbols => {
                return symbols.map(symbol => {
                    let range = client.protocol2CodeConverter.asRange(symbol.range);
                    let color = new Color(symbol.color.red, symbol.color.green, symbol.color.blue, symbol.color.alpha);
                    return new ColorInformation(range, color);
                });
            });
        },
        provideColorPresentations(color: Color, context): ColorPresentation[] | Thenable<ColorPresentation[]> {
            let params: ColorPresentationParams = {
                textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(context.document),
                color,
                range: client.code2ProtocolConverter.asRange(context.range)
            };
            return client.sendRequest(ColorPresentationRequest.type, params).then(presentations => {
                return presentations.map(p => {
                    let presentation = new ColorPresentation(p.label);
                    presentation.textEdit = p.textEdit && client.protocol2CodeConverter.asTextEdit(p.textEdit);
                    presentation.additionalTextEdits = p.additionalTextEdits && client.protocol2CodeConverter.asTextEdits(p.additionalTextEdits);
                    return presentation;
                });
            });
        }
    }));
    const files = await workspace.findFiles('**/*.st.css');
    await Promise.all(files.map((file: any) => workspace.openTextDocument(file.fsPath)));
    client.onNotification(OpenDocNotification.type, (uri: string) => workspace.openTextDocument(Uri.parse(uri)).then((doc) => {
        if (doc.fileName.endsWith('.js')) {
            workspace.findFiles('**/' + path.basename(doc.fileName).slice(0, -3) + '.d.ts').then((uris) => {
                uris.forEach(u => {
                    workspace.openTextDocument(u);
                })
            })
        }
    }));
    return client;
}

export async function deactivate() {
    closeable && await closeable.stop();
}
