'use strict';
import { setInterval } from 'timers';
import * as path from 'path';
///         *                                                                *        *                                        *          *                                                              *
import { IConnection, InitializeResult, TextDocuments, Definition, Hover, TextDocument, ServerCapabilities, SignatureHelp, NotificationType } from 'vscode-languageserver';
import { createProvider, MinimalDocs, MinimalDocsDispatcher, } from './provider-factory';
import { ProviderPosition, ProviderRange } from './completion-providers';
import { Completion } from './completion-types';
import { createDiagnosis } from './diagnosis';
import * as VCL from 'vscode-css-languageservice';
import { Command, Position, Range, Location, TextEdit, CompletionItem, ParameterInformation } from 'vscode-languageserver-types';
import { ServerCapabilities as CPServerCapabilities, DocumentColorRequest, ColorPresentationRequest, ColorInformation } from 'vscode-languageserver-protocol/lib/protocol.colorProvider.proposed';
import { valueMapping } from 'stylable/dist/src/stylable-value-parsers';
import { fromVscodePath, toVscodePath } from './utils/uri-utils';
import { createMeta, fixAndProcess } from './provider';
import { Stylable, evalDeclarationValue } from 'stylable';
import * as ts from 'typescript'
import { FileSystemReadSync } from 'kissfs';
export { MinimalDocs } from './provider-factory';
import { NotificationTypes, LSPTypeHelpers, ExtendedFSReadSync, ExtendedTsLanguageService } from './types'
import { createLanguageServiceHost, createBaseHost } from './utils/temp-language-service-host';
import { isInNode } from './utils/postcss-ast-utils';

//exporting types for use in playground
export { ExtendedTsLanguageService, ExtendedFSReadSync, NotificationTypes } from './types'

