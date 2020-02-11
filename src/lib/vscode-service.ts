import { IFileSystem } from '@file-services/types';
import { Stylable } from '@stylable/core';
import { StylableLanguageService } from '@stylable/language-service';
import {
    ColorInformation,
    ColorPresentation,
    ColorPresentationParams,
    CompletionParams,
    CompletionItem,
    Definition,
    Diagnostic,
    DocumentColorParams,
    Hover,
    IConnection,
    Location,
    TextDocumentChangeEvent,
    TextDocumentPositionParams,
    TextDocuments,
    ReferenceParams,
    RenameParams,
    SignatureHelp,
    WorkspaceEdit,
    TextDocument
} from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export class VscodeStylableLanguageService {
    public textDocuments: TextDocuments<TextDocument>;
    public languageService: StylableLanguageService;
    private connection: IConnection;

    constructor(connection: IConnection, docs: TextDocuments<TextDocument>, fs: IFileSystem, stylable: Stylable) {
        this.languageService = new StylableLanguageService({
            fs,
            stylable
        });
        this.textDocuments = docs;
        this.connection = connection;
    }

    public onCompletion(params: CompletionParams): CompletionItem[] {
        const { fsPath, doc } = this.getDocAndPath(params.textDocument.uri);
        return doc ? this.languageService.onCompletion(fsPath, doc.offsetAt(params.position)) : [];
    }

    public onDefinition(params: TextDocumentPositionParams): Definition {
        const { fsPath, doc } = this.getDocAndPath(params.textDocument.uri);
        return doc ? this.languageService.onDefinition(fsPath, doc.offsetAt(params.position)) : [];
    }

    public onHover(params: TextDocumentPositionParams): Hover | null {
        const { fsPath, doc } = this.getDocAndPath(params.textDocument.uri);
        return doc ? this.languageService.onHover(fsPath, doc.offsetAt(params.position)) : null;
    }

    public onReferences(params: ReferenceParams): Location[] {
        const { fsPath, doc } = this.getDocAndPath(params.textDocument.uri);
        return doc ? this.languageService.onReferences(fsPath, doc.offsetAt(params.position)) : [];
    }

    public onRenameRequest(params: RenameParams): WorkspaceEdit {
        const { fsPath, doc } = this.getDocAndPath(params.textDocument.uri);
        return doc ? this.languageService.onRenameRequest(fsPath, doc.offsetAt(params.position), params.newName) : {};
    }

    public onSignatureHelp(params: TextDocumentPositionParams): SignatureHelp | null {
        const { fsPath, doc } = this.getDocAndPath(params.textDocument.uri);
        return doc ? this.languageService.onSignatureHelp(fsPath, doc.offsetAt(params.position)) : null;
    }

    public onDocumentColor(params: DocumentColorParams): ColorInformation[] {
        const { fsPath } = URI.parse(params.textDocument.uri);
        return this.languageService.onDocumentColor(fsPath);
    }

    public onColorPresentation(params: ColorPresentationParams): ColorPresentation[] {
        const { fsPath, doc } = this.getDocAndPath(params.textDocument.uri);

        return doc
            ? this.languageService.onColorPresentation(
                  fsPath,
                  { start: doc.offsetAt(params.range.start), end: doc.offsetAt(params.range.end) },
                  params.color
              )
            : [];
    }

    public async diagnoseWithVsCodeConfig() {
        let res: any;
        let ignore = false;
        try {
            res = await this.connection.workspace.getConfiguration({
                section: 'stylable'
            });
            if (!!res && !!res.diagnostics && !!res.diagnostics.ignore && !!res.diagnostics.ignore.length) {
                ignore = true;
            }
        } catch (e) {
            /*Client has no workspace/configuration method, ignore silently */
        }

        const result: Diagnostic[] = [];
        this.textDocuments.keys().forEach(key => {
            const doc = this.textDocuments.get(key);
            if (doc) {
                if (doc.languageId === 'stylable') {
                    const fsPath = URI.parse(doc.uri).fsPath;
                    let diagnostics: Diagnostic[];
                    if (
                        ignore &&
                        (res.diagnostics.ignore as string[]).some(p => {
                            return fsPath.startsWith(p);
                        })
                    ) {
                        diagnostics = [];
                    } else {
                        diagnostics = this.languageService.diagnose(fsPath);
                        result.push(...diagnostics);
                    }
                    this.connection.sendDiagnostics({ uri: doc.uri, diagnostics });
                }
            }
        });

        return result;
    }

    public onDidClose(event: TextDocumentChangeEvent<TextDocument>) {
        return this.connection.sendDiagnostics({
            diagnostics: [],
            uri: event.document.uri
        });
    }

    private getDocAndPath(uri: string) {
        const { fsPath } = URI.parse(uri);
        const doc = this.textDocuments.get(uri);

        return { fsPath, doc };
    }
}
