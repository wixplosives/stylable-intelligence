import path from 'path';
import { CompletionParams } from 'vscode-languageclient';
import {
    Definition,
    Hover,
    ReferenceParams,
    SignatureHelp,
    TextDocumentPositionParams,
    WorkspaceEdit,
    DocumentColorParams,
    ColorPresentationParams
} from 'vscode-languageserver-protocol';
import { IConnection } from 'vscode-languageserver';
import {
    Command,
    CompletionItem,
    Location,
    ParameterInformation,
    TextEdit,
    Diagnostic
} from 'vscode-languageserver-types';
import { Stylable } from '@stylable/core';

import { createProvider, MinimalDocsDispatcher } from './provider-factory';
import { ProviderPosition, ProviderRange } from './completion-providers';
import { Completion } from './completion-types';
import { createDiagnosis } from './diagnosis';
import { fromVscodePath, toVscodePath } from './utils/uri-utils';
import { getRefs, getRenameRefs } from './provider';
import { ExtendedFSReadSync, ExtendedTsLanguageService, NotificationTypes } from './types';
import { CssService } from '../model/css-service';
import { resolveDocumentColors, getColorPresentation } from './feature/color-provider';
export { MinimalDocs } from './provider-factory';
export { ExtendedTsLanguageService, ExtendedFSReadSync, NotificationTypes } from './types';

export class StylableLanguageService {
    constructor(
        connection: IConnection,
        services: { styl: Stylable; tsLanguageService: ExtendedTsLanguageService; requireModule: typeof require },
        fs: ExtendedFSReadSync,
        docsDispatcher: MinimalDocsDispatcher,
        notifications: NotificationTypes
    ) {
        console.warn(
            'StylableLanguageService class is deprecated and will be deleted soon. ' +
            'use initStylableLanguageService function instead'
        );
        initStylableLanguageService(connection, services, fs, docsDispatcher, notifications);
    }
}

