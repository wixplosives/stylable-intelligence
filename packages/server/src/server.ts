'use strict';
import { connect } from 'tls';
import {
    IPCMessageReader, IPCMessageWriter, createConnection, IConnection, InitializeParams, InitializeResult,
    TextDocumentSyncKind, TextDocuments, TextDocumentPositionParams,
    CompletionItem, CompletionItemKind, Range, Position, TextEdit, InsertTextFormat
} from 'vscode-languageserver';
import Provider, { Completion, snippet, ExtendedResolver, ProviderRange, ProviderPosition, Dir, File, FsEntity } from './provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');
import * as fs from 'fs';
import { VsCodeResolver } from './adapters/vscode-resolver'

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let workspaceRoot: string;
const provider = new Provider();
let documents: TextDocuments = new TextDocuments();
const resolver = new VsCodeResolver(connection, documents);


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
    console.log('Looking for file');
    const doc = documents.get(params.textDocument.uri).getText();
    const pos = params.position;
    return provider.provideCompletionItemsFromSrc(doc, { line: pos.line, character: pos.character }, params.textDocument.uri, resolver)
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

function getRange(rng: ProviderRange | undefined): Range | undefined {
    if (!rng) {
        return;
    }
    const r = Range.create(Position.create(rng.start.line, rng.start.character), Position.create(rng.end.line, rng.end.character));
    return r
}


