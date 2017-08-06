'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_languageserver_1 = require("vscode-languageserver");
var provider_1 = require("./provider");
var fs = require("fs");
var vscode_resolver_1 = require("./adapters/vscode-resolver");
var connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
var workspaceRoot;
var provider = new provider_1.default();
var resolver = new vscode_resolver_1.VsCodeResolver({});
connection.onInitialize(function (params) {
    workspaceRoot = params.rootUri;
    return {
        capabilities: {
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"']
            }
        }
    };
});
connection.listen();
connection.onCompletion(function (params) {
    console.log('Looking for file');
    debugger;
    var doc = fs.readFileSync(params.textDocument.uri.slice(7)).toString();
    var pos = params.position;
    return provider.provideCompletionItemsFromSrc(doc, { line: pos.line, character: pos.character }, params.textDocument.uri, resolver)
        .then(function (res) {
        return res.map(function (com) {
            var vsCodeCompletion = vscode_languageserver_1.CompletionItem.create(com.label);
            var ted = vscode_languageserver_1.TextEdit.insert(pos, typeof com.insertText === 'string' ? com.insertText : com.insertText.source);
            // replace(getRange(com.range), typeof com.insertText === 'string' ? com.insertText : com.insertText.source)
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
function getRange(rng) {
    if (!rng) {
        return;
    }
    var r = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(rng.start.line, rng.start.character), vscode_languageserver_1.Position.create(rng.end.line, rng.end.character));
    return r;
}
//# sourceMappingURL=server.js.map