
'use strict';
import { connect } from 'tls';
import { Trace } from 'vscode-jsonrpc'
import { ExtensionContext, workspace, TextDocument, languages, ColorInformation, ColorPresentation, Color } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, Executable } from 'vscode-languageclient';
import path = require('path');
import { DocumentColorRequest, DocumentColorParams, ColorPresentationRequest, ColorPresentationParams } from 'vscode-languageserver-protocol/lib/protocol.colorProvider.proposed';

export function activate(context: ExtensionContext) {

    let serverModule = context.asAbsolutePath(path.join('server', 'src', 'server.js'));
    let debugOptions = { execArgv: ['--inspect'] };


    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions, runtime: 'node' }
    }

    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ language: 'stylable' }],
        diagnosticCollectionName: 'stylable',
    }

    let client = new LanguageClient('stylable', serverOptions, clientOptions);
    client.trace = Trace.Verbose;


    context.subscriptions.push(client.start());


    return client
        .onReady()
        .then(_ => {
            // register color provider
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
        })
        .then(() => workspace.findFiles('**/*.stcss', ''))
        .then((files) => Promise.all(files.map((file) => workspace.openTextDocument(file.fsPath))))
        .then(() => {
            return client
        })

}

