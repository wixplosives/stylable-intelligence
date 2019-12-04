import {
    createConnection,
    IConnection,
    IPCMessageReader,
    IPCMessageWriter,
    DidChangeConfigurationNotification
} from 'vscode-languageserver';

import { initializeResult } from './capabilities';
import { VscodeStylableLanguageService } from './vscode-service';

const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

connection.listen();
connection.onInitialize(params => {
    const stylableLSP = new VscodeStylableLanguageService(connection, params.rootPath || '');
    const textDocuments = stylableLSP.textDocuments;

    textDocuments.listen(connection);
    textDocuments.onDidChangeContent(stylableLSP.createDiagnosticsHandler());
    textDocuments.onDidClose(stylableLSP.onDidClose());

    connection.onCompletion(stylableLSP.onCompletion.bind(stylableLSP));
    connection.onDefinition(stylableLSP.onDefinition.bind(stylableLSP));
    connection.onHover(stylableLSP.onHover.bind(stylableLSP));
    connection.onReferences(stylableLSP.onReferences.bind(stylableLSP));
    connection.onDocumentColor(stylableLSP.onDocumentColor.bind(stylableLSP));
    connection.onColorPresentation(stylableLSP.onColorPresentation.bind(stylableLSP));
    connection.onRenameRequest(stylableLSP.onRenameRequest.bind(stylableLSP));
    connection.onSignatureHelp(stylableLSP.onSignatureHelp.bind(stylableLSP));
    connection.onDidChangeConfiguration(stylableLSP.createDiagnosticsHandler());

    // connection.onDocumentFormatting(stylableLSP.onDocumentFormatting.bind(stylableLSP));

    return initializeResult;
});

connection.onInitialized(() => {
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
});
