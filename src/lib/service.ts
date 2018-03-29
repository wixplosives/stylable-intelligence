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
import {MinimalDocs, MinimalDocsDispatcher,} from './provider-factory';
import {ProviderPosition, ProviderRange} from './completion-providers';
import {createDiagnosis} from './diagnosis';
import {Color} from 'vscode-css-languageservice';
import {CompletionItem, Location, ParameterInformation, TextEdit} from 'vscode-languageserver-types';
import {evalDeclarationValue, Stylable, valueMapping} from 'stylable';
import {fromVscodePath, toVscodePath} from './utils/uri-utils';
import {default as Provider} from './provider';
import {ExtendedFSReadSync, ExtendedTsLanguageService, NotificationTypes} from './types'
import {last} from 'lodash';
import {IConnection} from "vscode-languageserver";
import {initializeResult, modelToLspCompletion} from "../view";
import {CompletionParams} from 'vscode-languageclient/lib/main';
import {CssService} from "../model/css-service";
import {fixAndProcess} from "../model/provider-processing";

export {MinimalDocs} from './provider-factory';

//exporting types for use in playground
export {ExtendedTsLanguageService, ExtendedFSReadSync, NotificationTypes} from './types'

export class StylableLanguageService {
    constructor(connection: IConnection, services: { styl: Stylable, tsLanguageService: ExtendedTsLanguageService, requireModule: typeof require }, fs: ExtendedFSReadSync, docsDispatcher: MinimalDocsDispatcher, notifications: NotificationTypes) {
        console.warn('StylableLanguageService class is deprecated and will be deleted soon. use initStylableLanguageService function instead');
        initStylableLanguageService(connection, services, fs, docsDispatcher, notifications);
    }
}

// todo extract to util (+ unit test?)
function dedupeLocations(inputLocations: Location[]): Location[] {
    let dedupedLocations: Location[] = [];
    inputLocations.forEach(location1 => {
        if (!dedupedLocations.find(l => isLocationEqual(location1, l))) {
            dedupedLocations.push(location1);
        }
    });
    return dedupedLocations;
}

function isStylableDocument(documentUri: string) {
    return documentUri.endsWith('.st.css') || documentUri.startsWith('untitled:');
}

function isLocationEqual(location1:Location, location2:Location):boolean{
    return location2.range.start.line === location1.range.start.line && location2.range.start.character === location1.range.start.character && location2.uri === location1.uri;
}

export function initStylableLanguageService(connection: IConnection, services: { styl: Stylable, tsLanguageService: ExtendedTsLanguageService, requireModule: typeof require }, fs: ExtendedFSReadSync, docsDispatcher: MinimalDocsDispatcher, notifications: NotificationTypes) {
    const provider = new Provider(services.styl, services.tsLanguageService, fs);
    const processor = services.styl.fileProcessor;
    const cssService = new CssService();

    connection.onInitialize(() => initializeResult);

    connection.onCompletion(codeCompletion);

    docsDispatcher.onDidOpen(diagnose);

    function codeCompletion(params: CompletionParams): CompletionItem[] | undefined {
        if (isStylableDocument(params.textDocument.uri)) {
            const document = fs.get(params.textDocument.uri);
            return provider.provideCompletionItemsFromSrc(document.getText(), params.position, params.textDocument.uri)
                .map(modelToLspCompletion(params.position))
                .concat(cssService.getCompletions(document, params.position));
        } else {
            return undefined;
        }
    }

    function diagnose({document}: { document: TextDocument }) {
        if (isStylableDocument(document.uri)) {
            let diagnostics = createDiagnosis(document, processor, services.requireModule);
            diagnostics.forEach(diag => diag.source = 'stylable');
            if (!document.uri.endsWith('.css')){
                const cssDiagnostics = cssService.getDiagnostics(document);
                cssDiagnostics.forEach(diag => diag.source = 'css');
                diagnostics = diagnostics.concat(cssDiagnostics)
            }
            connection.sendDiagnostics({uri: document.uri, diagnostics});
        }
    }

    // TODO anything below this point is not tested

    async function definitions(params: TextDocumentPositionParams): Promise<Definition> {
        const doc = await fs.loadTextFile(params.textDocument.uri);
        const res = await provider.getDefinitionLocation(doc, params.position, fromVscodePath(params.textDocument.uri));
        return res.map(loc => Location.create(toVscodePath(loc.uri), loc.range));
    }

    docsDispatcher.onDidChangeContent(diagnose);

    connection.onDefinition(definitions);

    connection.onHover((params: TextDocumentPositionParams): Hover | null => {
        return cssService.doHover(fs.get(params.textDocument.uri), params.position);
    });
    connection.onReferences((params: ReferenceParams): Location[] => {
        const refs = provider.getRefs(params);
        if (refs.length) {
            return dedupeLocations(refs);
        } else {
            const cssRefs = cssService.findReferences(fs.get(params.textDocument.uri), params.position);
            return dedupeLocations(cssRefs);
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
                    color = cssService.findColor(doc);
                } else if (sym && sym._kind === 'import' && sym.type === 'named') {
                    const impMeta = processor.process(sym.import.from);
                    const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(services.styl.resolver, 'value(' + sym.name + ')', impMeta, impMeta.vars.find(v => v.name === sym.name)!.node) + '}');
                    color = cssService.findColor(doc);
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
                const color = cssService.findColor(doc);
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

        return colorComps.concat(cssService.findColors(document));
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
        return cssService.getColorPresentations(document, params.color, params.range);
    });

    connection.onRenameRequest((params): WorkspaceEdit => {
        const changes: { [uri: string]: TextEdit[] } = {};
        provider.getRefs({
            context: {includeDeclaration: true},
            position: params.position,
            textDocument: params.textDocument
        }).forEach((ref: Location) => {
            const nameChange = {range: ref.range, newText: params.newName};
            if (changes[ref.uri]) {
                changes[ref.uri].push(nameChange)
            } else {
                changes[ref.uri] = [nameChange]
            }
        });
        return {changes};
    });

    connection.onSignatureHelp((params): Thenable<SignatureHelp> => {

        const doc: string = fs.loadTextFileSync(params.textDocument.uri);

        let sig = provider.getSignatureHelp(doc, params.position, params.textDocument.uri, ParameterInformation);
        return Promise.resolve(sig!)
    });
}