export class StylableLanguageService {
    constructor(connection: IConnection, services: { styl: Stylable, tsLanguageService: ExtendedTsLanguageService }, fs: ExtendedFSReadSync, docsDispatcher: MinimalDocsDispatcher, notifications: NotificationTypes) {



        const provider = createProvider(services.styl, services.tsLanguageService);
        const processor = provider.styl.fileProcessor;
        const cssService = VCL.getCSSLanguageService();


        connection.onInitialize((params): InitializeResult => {
            return {
                capabilities: ({
                    textDocumentSync: 1,//documents.syncKind,
                    completionProvider: {
                        triggerCharacters: ['.', '-', ':', '"', ',']
                    },
                    definitionProvider: true,
                    hoverProvider: true,
                    referencesProvider: true,
                    colorProvider: true,
                    signatureHelpProvider: {
                        triggerCharacters: [
                            '(',
                            ','
                        ]
                    },
                } as CPServerCapabilities & ServerCapabilities)
            }
        });

        connection.onCompletion((params): Thenable<CompletionItem[]> => {
            if (!params.textDocument.uri.endsWith('.st.css') && !params.textDocument.uri.startsWith('untitled:')) { return Promise.resolve([]) }
            const cssCompsRaw = cssService.doComplete(
                fs.get(params.textDocument.uri),
                params.position,
                cssService.parseStylesheet(fs.get(params.textDocument.uri))
            )
            const cssComps = cssCompsRaw ? cssCompsRaw.items : []
            const doc = fs.get(params.textDocument.uri).getText();

            const pos = params.position;

            return provider.provideCompletionItemsFromSrc(doc, { line: pos.line, character: pos.character }, params.textDocument.uri, fs)
                .then((res) => {
                    return res.map((com: Completion) => {
                        let lspCompletion: CompletionItem = CompletionItem.create(com.label);
                        let ted: TextEdit = TextEdit.replace(
                            com.range ? com.range : new ProviderRange(new ProviderPosition(pos.line, Math.max(pos.character - 1, 0)), pos),
                            typeof com.insertText === 'string' ? com.insertText : com.insertText.source)
                        lspCompletion.insertTextFormat = 2;
                        lspCompletion.detail = com.detail;
                        lspCompletion.textEdit = ted;
                        lspCompletion.sortText = com.sortText;
                        lspCompletion.filterText = typeof com.insertText === 'string' ? com.insertText : com.insertText.source;
                        if (com.additionalCompletions) {
                            lspCompletion.command = Command.create("additional", "editor.action.triggerSuggest")
                        } else if (com.triggerSignature) {
                            lspCompletion.command = Command.create("additional", "editor.action.triggerParameterHints")
                        }
                        return lspCompletion;
                    }).concat(cssComps)
                });
        });

        function diagnose(document: TextDocument) {
            let cssDiags =
                document.uri.endsWith('.css')
                    ? cssService.doValidation(document, cssService.parseStylesheet(document))
                        .filter(diag => {
                            if (diag.code === 'emptyRules') { return false; }
                            if (diag.code === 'css-unknownatrule' && readDocRange(document, diag.range) === '@custom-selector') { return false; }
                            if (diag.code === 'css-lcurlyexpected' && readDocRange(document, Range.create(Position.create(diag.range.start.line, 0), diag.range.end)).startsWith('@custom-selector')) { return false; }
                            if (diag.code === 'unknownProperties') {
                                let prop = diag.message.match(/'(.*)'/)![1]
                                let src = fs.loadTextFileSync(document.uri);
                                let meta = createMeta(src, document.uri).meta;
                                if (meta && Object.keys(meta.mappedSymbols).some(ms => ms === prop)) {
                                    return false;
                                }
                            }
                            return true;
                        })
                        .map(diag => {
                            diag.source = 'css';
                            return diag;
                        })
                    : [];

            let diagnostics = createDiagnosis(document, fs, processor).map(diag => { diag.source = 'stylable'; return diag; });
            connection.sendDiagnostics({ uri: document.uri, diagnostics: diagnostics.concat(cssDiags) })
        }


        docsDispatcher.onDidOpen(function (params) {
            diagnose(params.document);
        });
        docsDispatcher.onDidChangeContent(function (params) {
            diagnose(params.document);
        });

        connection.onDefinition((params): Thenable<Definition> => {
            const doc = fs.loadTextFileSync(params.textDocument.uri);
            const pos = params.position;

            return provider.getDefinitionLocation(doc, { line: pos.line, character: pos.character }, fromVscodePath(params.textDocument.uri), fs)
                .then((res) => {
                    return res.map(loc => Location.create(toVscodePath(loc.uri), loc.range))
                });
        });

        connection.onHover((params): Thenable<Hover> => {
            let hover = cssService.doHover(fs.get(params.textDocument.uri), params.position, cssService.parseStylesheet(fs.get(params.textDocument.uri)));
            return Promise.resolve(hover!) //Because Hover may be null, but not of null type - vscode code isn't strict that way.
        });

        connection.onReferences((params): Thenable<Location[]> => {
            let refs = cssService.findReferences(fs.get(params.textDocument.uri), params.position, cssService.parseStylesheet(fs.get(params.textDocument.uri)))

            return Promise.resolve(refs)
        });

        connection.onRequest(notifications.colorRequest.type, params => {
            const document = fs.get(params.textDocument.uri);

            const src = document.getText();
            const res = fixAndProcess(src, new ProviderPosition(0, 0), params.textDocument.uri);
            const meta = res.processed.meta!;

            let colorComps: ColorInformation[] = [];
            meta.imports.forEach(imp => {
                const vars = processor.process(imp.from).vars;
                vars.forEach(v => {
                    const doc = TextDocument.create('', 'css', 0, '.gaga {color: ' + evalDeclarationValue(services.styl.resolver, v.text, meta, v.node) + '}');
                    const stylesheet: VCL.Stylesheet = cssService.parseStylesheet(doc);
                    const colors = cssService.findDocumentColors(doc, stylesheet);
                    const color = colors.length ? colors[0].color : null;
                    if (color) {
                        meta.rawAst.walkDecls(valueMapping.named, (decl) => {
                            const lines = decl.value.split('\n');
                            const lineIndex = lines.findIndex(l => l.includes(v.name)) //replace with regex
                            if (lineIndex > -1 && lines[lineIndex].indexOf(v.name) > -1) {
                                const varStart = lineIndex //replace with value parser
                                    ? lines[lineIndex].indexOf(v.name) //replace with regex
                                    : lines[lineIndex].indexOf(v.name) + valueMapping.named.length + decl.source.start!.column + 1 //replace with regex
                                const range = new ProviderRange(
                                    new ProviderPosition(decl.source.start!.line - 1 + lineIndex, varStart),
                                    new ProviderPosition(decl.source.start!.line - 1 + lineIndex, v.name.length + varStart),
                                )
                                colorComps.push({ color, range } as ColorInformation)
                            }
                        });
                    }
                });
            });

            const stylesheet: VCL.Stylesheet = cssService.parseStylesheet(document);
            colorComps.push(...cssService.findDocumentColors(document, stylesheet));
            return colorComps;
        });

        connection.onRequest(notifications.colorPresentationRequest.type, params => {
            const document = fs.get(params.textDocument.uri);

            const src = document.getText();
            const res = fixAndProcess(src, new ProviderPosition(0, 0), params.textDocument.uri);
            const meta = res.processed.meta!;

            const wordStart = new ProviderPosition(params.range.start.line + 1, params.range.start.character + 1)
            let named = false;
            meta.rawAst.walkDecls(valueMapping.named, (node) => {
                if (
                    ((wordStart.line === node.source.start!.line && wordStart.character >= node.source.start!.column) || wordStart.line > node.source.start!.line)
                    &&
                    ((wordStart.line === node.source.end!.line && wordStart.character <= node.source.end!.column) || wordStart.line < node.source.end!.line)
                ) {
                    named = true;
                }
            })
            if (named) { return [] };
            const stylesheet: VCL.Stylesheet = cssService.parseStylesheet(document);
            const colors = cssService.getColorPresentations(document, stylesheet, params.color, params.range)
            return colors;

        });

        connection.onSignatureHelp((params): Thenable<SignatureHelp> => {

            const doc: string = fs.loadTextFileSync(params.textDocument.uri);

            let sig = provider.getSignatureHelp(doc, params.position, params.textDocument.uri, fs, ParameterInformation);
            return Promise.resolve(sig!)
        })

        function readDocRange(doc: TextDocument, rng: Range): string {
            let lines = doc.getText().split('\n');
            return lines[rng.start.line].slice(rng.start.character, rng.end.character);
        }

    }
}