export function initStylableLanguageService(
    connection: IConnection,
    services: { styl: Stylable; tsLanguageService: ExtendedTsLanguageService; requireModule: typeof require },
    fs: ExtendedFSReadSync,
    docsDispatcher: MinimalDocsDispatcher,
    _notifications: NotificationTypes
) {
    const provider = createProvider(services.styl, services.tsLanguageService);
    const processor = services.styl.fileProcessor;
    const newCssService = new CssService(fs);

    connection.onCompletion(
        (params: CompletionParams): CompletionItem[] => {
            const documentUri = params.textDocument.uri;
            const position = params.position;

            if (!documentUri.endsWith('.st.css') && !documentUri.startsWith('untitled:')) {
                return [];
            }

            const document = fs.get(documentUri);

            const res = provider.provideCompletionItemsFromSrc(
                document.getText(),
                {
                    line: position.line,
                    character: position.character
                },
                documentUri,
                fs
            );

            return res
                .map((com: Completion) => {
                    const lspCompletion: CompletionItem = CompletionItem.create(com.label);
                    const ted: TextEdit = TextEdit.replace(
                        com.range
                            ? com.range
                            : new ProviderRange(
                                  new ProviderPosition(position.line, Math.max(position.character - 1, 0)),
                                  position
                              ),
                        typeof com.insertText === 'string' ? com.insertText : com.insertText.source
                    );
                    lspCompletion.insertTextFormat = 2;
                    lspCompletion.detail = com.detail;
                    lspCompletion.textEdit = ted;
                    lspCompletion.sortText = com.sortText;
                    lspCompletion.filterText =
                        typeof com.insertText === 'string' ? com.insertText : com.insertText.source;
                    if (com.additionalCompletions) {
                        lspCompletion.command = Command.create('additional', 'editor.action.triggerSuggest');
                    } else if (com.triggerSignature) {
                        lspCompletion.command = Command.create('additional', 'editor.action.triggerParameterHints');
                    }
                    return lspCompletion;
                })
                .concat(newCssService.getCompletions(document, position));
        }
    );

    async function diagnose() {
        let res: any;
        let ignore = false;
        try {
            res = await connection.workspace.getConfiguration({
                section: 'stylable'
            });
            if (!!res && !!res.diagnostics && !!res.diagnostics.ignore && !!res.diagnostics.ignore.length) {
                ignore = true;
            }
        } catch (e) {
            /*Client has no workspace/configuration method, ignore silently */
        }

        docsDispatcher.keys!().forEach(key => {
            const doc = docsDispatcher.get!(key);
            if (!!doc) {
                if (doc.languageId === 'stylable') {
                    let diagnostics: Diagnostic[];
                    if (
                        ignore &&
                        (res.diagnostics.ignore as string[]).some(p => {
                            return fromVscodePath(doc.uri).startsWith(path.resolve(p));
                        })
                    ) {
                        diagnostics = [];
                    } else {
                        diagnostics = createDiagnosis(doc, fs, processor, services.requireModule)
                            .map(diag => {
                                diag.source = 'stylable';
                                return diag;
                            })
                            .concat(newCssService.getDiagnostics(doc));
                    }
                    connection.sendDiagnostics({ uri: doc.uri, diagnostics });
                }
            }
        });
    }

    // docsDispatcher.onDidOpen(diagnose);
    docsDispatcher.onDidChangeContent(diagnose);

    connection.onDidChangeConfiguration(diagnose);

    connection.onDefinition(
        (params): Thenable<Definition> => {
            const doc = fs.loadTextFileSync(params.textDocument.uri);
            const pos = params.position;

            return provider
                .getDefinitionLocation(
                    doc,
                    {
                        line: pos.line,
                        character: pos.character
                    },
                    fromVscodePath(params.textDocument.uri),
                    fs
                )
                .then(res => {
                    return res.map(loc => Location.create(toVscodePath(loc.uri), loc.range));
                });
        }
    );

    connection.onHover(
        (params: TextDocumentPositionParams): Hover | null => {
            return newCssService.doHover(fs.get(params.textDocument.uri), params.position);
        }
    );

    connection.onReferences(
        (params: ReferenceParams): Location[] => {
            const refs = getRefs(params, fs, services.styl);
            if (refs.length) {
                return dedupeRefs(refs);
            } else {
                return dedupeRefs(newCssService.findReferences(fs.get(params.textDocument.uri), params.position));
            }
        }
    );

    connection.onDocumentFormatting(params => {
        return null;
    });

    connection.onDocumentColor((params: DocumentColorParams) => {
        const document = fs.get(params.textDocument.uri);
        return resolveDocumentColors(services.styl, newCssService, document);
    });

    connection.onColorPresentation((params: ColorPresentationParams) => {
        const document = fs.get(params.textDocument.uri);

        return getColorPresentation(newCssService, document, params);
    });

    connection.onRenameRequest(
        (params): WorkspaceEdit => {
            const edit: WorkspaceEdit = { changes: {} };
            getRenameRefs(
                {
                    context: { includeDeclaration: true },
                    position: params.position,
                    textDocument: params.textDocument
                },
                fs,
                services.styl
            ).forEach(ref => {
                if (edit.changes![ref.uri]) {
                    edit.changes![ref.uri].push({ range: ref.range, newText: params.newName });
                } else {
                    edit.changes![ref.uri] = [{ range: ref.range, newText: params.newName }];
                }
            });

            return edit;
        }
    );

    connection.onSignatureHelp(
        (params): Thenable<SignatureHelp> => {
            const doc: string = fs.loadTextFileSync(params.textDocument.uri);

            const sig = provider.getSignatureHelp(
                doc,
                params.position,
                params.textDocument.uri,
                fs,
                ParameterInformation
            );
            return Promise.resolve(sig!);
        }
    );

    function dedupeRefs(refs: Location[]): Location[] {
        const res: Location[] = [];
        refs.forEach(ref => {
            if (
                !res.find(
                    r =>
                        r.range.start.line === ref.range.start.line &&
                        r.range.start.character === ref.range.start.character &&
                        r.uri === ref.uri
                )
            ) {
                res.push(ref);
            }
        });
        return res;
    }
}
