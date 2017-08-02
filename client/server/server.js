'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_1 = require("vscode");
const provider_1 = require("./provider");
const vscode_resolver_1 = require("./adapters/vscode-resolver");
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
let workspaceRoot;
let documents = new vscode_languageserver_1.TextDocuments();
const resolver = new vscode_resolver_1.VsCodeResolver({});
const provider = new provider_1.default();
function getRange(rng) {
    if (!rng) {
        return;
    }
    const r = new vscode_1.Range(new vscode_1.Position(rng.start.line, rng.start.character), new vscode_1.Position(rng.end.line, rng.end.character));
    return r;
}
connection.onInitialize((params) => {
    workspaceRoot = params.rootUri;
    return {
        capabilities: {
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"']
            },
        }
    };
});
connection.listen();
connection.onCompletion((params) => {
    const doc = documents.get(params.textDocument.uri);
    const src = doc.getText();
    const pos = params.position;
    return provider.provideCompletionItemsFromSrc(src, { line: pos.line, character: pos.character }, doc.uri, resolver)
        .then((res) => {
        return res.map((com) => {
            let vsCodeCompletion = vscode_1.CompletionItem.create(com.label);
            let ted = vscode_1.TextEdit.replace(getRange(com.range), typeof com.insertText === 'string' ? com.insertText : com.insertText.source);
            vsCodeCompletion.detail = com.detail;
            vsCodeCompletion.textEdit = ted;
            vsCodeCompletion.sortText = com.sortText;
            if (com.additionalCompletions) {
                // commands.getCommands().then((res)=>{debugger;})
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