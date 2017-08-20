'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_languageserver_1 = require("vscode-languageserver");
var vscode_resolver_1 = require("./adapters/vscode-resolver");
var provider_1 = require("./provider");
var connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
var workspaceRoot;
var provider = new provider_1.default();
var documents = new vscode_languageserver_1.TextDocuments();
var resolver = new vscode_resolver_1.VsCodeResolver(documents);
var OpenDocNotification;
(function (OpenDocNotification) {
    OpenDocNotification.type = new vscode_languageserver_1.NotificationType('stylable/openDocument');
})(OpenDocNotification || (OpenDocNotification = {}));
documents.listen(connection);
connection.onInitialize(function (params) {
    workspaceRoot = params.rootUri;
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"']
            }
        }
    };
});
connection.listen();
connection.onCompletion(function (params) {
    connection.sendNotification(OpenDocNotification.type, '/home/wix/projects/demo/test.css');
    console.log('Looking for file');
    var doc = documents.get(params.textDocument.uri).getText();
    var pos = params.position;
    return provider.provideCompletionItemsFromSrc(doc, { line: pos.line, character: pos.character }, params.textDocument.uri, resolver)
        .then(function (res) {
        console.log('Received Completions in server:');
        return res.map(function (com) {
            console.log(JSON.stringify(com, null, '\t'));
            var vsCodeCompletion = vscode_languageserver_1.CompletionItem.create(com.label);
            var ted = vscode_languageserver_1.TextEdit.replace(com.range ? com.range : new provider_1.ProviderRange(new provider_1.ProviderPosition(pos.line, Math.max(pos.character - 1, 0)), pos), typeof com.insertText === 'string' ? com.insertText : com.insertText.source);
            vsCodeCompletion.insertTextFormat = vscode_languageserver_1.InsertTextFormat.Snippet;
            vsCodeCompletion.detail = com.detail;
            vsCodeCompletion.textEdit = ted;
            vsCodeCompletion.sortText = com.sortText;
            if (com.additionalCompletions) {
                vsCodeCompletion.command = {
                    title: "additional",
                    command: 'editorconfig._triggerSuggestAfterDelay',
                    arguments: []
                };
            }
            return vsCodeCompletion;
        });
    });
});
//# sourceMappingURL=server.js.map