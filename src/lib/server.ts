import {
    createConnection,
    IConnection,
    IPCMessageReader,
    IPCMessageWriter,
    DidChangeConfigurationNotification,
    TextDocuments
} from 'vscode-languageserver';

import fs from '@file-services/node';
import { StylableLanguageService, connectLSP, initializeResult } from '@stylable/language-service';

const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

connection.listen();
connection.onInitialize(params => {
    const rootPath = params.rootPath || '';

    const stylableLSP = new StylableLanguageService({
        fs,
        rootPath,
        requireModule: require,
        textDocuments: new TextDocuments()
    });

    connectLSP(stylableLSP, connection);

    return initializeResult;
});

connection.onInitialized(() => {
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
});
