'use strict';
import {
    IPCMessageReader, IPCMessageWriter, createConnection, IConnection, InitializeParams, InitializeResult,
    TextDocuments, TextDocumentPositionParams
} from 'vscode-languageserver';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import { CompletionItemProvider, Position, CancellationToken, CompletionItemKind,
    Range, SnippetString, Command, TextEdit, TextDocument, CompletionItem } from 'vscode';

import Provider, { Completion, snippet, ExtendedResolver, ProviderRange, Dir, File, FsEntity } from './provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import { VsCodeResolver } from './adapters/vscode-resolver'
import * as _ from 'lodash';

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let workspaceRoot: string;
let documents: TextDocuments = new TextDocuments();
const resolver = new VsCodeResolver({});
const provider = new Provider();

function getRange(rng: ProviderRange | undefined): Range | undefined {
    if (!rng) {
        return;
    }
    const r = new Range(new Position(rng.start.line, rng.start.character), new Position(rng.end.line, rng.end.character));
    return r
}

connection.onInitialize((params): InitializeResult => {
    workspaceRoot = <string>params.rootUri;
    return {
        capabilities: {
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"']
            },
        }
    }
});

connection.listen();

connection.onCompletion((params): Thenable<CompletionItem[]> => {
    const doc = documents.get(params.textDocument.uri);
    const src = doc.getText();
    const pos = params.position;
    return provider.provideCompletionItemsFromSrc(src, { line: pos.line, character: pos.character }, doc.uri, resolver)
        .then((res) => {
            return res.map((com: Completion) => {
                let vsCodeCompletion = CompletionItem.create(com.label);
                let ted: TextEdit = TextEdit.replace(getRange(com.range), typeof com.insertText === 'string' ? com.insertText : com.insertText.source)

                vsCodeCompletion.detail = com.detail;
                vsCodeCompletion.textEdit = ted;
                vsCodeCompletion.sortText = com.sortText;
                if (com.additionalCompletions) {
                    // commands.getCommands().then((res)=>{debugger;})
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


