'use strict';
import {
    IPCMessageReader, IPCMessageWriter,
    createConnection, IConnection, TextDocumentSyncKind,
    TextDocuments, Diagnostic, DiagnosticSeverity,
    InitializeParams, InitializeResult, TextDocumentPositionParams, CompletionItem, CompletionItemKind, Range, Position, TextEdit, InsertTextFormat
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
const resolver = new VsCodeResolver({});

connection.onInitialize((params): InitializeResult => {
    workspaceRoot = <string>params.rootUri;
    return {
        capabilities: {
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"']
            }
        }
    }
});

connection.listen();

connection.onCompletion((params): Thenable<CompletionItem[]> => {
    console.log('Looking for file');
    const doc = fs.readFileSync(params.textDocument.uri.slice(7)).toString();
    const pos = params.position;
    return provider.provideCompletionItemsFromSrc(doc, { line: pos.line, character: pos.character }, params.textDocument.uri, resolver)
        .then((res) => {
            console.log('Received Completions in server:')
            return res.map((com: Completion) => {
                console.log(JSON.stringify(com, null, '\t'));
                let vsCodeCompletion = CompletionItem.create(com.label);
                // let ted: TextEdit = TextEdit.insert(pos, typeof com.insertText === 'string' ? com.insertText : com.insertText.source)
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


