'use strict';
import {createConnection, IConnection, IPCMessageReader, IPCMessageWriter} from 'vscode-languageserver';
import {LocalSyncFs} from './local-sync-fs';
import {init} from "./server-utils";

const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

connection.listen();
const fileSystem = new LocalSyncFs('');

init(fileSystem, connection);
