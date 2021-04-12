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
import { VscodeStylableLanguageService } from './vscode-service';
import { wrapFs } from './wrap-fs';

const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let vscodeStylableLSP: VscodeStylableLanguageService;

connection.listen();
connection.onInitialize((params) => {
    const docs = new TextDocuments(TextDocument);
    const wrappedFs = wrapFs(fs, docs);

    vscodeStylableLSP = new VscodeStylableLanguageService(
        connection,
        docs,
        wrappedFs,
        Stylable.create({
            projectRoot: params.rootPath || '',
            fileSystem: wrappedFs as MinimalFS,
            requireModule: require,
            cssParser: safeParse
        })
    );

    docs.listen(connection);
    docs.onDidChangeContent(vscodeStylableLSP.diagnoseWithVsCodeConfig.bind(vscodeStylableLSP));
    docs.onDidClose(vscodeStylableLSP.onDidClose.bind(vscodeStylableLSP));

    connection.onCompletion(vscodeStylableLSP.onCompletion.bind(vscodeStylableLSP));
    connection.onDefinition(vscodeStylableLSP.onDefinition.bind(vscodeStylableLSP));
    connection.onHover(vscodeStylableLSP.onHover.bind(vscodeStylableLSP));
    connection.onReferences(vscodeStylableLSP.onReferences.bind(vscodeStylableLSP));
    connection.onDocumentColor(vscodeStylableLSP.onDocumentColor.bind(vscodeStylableLSP));
    connection.onColorPresentation(vscodeStylableLSP.onColorPresentation.bind(vscodeStylableLSP));
    connection.onRenameRequest(vscodeStylableLSP.onRenameRequest.bind(vscodeStylableLSP));
    connection.onSignatureHelp(vscodeStylableLSP.onSignatureHelp.bind(vscodeStylableLSP));
    connection.onDocumentFormatting(vscodeStylableLSP.onDocumentFormatting.bind(vscodeStylableLSP));
    connection.onDocumentRangeFormatting(vscodeStylableLSP.onDocumentRangeFormatting.bind(vscodeStylableLSP));
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    connection.onDidChangeConfiguration(vscodeStylableLSP.onChangeConfig.bind(vscodeStylableLSP));

    return initializeResult;
});

connection.onInitialized(() => {
    connection.client.register(DidChangeConfigurationNotification.type, undefined).catch(console.error);
    vscodeStylableLSP.loadClientConfiguration().then(console.log).catch(console.error);
});
