'use strict';
import { setInterval } from 'timers';
import * as path from 'path';
///         *                                                                *        *                                        *          *                                                              *
import { IConnection, InitializeResult, TextDocuments, Definition, Hover, TextDocument, ServerCapabilities, SignatureHelp, NotificationType } from 'vscode-languageserver';
import { createProvider, MinimalDocs, } from './provider-factory';
import { ProviderPosition, ProviderRange } from './completion-providers';
import { Completion } from './completion-types';
import { createDiagnosis } from './diagnosis';
import * as VCL from 'vscode-css-languageservice';
import {Command, Position, Range, Location, TextEdit, CompletionItem, ParameterInformation } from 'vscode-languageserver-types';
import { ServerCapabilities as CPServerCapabilities, DocumentColorRequest, ColorPresentationRequest} from 'vscode-languageserver-protocol/lib/protocol.colorProvider.proposed';
import { valueMapping } from 'stylable/dist/src/stylable-value-parsers';
import { fileUriToNativePath, nativePathToFileUri } from './utils/uri-utils';
import { createMeta } from './provider';
import { Stylable } from 'stylable';
import * as ts from 'typescript'
import { FileSystemReadSync } from 'kissfs';
export {MinimalDocs} from './provider-factory';
import {NotificationTypes,LSPTypeHelpers, ExtendedFSReadSync} from './types'
import { createLanguageServiceHost, createBaseHost } from './utils/temp-language-service-host';
// namespace OpenDocNotification {
// }


export class StylableLanguageService {
    constructor(connection: IConnection, services: { styl: Stylable }, fs:ExtendedFSReadSync, notifications :NotificationTypes) {

        let openedFiles:string[] = [];
        const tsLanguageServiceHost = createLanguageServiceHost({
            cwd: '/',
            getOpenedDocs: () => openedFiles,
            compilerOptions: {
                target: ts.ScriptTarget.ES5, sourceMap: false, declaration: true, outDir: 'dist',
                lib:[],
                module: ts.ModuleKind.CommonJS,
                typeRoots: ["./node_modules/@types"]
            },
            defaultLibDirectory: '',
            baseHost: createBaseHost(fs, path)
        });
        const tsLanguageService = ts.createLanguageService(tsLanguageServiceHost);
        (tsLanguageService as any).setOpenedFiles = (files:string[]) => openedFiles = files;

        const provider = createProvider(services.styl, tsLanguageService);
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

        connection.listen();

        function getRequestedFiles(doc: string, origin: string): string[] {
            const originNativePath = fileUriToNativePath(origin)
            const originDir = path.dirname(originNativePath);

            return doc
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.startsWith(valueMapping.from))
                .map(l => path.join(originDir, l.slice(valueMapping.from.length + 1, l.indexOf(';')).replace(/"/g, '').replace(/'/g, "").trim()))
                .map(nativePathToFileUri);
        }

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

            // const requestedFiles = getRequestedFiles(doc, params.textDocument.uri);
            // requestedFiles.forEach(file => connection.sendNotification(notifications.openDoc, file));

            // return new Promise((resolve, reject) => {
            //     const startTime = new Date();

            //     const interval = setInterval(() => {
            //         if (requestedFiles.every(file => {
            //                 try{
            //                     return !!fs.get(file)
            //                 } catch(e) {
            //                     return false;
            //                 }
            //             })) {
            //             clearInterval(interval);
            //             resolve()
            //         } else if (Number(new Date()) - Number(startTime) > 300) {
            //             clearInterval(interval);
            //             resolve();
            //         }
            //     }, 100);
            // }).then(() => {

                return provider.provideCompletionItemsFromSrc(doc, { line: pos.line, character: pos.character }, params.textDocument.uri, fs)
                    .then((res) => {
                        return res.map((com: Completion) => {
                            let lspCompletion:CompletionItem = CompletionItem.create(com.label);
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
            // }).catch(e => { console.error(e); return cssComps })


        });

        function diagnose(document:TextDocument){
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
        connection.onDidOpenTextDocument(function(params){
            const document = fs.get(params.textDocument.uri);
            diagnose(document);
        });
        connection.onDidChangeTextDocument(function (change) {
            const document = fs.get(change.textDocument.uri);
            diagnose(document);
        });

        connection.onDefinition((params): Thenable<Definition> => {
            const doc = fs.loadTextFileSync(params.textDocument.uri);
            const pos = params.position;
            const requestedFiles = getRequestedFiles(doc, params.textDocument.uri);

            return provider.getDefinitionLocation(doc, { line: pos.line, character: pos.character }, params.textDocument.uri, fs)
                .then((res) => {
                    return res.map(loc => Location.create(nativePathToFileUri(loc.uri), loc.range))
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
            const stylesheet: VCL.Stylesheet = cssService.parseStylesheet(document);
            const colors = cssService.findDocumentColors(document, stylesheet)
            return colors;
        });

        connection.onRequest(notifications.colorPresentationRequest.type, params => {
            const document = fs.get(params.textDocument.uri);
            const stylesheet: VCL.Stylesheet = cssService.parseStylesheet(document);
            const colors = cssService.getColorPresentations(document, stylesheet, params.color, params.range)
            return colors;

        });

        connection.onSignatureHelp((params): Thenable<SignatureHelp> => {

            const doc: string = fs.loadTextFileSync(params.textDocument.uri);

            const requestedFiles = getRequestedFiles(doc, params.textDocument.uri);

            let sig = provider.getSignatureHelp(doc, params.position, params.textDocument.uri, fs, ParameterInformation);
            return Promise.resolve(sig!)
        })

        function readDocRange(doc: TextDocument, rng: Range): string {
            let lines = doc.getText().split('\n');
            return lines[rng.start.line].slice(rng.start.character, rng.end.character);
        }
    }


}


// namespace OpenDocNotification {
//     export const type = new NotificationType<string, void>('stylable/openDocumentNotification');
// }

// const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

