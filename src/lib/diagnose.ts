import { Stylable } from '@stylable/core';
import { CssService, createDiagnosis } from '@stylable/language-service';
import { IConnection, TextDocuments, Diagnostic, TextDocument } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

interface DiagConfig {
    connection: IConnection;
    docsDispatcher: TextDocuments<TextDocument>;
    stylable: Stylable;
    cssService: CssService;
}

export async function diagnose({ connection, docsDispatcher, stylable, cssService }: DiagConfig) {
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

    const result: Diagnostic[] = [];
    docsDispatcher.keys().forEach(key => {
        const doc = docsDispatcher.get(key);
        if (doc) {
            if (doc.languageId === 'stylable') {
                let diagnostics: Diagnostic[];
                if (
                    ignore &&
                    (res.diagnostics.ignore as string[]).some(p => {
                        return URI.parse(doc.uri).fsPath.startsWith(p);
                    })
                ) {
                    diagnostics = [];
                } else {
                    diagnostics = createDiagnosis(doc.getText(), URI.parse(doc.uri).fsPath, stylable)
                        .map(diag => {
                            diag.source = 'stylable';
                            return diag;
                        })
                        .concat(cssService.getDiagnostics(doc));
                    result.push(...diagnostics);
                }
                connection.sendDiagnostics({ uri: doc.uri, diagnostics });
            }
        }
    });

    return result;
}
