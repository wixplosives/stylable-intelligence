import { StylableMeta } from 'stylable/dist/src/stylable-processor';
import { Diagnostic, Range,DiagnosticSeverity } from 'vscode-languageserver-types/lib/main';
import { TextDocument } from 'vscode-languageserver-types/lib/main';
import {NodeSource} from 'postcss'
import * as path from 'path';
import {safeParse, Diagnostics, process, StylableTransformer, FileProcessor} from 'stylable';
import {Diagnostic as Report} from 'stylable/src/diagnostics'

export function createDiagnosis(doc:TextDocument, fp:FileProcessor<StylableMeta>):Diagnostic[] {

    let stylableDiagnostics = new Diagnostics()
    let transformer = new StylableTransformer({
        diagnostics: stylableDiagnostics,
        fileProcessor: fp,
        requireModule: () => ({"default":{}})
    })

    let docPostCSSRoot = safeParse(doc.getText(), { from:path.resolve(doc.uri) })
    let meta = process(docPostCSSRoot, stylableDiagnostics)

    fp.add(doc.uri, meta);
    transformer.transform(meta)
    return stylableDiagnostics.reports.map(reportToDiagnostic)
}

//stylable diagnostic to vscode diagnostic
function reportToDiagnostic(report:Report) {
    let severity = report.type === 'error' ? DiagnosticSeverity.Error: DiagnosticSeverity.Warning
    let range = createRange(report.node.source)
    return Diagnostic.create(range, report.message, severity )
}

function createRange(source:NodeSource) {
    return Range.create({
        line: source.start!.line,
        character: source.start!.column
    }, {
        line: source.end!.line,
        character: source.end!.column
    })
}
