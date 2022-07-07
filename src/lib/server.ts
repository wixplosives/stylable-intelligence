import fs from '@file-services/node';
import { MinimalFS, safeParse, Stylable } from '@stylable/core';
import {
    createConnection,
    IPCMessageReader,
    IPCMessageWriter,
    DidChangeConfigurationNotification,
    TextDocuments,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { initializeResult } from './capabilities';
import { VSCodeStylableLanguageService } from './vscode-service';
import { wrapFs } from './wrap-fs';
import { URI } from 'vscode-uri';

const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

connection.onInitialize((params) => {
    const docs = new TextDocuments(TextDocument);
    const wrappedFs = wrapFs(fs, docs);
    const stylable = Stylable.create({
        projectRoot: params.rootPath || '',
        fileSystem: wrappedFs as MinimalFS,
        requireModule: require,
        cssParser: safeParse,
        resolverCache: new Map(),
    });
    const lsp = new VSCodeStylableLanguageService(connection, docs, wrappedFs, stylable);

    docs.listen(connection);
    docs.onDidChangeContent((event) => {
        lsp.cleanStylableCacheForDocument(event.document);
        lsp.emitDiagnosticsForOpenDocuments();
    });
    docs.onDidClose((event) => lsp.onDidClose(event));

    connection.onCompletion(lsp.onCompletion.bind(lsp));
    connection.onDefinition(lsp.onDefinition.bind(lsp));
    connection.onHover(lsp.onHover.bind(lsp));
    connection.onReferences(lsp.onReferences.bind(lsp));
    connection.onDocumentColor(lsp.onDocumentColor.bind(lsp));
    connection.onColorPresentation(lsp.onColorPresentation.bind(lsp));
    connection.onRenameRequest(lsp.onRenameRequest.bind(lsp));
    connection.onSignatureHelp(lsp.onSignatureHelp.bind(lsp));
    connection.onDocumentFormatting(lsp.onDocumentFormatting.bind(lsp));
    connection.onDocumentRangeFormatting(lsp.onDocumentRangeFormatting.bind(lsp));
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    connection.onDidChangeConfiguration(lsp.onChangeConfig.bind(lsp));
    connection.onInitialized(() => {
        connection.client.register(DidChangeConfigurationNotification.type, undefined).catch(console.error);
        lsp.loadClientConfiguration().then(console.log).catch(console.error);
    });
    return initializeResult;
});

connection.listen();
