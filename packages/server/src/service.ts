'use strict';
import { setInterval } from 'timers';
import * as path from 'path';
import { IConnection, InitializeResult, TextDocuments, Definition, Hover, TextDocument, ServerCapabilities, SignatureHelp, NotificationType, WorkspaceEdit, ReferenceParams, TextDocumentPositionParams } from 'vscode-languageserver';
import { createProvider, MinimalDocs, MinimalDocsDispatcher, } from './provider-factory';
import { ProviderPosition, ProviderRange } from './completion-providers';
import { Completion } from './completion-types';
import { createDiagnosis } from './diagnosis';
import * as VCL from 'vscode-css-languageservice';
import { Command, Position, Range, Location, TextEdit, CompletionItem, ParameterInformation } from 'vscode-languageserver-types';
import { ServerCapabilities as CPServerCapabilities, DocumentColorRequest, ColorPresentationRequest, ColorInformation } from 'vscode-languageserver-protocol/lib/protocol.colorProvider.proposed';
import { valueMapping } from 'stylable';
import { fromVscodePath, toVscodePath } from './utils/uri-utils';
import { createMeta, fixAndProcess, getRefs } from './provider';
import { Stylable, evalDeclarationValue } from 'stylable';
import * as ts from 'typescript'
import { FileSystemReadSync, Directory, DirectoryContent } from 'kissfs';
export { MinimalDocs } from './provider-factory';
import { NotificationTypes, LSPTypeHelpers, ExtendedFSReadSync, ExtendedTsLanguageService } from './types'
import { createLanguageServiceHost, createBaseHost } from './utils/temp-language-service-host';
import { isInNode, pathFromPosition, isRoot, isSelector, } from './utils/postcss-ast-utils';
import { last } from 'lodash';
import { LocalSyncFs } from './local-sync-fs';
import { NodeBase, ContainerBase, Rule, Declaration } from 'postcss';
import { CSSResolve } from 'stylable/dist/src/stylable-resolver';

//exporting types for use in playground
export { ExtendedTsLanguageService, ExtendedFSReadSync, NotificationTypes } from './types'

