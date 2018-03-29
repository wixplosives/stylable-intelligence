import {StylableMeta} from 'stylable/dist/src/stylable-processor';
import {Diagnostic, Range, TextDocument} from 'vscode-languageserver-types';
import * as path from 'path';
import {Diagnostics, FileProcessor, process as stylableProcess, safeParse, StylableTransformer} from 'stylable';
import {Diagnostic as Report} from 'stylable/src/diagnostics'
import {FileSystemReadSync} from 'kissfs';
import {fromVscodePath} from './utils/uri-utils';

export function createDiagnosis(doc: TextDocument, fileProcessor: FileProcessor<StylableMeta>, requireModule:typeof require): Diagnostic[] {
    const file = fromVscodePath(doc.uri);

    const transformer = new StylableTransformer({
        diagnostics: new Diagnostics(),
        fileProcessor: fileProcessor,
        requireModule
    });

    let docPostCSSRoot = safeParse(doc.getText(), {from: path.resolve(file)});
    let meta = stylableProcess(docPostCSSRoot)

    fileProcessor.add(file, meta);

    try {
        transformer.transform(meta)
    } catch (e) {
    }
    return meta.diagnostics.reports.concat(meta.transformDiagnostics ? meta.transformDiagnostics.reports : []).map(reportToDiagnostic);

    //stylable diagnostic to protocol diagnostic
    function reportToDiagnostic(report: Report) {
        let severity = report.type === 'error' ? 1 : 2;
        let range = createRange(report);
        return Diagnostic.create(range, report.message, severity as any);
    }

}


function createRange(report: Report) {
    let source = report.node.source
    let start = {line: 0, character: 0}
    let end = {line: 0, character: 0}
    if (report.options.word && source) {
        let lines: string[] = (source.input as any).css.split('\n')
        const searchStart = source.start!.line - 1
        const searchEnd = source.end!.line - 1
        for (var i = searchStart; i <= searchEnd; ++i) {
            const wordIndex = lines[i].indexOf(report.options.word!)
            if (!!~wordIndex) {
                start.line = i
                start.character = wordIndex
                end.line = i
                end.character = wordIndex + report.options.word!.length
                break
            }
        }
    } else if (source) {
        start.line = source.start!.line - 1
        start.character = source.start!.column - 1
        end.line = source.end!.line - 1
        end.character = source.end!.column
    }
    return Range.create(start, end)
}
