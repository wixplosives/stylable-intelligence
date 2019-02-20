import {
    createConnection,
    IConnection,
    IPCMessageReader,
    IPCMessageWriter,
    DidChangeConfigurationNotification
} from 'vscode-languageserver';
import { LocalSyncFs } from './local-sync-fs';
import { init } from './server-utils';
import { initializeResult } from '../view';

const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

connection.listen();
connection.onInitialize(params => {
    const rootPath = params.rootPath || '';

    init(new LocalSyncFs(''), connection, rootPath);

    return initializeResult;
});

connection.onInitialized(() => {
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
});
