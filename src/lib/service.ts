import {
    ColorInformation,
    Definition,
    Hover,
    ReferenceParams,
    SignatureHelp,
    TextDocument,
    TextDocumentPositionParams,
    WorkspaceEdit
} from 'vscode-languageserver-protocol';
import {createProvider, MinimalDocs, MinimalDocsDispatcher,} from './provider-factory';
import {ProviderPosition, ProviderRange} from './completion-providers';
import {Completion} from './completion-types';
import {createDiagnosis} from './diagnosis';
import {Color} from 'vscode-css-languageservice';
import {Command, CompletionItem, Location, ParameterInformation, TextEdit} from 'vscode-languageserver-types';
import {evalDeclarationValue, Stylable, valueMapping} from 'stylable';
import {fromVscodePath, toVscodePath} from './utils/uri-utils';
import {fixAndProcess} from './provider';
import {ExtendedFSReadSync, ExtendedTsLanguageService, NotificationTypes} from './types'
import {last} from 'lodash';
import {IConnection} from "vscode-languageserver";
import {initializeResult} from "../view";
import {CompletionParams} from 'vscode-languageclient/lib/main';
import {CssService} from "../model/css-service";

export {MinimalDocs} from './provider-factory';

//exporting types for use in playground
export {ExtendedTsLanguageService, ExtendedFSReadSync, NotificationTypes} from './types'

export class StylableLanguageService {
    constructor(connection: IConnection, services: { styl: Stylable, tsLanguageService: ExtendedTsLanguageService, requireModule: typeof require }, fs: ExtendedFSReadSync, docsDispatcher: MinimalDocsDispatcher, notifications: NotificationTypes) {
        console.warn('StylableLanguageService class is deprecated and will be deleted soon. use initStylableLanguageService function instead');
        initStylableLanguageService(connection, services, fs, docsDispatcher, notifications);
    }
}

export function initStylableLanguageService(connection: IConnection, services: { styl: Stylable, tsLanguageService: ExtendedTsLanguageService, requireModule: typeof require }, fs: ExtendedFSReadSync, docsDispatcher: MinimalDocsDispatcher, notifications: NotificationTypes) {
    const provider = createProvider(services.styl, services.tsLanguageService);
    const processor = services.styl.fileProcessor;
    const newCssService = new CssService(fs);

    connection.onInitialize(() => initializeResult);

    connection.onCompletion((params: CompletionParams): CompletionItem[] => {
        const documentUri = params.textDocument.uri;
        const position = params.position;

        if (!documentUri.endsWith('.st.css') && !documentUri.startsWith('untitled:')) {
            return [];
        }

        const document = fs.get(documentUri);

        const res = provider.provideCompletionItemsFromSrc( document.getText(), {
            line: position.line,
            character: position.character
        }, documentUri, fs);

        return res.map((com: Completion) => {
            let lspCompletion: CompletionItem = CompletionItem.create(com.label);
            let ted: TextEdit = TextEdit.replace(
                com.range ? com.range : new ProviderRange(new ProviderPosition(position.line, Math.max(position.character - 1, 0)), position),
                typeof com.insertText === 'string' ? com.insertText : com.insertText.source);
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
        }).concat(newCssService.getCompletions(document, position));
    });

    function diagnose(document: TextDocument) {
        let diagnostics = createDiagnosis(document, fs, processor, services.requireModule).map(diag => {
            diag.source = 'stylable';
            return diag;
        }).concat(newCssService.getDiagnostics(document));
        connection.sendDiagnostics({uri: document.uri, diagnostics: diagnostics});
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

        return provider.getDefinitionLocation(doc, {
            line: pos.line,
            character: pos.character
        }, fromVscodePath(params.textDocument.uri), fs)
            .then((res) => {
                return res.map(loc => Location.create(toVscodePath(loc.uri), loc.range))
            });
    });

    connection.onHover((params: TextDocumentPositionParams): Hover | null => {
        return newCssService.doHover(fs.get(params.textDocument.uri), params.position);
    });

    connection.onReferences((params: ReferenceParams): Location[] => {
        const refs = provider.getRefs(params, fs);
        if (refs.length) {
            return dedupeRefs(refs);
        } else {
            return dedupeRefs(newCssService.findReferences(fs.get(params.textDocument.uri), params.position));
        }
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
                let color: Color | null = null;
                if (sym && sym._kind === 'var') {
                    const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(services.styl.resolver, sym.text, meta, sym.node) + '}');
                    color = newCssService.findColor(doc);
                } else if (sym && sym._kind === 'import' && sym.type === 'named') {
                    const impMeta = processor.process(sym.import.from);
                    const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(services.styl.resolver, 'value(' + sym.name + ')', impMeta, impMeta.vars.find(v => v.name === sym.name)!.node) + '}');
                    color = newCssService.findColor(doc);
                }
                if (color) {
                    const range = new ProviderRange(
                        new ProviderPosition(ind, regexResult.index + regexResult[0].indexOf(regexResult[1]) - 'value('.length),
                        new ProviderPosition(ind, regexResult.index + regexResult[0].indexOf(regexResult[1]) + result.length)
                    );
                    colorComps.push({color, range} as ColorInformation)
                }
            }
        });

        meta.imports.forEach(imp => {
            const impMeta = processor.process(imp.from);
            const vars = impMeta.vars;
            vars.forEach(v => {
                const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(services.styl.resolver, v.text, impMeta, v.node) + '}');
                const color = newCssService.findColor(doc);
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
                            );
                            colorComps.push({color, range} as ColorInformation)
                        }
                    });
                }
            });
        });

        return colorComps.concat(newCssService.findColors(document));
    });

    connection.onRequest(notifications.colorPresentationRequest.type, params => {
        const document = fs.get(params.textDocument.uri);

        const src = document.getText();
        const res = fixAndProcess(src, new ProviderPosition(0, 0), params.textDocument.uri);
        const meta = res.processed.meta!;

        const word = src.split('\n')[params.range.start.line].slice(params.range.start.character, params.range.end.character);
        if (word.startsWith('value(')) {
            return []
        }

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
        });
        if (noPicker) {
            return []
        }
        return newCssService.getColorPresentations(document, params.color, params.range);
    });

    connection.onRenameRequest((params): WorkspaceEdit => {
        let edit: WorkspaceEdit = {changes: {}};
        provider.getRefs({
            context: {includeDeclaration: true},
            position: params.position,
            textDocument: params.textDocument
        }, fs)
            .forEach(ref => {
                if (edit.changes![ref.uri]) {
                    edit.changes![ref.uri].push({range: ref.range, newText: params.newName})
                } else {
                    edit.changes![ref.uri] = [{range: ref.range, newText: params.newName}]
                }
            })

        return edit;
    });

    connection.onSignatureHelp((params): Thenable<SignatureHelp> => {

        const doc: string = fs.loadTextFileSync(params.textDocument.uri);

        let sig = provider.getSignatureHelp(doc, params.position, params.textDocument.uri, fs, ParameterInformation);
        return Promise.resolve(sig!)
    });


    function dedupeRefs(refs: Location[]): Location[] {
        let res: Location[] = [];
        refs.forEach(ref => {
            if (!res.find(r => r.range.start.line === ref.range.start.line && r.range.start.character === ref.range.start.character && r.uri === ref.uri)) {
                res.push(ref);
            }
        });
        return res;
    }
}

