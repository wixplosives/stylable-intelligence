import path from 'path';
import {
    StylableTransformer,
    Diagnostics,
    safeParse,
    process,
    Diagnostic as StylableDiagnostic,
    FileProcessor,
    StylableMeta
} from '@stylable/core';
import { FileSystemReadSync } from 'kissfs';
import { Diagnostic, Range, TextDocument } from 'vscode-languageserver-types';
import { fromVscodePath } from './utils/uri-utils';

export function createDiagnosis(
    doc: TextDocument,
    fs: FileSystemReadSync,
    fileProcessor: FileProcessor<StylableMeta>,
    requireModule: typeof require
): Diagnostic[] {
    if (!doc.uri.endsWith('.st.css')) {
        return [];
    }
    const file = fromVscodePath(doc.uri);

    const transformer = new StylableTransformer({
        diagnostics: new Diagnostics(),
        fileProcessor,
        requireModule
    });

    const docPostCSSRoot = safeParse(doc.getText(), { from: path.resolve(file) });
    const meta = process(docPostCSSRoot);

    fileProcessor.add(file, meta);

    try {
        transformer.transform(meta);
    } catch { /**/ }
    return meta.diagnostics.reports
        .concat(meta.transformDiagnostics ? meta.transformDiagnostics.reports : [])
        .map(reportToDiagnostic);

    // stylable diagnostic to protocol diagnostic
    function reportToDiagnostic(report: StylableDiagnostic) {
        const severity = report.type === 'error' ? 1 : 2;
        const range = createRange(report);
        return Diagnostic.create(range, report.message, severity);
    }
}

function createRange(report: StylableDiagnostic) {
    const source = report.node.source;
    const start = { line: 0, character: 0 };
    const end = { line: 0, character: 0 };
    if (report.options.word && source) {
        const lines: string[] = (source.input as any).css.split('\n');
        const searchStart = source.start!.line - 1;
        const searchEnd = source.end!.line - 1;
        for (let i = searchStart; i <= searchEnd; ++i) {
            const wordIndex = lines[i].indexOf(report.options.word!);
            if (!!~wordIndex) {
                start.line = i;
                start.character = wordIndex;
                end.line = i;
                end.character = wordIndex + report.options.word!.length;
                break;
            }
        }
    } else if (source) {
        start.line = source.start!.line - 1;
        start.character = source.start!.column - 1;
        end.line = source.end!.line - 1;
        end.character = source.end!.column;
    }
    return Range.create(start, end);
}
