'use strict';
import {
    CompletionItem,
    createConnection,
    IConnection,
    InitializeResult,
    InsertTextFormat,
    IPCMessageReader,
    IPCMessageWriter,
    TextDocuments,
    TextEdit,
    // NotificationType
} from 'vscode-languageserver';

import { VsCodeResolver } from './adapters/vscode-resolver';
import Provider, { Completion, ProviderPosition, ProviderRange } from './provider';

let workspaceRoot: string;
const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const documents: TextDocuments = new TextDocuments();

const resolver = new VsCodeResolver(documents);

const provider = new Provider(resolver);

// namespace OpenDocNotification {
// 	export const type = new NotificationType<string, void>('stylable/openDocument');
// }


documents.listen(connection);

connection.onInitialize((params): InitializeResult => {
    workspaceRoot = params.rootUri!;

    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"']
            }
        }
    }
});

connection.listen();


connection.onCompletion((params): Thenable<CompletionItem[]> => {
    // connection.sendNotification(OpenDocNotification.type, '/home/wix/projects/demo/test.css');
    console.log('Looking for file');
    debugger;

    const doc = documents.get(params.textDocument.uri).getText();
    const pos = params.position;
    return provider.provideCompletionItemsFromSrc(doc, { line: pos.line, character: pos.character }, params.textDocument.uri)
        .then((res) => {
            console.log('Received Completions in server:')
            return res.map((com: Completion) => {
                console.log(JSON.stringify(com, null, '\t'));
                let vsCodeCompletion = CompletionItem.create(com.label);
                let ted: TextEdit = TextEdit.replace(
                    com.range ? com.range : new ProviderRange(new ProviderPosition(pos.line, Math.max(pos.character - 1, 0)), pos),
                    typeof com.insertText === 'string' ? com.insertText : com.insertText.source)
                vsCodeCompletion.insertTextFormat = InsertTextFormat.Snippet;
                vsCodeCompletion.detail = com.detail;
                vsCodeCompletion.textEdit = ted;
                vsCodeCompletion.sortText = com.sortText;
                if (com.additionalCompletions) {
                    vsCodeCompletion.command = {
                        title: "additional",
                        command: 'editorconfig._triggerSuggestAfterDelay',
                        arguments: []
                    }
                }
                return vsCodeCompletion;
            })
        })
})

// function getRange(rng: ProviderRange | undefined): Range | undefined {
//     if (!rng) {
//         return;
//     }
//     const r = Range.create(Position.create(rng.start.line, rng.start.character), Position.create(rng.end.line, rng.end.character));
//     return r
// }


