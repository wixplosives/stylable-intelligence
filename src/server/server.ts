'use strict';
import {
    IPCMessageReader, IPCMessageWriter,
    createConnection, IConnection, TextDocumentSyncKind,
    TextDocuments, Diagnostic, DiagnosticSeverity,
    InitializeParams, InitializeResult, TextDocumentPositionParams, CompletionItem
} from 'vscode-languageserver';

import {
    workspace, languages, window, commands,
    ExtensionContext, TextDocument, Disposable, CompletionItemProvider,
    Position, CancellationToken,
    CompletionItemKind, Range, SnippetString, Command
} from 'vscode';


import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import Provider, { Completion, snippet, ExtendedResolver, ProviderRange, Dir, File, FsEntity } from '../provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// let documents: TextDocuments = new TextDocuments();
// // Make the text document manager listen on the connection
// // for open, change and close text document events
// documents.listen(connection);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
    workspaceRoot = <string>params.rootUri;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            // textDocumentSync: documents.syncKind
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"']
            }
        }
    }
});

// Listen on the connection
connection.listen();

connection.onCompletion((params): CompletionItem[] => {
     return [
         {
             label: 'garrrrr',
             kind: 1,
             data: 'some data'
         }
    ]
})




const provider = new Provider();

class VsCodeResolver extends Resolver implements ExtendedResolver {
    st: Stylesheet;
    resolveModule(filePath: string) {
        const globalPath: string = path.resolve(path.parse(this.st.source).dir, filePath);
        return super.resolveModule(globalPath);
    }
    resolveDependencies(stylesheet: Stylesheet): Thenable<void> {
        const promises: Thenable<any>[] = stylesheet.imports.map((importNode) => {
            const globalPath: string = path.resolve(path.parse(stylesheet.source).dir, importNode.from)
            return workspace.openTextDocument(globalPath)
                .then((doc) => {
                    if (_.endsWith(importNode.from, '.css')) {
                        this.add(globalPath, fromCSS(doc.getText()))
                    }
                })
        });
        return Promise.all(promises)
            .then(() => { })
    }
    resolveSymbols(s: Stylesheet) {
        this.st = s;
        return super.resolveSymbols(s);
    }
    getFolderContents(path: string) {
        const res: FsEntity[] = [];
        return Promise.resolve(res);
    }
}

const resolver = new VsCodeResolver({});

export class StylableDotCompletionProvider implements CompletionItemProvider {
    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken | null): Thenable<CompletionItem[]> {
        const src = document.getText();
        return provider.provideCompletionItemsFromSrc(src, { line: position.line, character: position.character }, document.fileName, resolver).then((res) => {
            return res.map((com: Completion) => {
                let vsCodeCompletion = CompletionItem.create(com.label);
                vsCodeCompletion.detail = com.detail;
                vsCodeCompletion.range = getRange(com.range);
                if (typeof com.insertText === 'string') {
                    vsCodeCompletion.insertText = com.insertText;
                } else if (com.insertText) {
                    const a: SnippetString = new SnippetString(com.insertText.source);

                    vsCodeCompletion.insertText = a.value;

                }
                vsCodeCompletion.sortText = com.sortText;
                if (com.additionalCompletions) {
                    // commands.getCommands().then((res)=>{
                    //     debugger;
                    // })
                    vsCodeCompletion.command = {
                        title: "additional",
                        command: 'editorconfig._triggerSuggestAfterDelay',
                        arguments: []
                    }
                }
                return vsCodeCompletion;
            })
        })
    }

}

function getRange(rng: ProviderRange | undefined): Range | undefined {
    if (!rng) {
        return;
    }
    const r = new Range(new Position(rng.start.line, rng.start.character), new Position(rng.end.line, rng.end.character));
    return r
}
