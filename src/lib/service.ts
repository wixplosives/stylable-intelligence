import {
    ColorInformation,
    Definition,
    Hover,
    ReferenceParams,
    SignatureHelp,
    TextDocument,
    TextDocumentPositionParams,
    WorkspaceEdit,
    DocumentColorParams,
    ColorPresentationParams,
    InitializeParams
} from 'vscode-languageserver-protocol';
import {createProvider, MinimalDocs, MinimalDocsDispatcher,} from './provider-factory';
import {ProviderPosition, ProviderRange} from './completion-providers';
import {Completion} from './completion-types';
import {createDiagnosis} from './diagnosis';
import {Color} from 'vscode-css-languageservice';
import {Command, CompletionItem, Location, ParameterInformation, TextEdit} from 'vscode-languageserver-types';
import {evalDeclarationValue, Stylable, valueMapping, FileProcessor, StylableMeta} from 'stylable';
import {fromVscodePath, toVscodePath} from './utils/uri-utils';
import Provider, { fixAndProcess } from './provider';
import {ExtendedFSReadSync, ExtendedTsLanguageService, NotificationTypes} from './types'
import {last} from 'lodash';
import {IConnection} from "vscode-languageserver";
import {initializeResult} from "../view";
import {CompletionParams} from 'vscode-languageclient/lib/main';
import {CssService} from "../model/css-service";
import { resolveDocumentColors, getColorPresentation } from './feature/color-provider';

export type CreateStylable = (path: string) => Stylable;

export {MinimalDocs} from './provider-factory';

//exporting types for use in playground
export {ExtendedTsLanguageService, ExtendedFSReadSync, NotificationTypes} from './types'

export class StylableLanguageService {
    constructor(connection: IConnection, services: { styl: Stylable | CreateStylable, tsLanguageService: ExtendedTsLanguageService, requireModule: typeof require }, fs: ExtendedFSReadSync, docsDispatcher: MinimalDocsDispatcher, notifications: NotificationTypes) {
        console.warn('StylableLanguageService class is deprecated and will be deleted soon. use initStylableLanguageService function instead');
        initStylableLanguageService(connection, services, fs, docsDispatcher, notifications);
    }
}

export function initStylableLanguageService(connection: IConnection, services: { styl: Stylable | CreateStylable, tsLanguageService: ExtendedTsLanguageService, requireModule: typeof require }, fs: ExtendedFSReadSync, docsDispatcher: MinimalDocsDispatcher, notifications: NotificationTypes) {
    let provider: Provider, processor: FileProcessor<StylableMeta>;

    if (typeof services.styl !== 'function') {
        provider = createProvider(services.styl, services.tsLanguageService);
        processor = services.styl.fileProcessor;
    }
    const newCssService = new CssService(fs);


    connection.onInitialize((params: InitializeParams) => {
        const basePath = params.rootPath || '/';

        if (typeof services.styl === 'function') {
            services.styl = services.styl(basePath);
            provider = createProvider(services.styl, services.tsLanguageService);
            processor = services.styl.fileProcessor;
        }

        return initializeResult
    });

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

    connection.onDocumentColor((params: DocumentColorParams) => {
        const document = fs.get(params.textDocument.uri);

        return resolveDocumentColors((services.styl as Stylable), newCssService, document);

    });

    connection.onColorPresentation((params: ColorPresentationParams) => {
        const document = fs.get(params.textDocument.uri);

        return getColorPresentation(newCssService, document, params);
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

