'use strict';
// import { ProviderLocation } from './provider';
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
    Location,
    Definition,
    // Range,
    // Position,
} from 'vscode-languageserver';
import {
    createProvider,
    //  createProcessor
} from './provider-factory';
import { ProviderPosition, ProviderRange } from './completion-providers';
import { Completion } from './completion-types';
import { createDiagnosis } from './diagnosis'
let workspaceRoot: string;
const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const documents: TextDocuments = new TextDocuments();

const provider = createProvider(documents);
// const processor = createProcessor(documents)
const processor = provider.styl.fileProcessor;

documents.listen(connection);

connection.onInitialize((params): InitializeResult => {
    workspaceRoot = params.rootUri!;

    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"', ',']
            },
            definitionProvider : true
        }
    }
});

connection.listen();


connection.onCompletion((params): Thenable<CompletionItem[]> => {
    // connection.sendNotification(OpenDocNotification.type, '/home/wix/projects/demo/test.css');
    if (!params.textDocument.uri.endsWith('.st.css')) { return Promise.resolve([]) }
    const doc = documents.get(params.textDocument.uri).getText();
    const pos = params.position;
    return provider.provideCompletionItemsFromSrc(doc, { line: pos.line, character: pos.character }, params.textDocument.uri)
        .then((res) => {
            return res.map((com: Completion) => {
                let vsCodeCompletion = CompletionItem.create(com.label);
                let ted: TextEdit = TextEdit.replace(
                    com.range ? com.range : new ProviderRange(new ProviderPosition(pos.line, Math.max(pos.character - 1, 0)), pos),
                    typeof com.insertText === 'string' ? com.insertText : com.insertText.source)
                vsCodeCompletion.insertTextFormat = InsertTextFormat.Snippet;
                vsCodeCompletion.detail = com.detail;
                vsCodeCompletion.textEdit = ted;
                vsCodeCompletion.sortText = com.sortText;
                vsCodeCompletion.filterText = typeof com.insertText === 'string' ? com.insertText : com.insertText.source;
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

documents.onDidChangeContent(function (change) {
    let diagnostics = createDiagnosis(change.document, processor);
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics: diagnostics })
})

connection.onDefinition((params): Thenable<Definition> => {
    const doc = documents.get(params.textDocument.uri).getText();
    const pos = params.position;
    return provider.getDefinitionLocation(doc, { line: pos.line, character: pos.character }, params.textDocument.uri)
        .then((res) => {
            return res.map(loc => Location.create('file://' + loc.uri, loc.range))
        })
})
