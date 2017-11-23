'use strict';
import { CompletionItem, createConnection, IConnection, InitializeResult, InsertTextFormat, IPCMessageReader, IPCMessageWriter, TextDocuments, TextEdit, Location, Definition, Hover, TextDocument, Range, Position } from 'vscode-languageserver';
import { createProvider, } from './provider-factory';
import { ProviderPosition, ProviderRange } from './completion-providers';
import { Completion } from './completion-types';
import { createDiagnosis } from './diagnosis';
import * as VCL from 'vscode-css-languageservice';

const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const documents: TextDocuments = new TextDocuments();

const provider = createProvider(documents);
const processor = provider.styl.fileProcessor;
const cssService = VCL.getCSSLanguageService();

documents.listen(connection);

connection.onInitialize((params): InitializeResult => {
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                triggerCharacters: ['.', '-', ':', '"', ',']
            },
            definitionProvider: true,
            hoverProvider: true,
            referencesProvider: true,
        }
    }
});

connection.listen();

connection.onCompletion((params): Thenable<CompletionItem[]> => {
    if (!params.textDocument.uri.endsWith('.st.css') && !params.textDocument.uri.startsWith('untitled:')) { return Promise.resolve([]) }

    let cssCompsRaw = cssService.doComplete(documents.get(params.textDocument.uri), params.position, cssService.parseStylesheet(documents.get(params.textDocument.uri)))

    const doc = documents.get(params.textDocument.uri).getText();
    const pos = params.position;
    return provider.provideCompletionItemsFromSrc(doc, { line: pos.line, character: pos.character }, params.textDocument.uri)
        .then((res) => {
            return res.map((com: Completion) => {
                let lspCompletion = CompletionItem.create(com.label);
                let ted: TextEdit = TextEdit.replace(
                    com.range ? com.range : new ProviderRange(new ProviderPosition(pos.line, Math.max(pos.character - 1, 0)), pos),
                    typeof com.insertText === 'string' ? com.insertText : com.insertText.source)
                lspCompletion.insertTextFormat = InsertTextFormat.Snippet;
                lspCompletion.detail = com.detail;
                lspCompletion.textEdit = ted;
                lspCompletion.sortText = com.sortText;
                lspCompletion.filterText = typeof com.insertText === 'string' ? com.insertText : com.insertText.source;
                if (com.additionalCompletions) {
                    lspCompletion.command = {
                        title: "additional",
                        command: 'editorconfig._triggerSuggestAfterDelay',
                        arguments: []
                    }
                }
                return lspCompletion;
            }).concat(cssCompsRaw ? cssCompsRaw.items : [])
        });
});

documents.onDidChangeContent(function (change) {

    let cssDiags = cssService.doValidation(change.document, cssService.parseStylesheet(change.document))
        .filter(diag => {
            if (diag.code === 'emptyRules') { return false; }
            if (diag.code === 'css-unknownatrule' && readDocRange(change.document, diag.range) === '@custom-selector') { return false; }
            if (diag.code === 'css-lcurlyexpected' && readDocRange(change.document, Range.create(Position.create(diag.range.start.line, 0), diag.range.end)).startsWith('@custom-selector')) { return false; }
            if (diag.code === 'unknownProperties' ) {
                return false;
            }
            return true;
        })
        .map(diag => {
            diag.source = 'css';
            return diag;
        });

    let diagnostics = createDiagnosis(change.document, processor).map(diag => { diag.source = 'stylable'; return diag; });
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics: diagnostics.concat(cssDiags) })
});


connection.onDefinition((params): Thenable<Definition> => {
    const doc = documents.get(params.textDocument.uri).getText();
    const pos = params.position;
    return provider.getDefinitionLocation(doc, { line: pos.line, character: pos.character }, params.textDocument.uri)
        .then((res) => {
            return res.map(loc => Location.create('file://' + loc.uri, loc.range))
        });
});

connection.onHover((params): Thenable<Hover> => {
    let hover = cssService.doHover(documents.get(params.textDocument.uri), params.position, cssService.parseStylesheet(documents.get(params.textDocument.uri)));
    return Promise.resolve(hover!) //Because Hover may be null, but not of null type - vscode code isn't strict that way.
});

connection.onReferences((params): Thenable<Location[]> => {
    let refs = cssService.findReferences(documents.get(params.textDocument.uri), params.position, cssService.parseStylesheet(documents.get(params.textDocument.uri)))

    return Promise.resolve(refs)
});

function readDocRange(doc: TextDocument, rng: Range): string {
    let lines = doc.getText().split('\n');
    return lines[rng.start.line].slice(rng.start.character, rng.end.character);
}