export class StylableLanguageService {
    constructor(connection: IConnection, services: { styl: Stylable, tsLanguageService: ExtendedTsLanguageService }, fs: ExtendedFSReadSync, docsDispatcher: MinimalDocsDispatcher, notifications: NotificationTypes) {

        const provider = createProvider(services.styl, services.tsLanguageService);
        const processor = provider.styl.fileProcessor;
        const cssService = VCL.getCSSLanguageService();
        let base: string;
        let symbolMap: Map<CSSResolve, string[]>;

        connection.onInitialize((params): InitializeResult => {
            base = params.rootUri!;
            return {
                capabilities: ({
                    textDocumentSync: 1,//documents.syncKind,
                    completionProvider: {
                        triggerCharacters: ['.', '-', ':', '"', ',']
                    },
                    definitionProvider: true,
                    hoverProvider: true,
                    referencesProvider: true,
                    renameProvider: true,
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

        connection.onHover((params: TextDocumentPositionParams): Thenable<Hover> => {
            let hover = cssService.doHover(fs.get(params.textDocument.uri), params.position, cssService.parseStylesheet(fs.get(params.textDocument.uri)));
            return Promise.resolve(hover!) //Because Hover may be null, but not of null type - vscode code isn't strict that way.
        });

        connection.onReferences(async (params: ReferenceParams): Promise<Location[]> => {
            const cssRefs = cssService.findReferences(fs.get(params.textDocument.uri), params.position, cssService.parseStylesheet(fs.get(params.textDocument.uri)));
            const refs = getRefs(params,fs);
            return refs.length ? dedupeRefs(refs) : dedupeRefs(cssRefs)
        });

        connection.onRequest(notifications.colorRequest.type, params => {
            const document = fs.get(params.textDocument.uri);

            const src = document.getText();
            const res = fixAndProcess(src, new ProviderPosition(0, 0), params.textDocument.uri);
            const meta = res.processed.meta!;

            let colorComps: ColorInformation[] = [];


            const lines = src.split('\n');
            lines.forEach((line, ind) => {
                let valueRegex = /value\(([\w-]+)\)/g;
                let regexResult;
                while ((regexResult = valueRegex.exec(line)) !== null) {
                    const result = regexResult[1];
                    const sym = meta.mappedSymbols[result];
                    if (sym && sym._kind === 'var') {
                        const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(services.styl.resolver, sym.text, meta, sym.node) + '}');
                        const stylesheet: VCL.Stylesheet = cssService.parseStylesheet(doc);
                        const colors = cssService.findDocumentColors(doc, stylesheet);
                        const color = colors.length ? colors[0].color : null;
                        if (color) {
                            const range = new ProviderRange(
                                new ProviderPosition(ind, regexResult.index + regexResult[0].indexOf(regexResult[1]) - 'value('.length),
                                new ProviderPosition(ind, regexResult.index + regexResult[0].indexOf(regexResult[1]) + result.length)
                            )
                            colorComps.push({ color, range } as ColorInformation)
                        }
                    } else if (sym && sym._kind === 'import' && sym.type === 'named') {
                        const impMeta = processor.process(sym.import.from);
                        const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(services.styl.resolver, 'value(' + sym.name + ')', impMeta, impMeta.vars.find(v => v.name === sym.name)!.node) + '}');
                        const stylesheet: VCL.Stylesheet = cssService.parseStylesheet(doc);
                        const colors = cssService.findDocumentColors(doc, stylesheet);
                        const color = colors.length ? colors[0].color : null;
                        if (color) {
                            const range = new ProviderRange(
                                new ProviderPosition(ind, regexResult.index + regexResult[0].indexOf(regexResult[1]) - 'value('.length),
                                new ProviderPosition(ind, regexResult.index + regexResult[0].indexOf(regexResult[1]) + result.length)
                            )
                            colorComps.push({ color, range } as ColorInformation)
                        }
                    }

                }
            })

            meta.imports.forEach(imp => {
                const impMeta = processor.process(imp.from);
                const vars = impMeta.vars;
                vars.forEach(v => {
                    const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(services.styl.resolver, v.text, impMeta, v.node) + '}');
                    const stylesheet: VCL.Stylesheet = cssService.parseStylesheet(doc);
                    const colors = cssService.findDocumentColors(doc, stylesheet);
                    const color = colors.length ? colors[0].color : null;
                    if (color) {
                        meta.rawAst.walkDecls(valueMapping.named, (decl) => {
                            const lines = decl.value.split('\n');
                            const lineIndex = lines.findIndex(l => l.includes(v.name)); //replace with regex
                            if (lineIndex > -1 && lines[lineIndex].indexOf(v.name) > -1) {

                                let extraLines = 0;
                                let extraChars = 0;
                                if (decl.raws.between) {
                                    extraLines = decl.raws.between.split('\n').length - 1;
                                    extraChars = last(decl.raws.between.split('\n'))!.length
                                }
                                const varStart = lineIndex //replace with value parser
                                    ? lines[lineIndex].indexOf(v.name) //replace with regex
                                    : extraLines
                                        ? lines[lineIndex].indexOf(v.name) + extraChars
                                        : lines[lineIndex].indexOf(v.name) + valueMapping.named.length + decl.source.start!.column + extraChars - 1
                                const range = new ProviderRange(
                                    new ProviderPosition(decl.source.start!.line - 1 + lineIndex + extraLines, varStart),
                                    new ProviderPosition(decl.source.start!.line - 1 + lineIndex + extraLines, v.name.length + varStart)
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

            const word = src.split('\n')[params.range.start.line].slice(params.range.start.character, params.range.end.character);
            if (word.startsWith('value(')) { return [] };

            const wordStart = new ProviderPosition(params.range.start.line + 1, params.range.start.character + 1);
            let noPicker = false;
            meta.rawAst.walkDecls(valueMapping.named, (node) => {
                if (
                    ((wordStart.line === node.source.start!.line && wordStart.character >= node.source.start!.column) || wordStart.line > node.source.start!.line)
                    &&
                    ((wordStart.line === node.source.end!.line && wordStart.character <= node.source.end!.column) || wordStart.line < node.source.end!.line)
                ) {
                    noPicker = true;
                }
            })
            if (noPicker) { return [] };
            const stylesheet: VCL.Stylesheet = cssService.parseStylesheet(document);
            const colors = cssService.getColorPresentations(document, stylesheet, params.color, params.range)
            return colors;
        });

        connection.onRenameRequest((params): WorkspaceEdit => {
            let edit: WorkspaceEdit = { changes: {} };
            getRefs({ context: { includeDeclaration: true }, position: params.position, textDocument: params.textDocument }, fs)
                .forEach(ref => {
                    if (edit.changes![ref.uri]) {
                        edit.changes![ref.uri].push({ range: ref.range, newText: params.newName })
                    } else {
                        edit.changes![ref.uri] = [{ range: ref.range, newText: params.newName }]
                    }
                })

            return edit;
        })

        connection.onSignatureHelp((params): Thenable<SignatureHelp> => {

            const doc: string = fs.loadTextFileSync(params.textDocument.uri);

            let sig = provider.getSignatureHelp(doc, params.position, params.textDocument.uri, fs, ParameterInformation);
            return Promise.resolve(sig!)
        })

        function readDocRange(doc: TextDocument, rng: Range): string {
            let lines = doc.getText().split('\n');
            return lines[rng.start.line].slice(rng.start.character, rng.end.character);
        }



        function dedupeRefs(refs: Location[]): Location[] {
            let res: Location[] = [];
            refs.forEach(ref => {
                if (!res.find(r => r.range.start.line === ref.range.start.line && r.range.start.character === ref.range.start.character && r.uri === ref.uri)) {
                    res.push(ref);
                }
            })
            return res;
        }
    }
}

