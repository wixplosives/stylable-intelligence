'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_languageserver_1 = require("vscode-languageserver");
var connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// let documents: TextDocuments = new TextDocuments();
// // Make the text document manager listen on the connection
// // for open, change and close text document events
// documents.listen(connection);
// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
var workspaceRoot;
connection.onInitialize(function (params) {
    workspaceRoot = params.rootUri;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            // textDocumentSync: documents.syncKind
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"']
            }
        }
    };
});
// Listen on the connection
connection.listen();
connection.onCompletion(function (params) {
    console.log('server tralala');
    debugger;
    console.log('server tralala 2');
    return [
        {
            label: 'garrrrr',
            kind: 1,
            data: 'some data'
        }
    ];
});
//# sourceMappingURL=server.js.map