import { Diagnostic, Range,DiagnosticSeverity } from 'vscode-languageserver-types/lib/main';
import { TextDocument } from 'vscode-languageserver-types/lib/main';
import {NodeSource} from 'postcss'
import * as path from 'path';
import {safeParse, Diagnostics, process} from 'stylable';
import {Diagnostic as Report} from 'stylable/src/diagnostics'

export function createDiagnosis(doc:TextDocument):Diagnostic[] {
    let docPostCSSRoot = safeParse(doc.getText(), { from:path.resolve(doc.uri) })
    let stylableDiagnostics = new Diagnostics()
    process(docPostCSSRoot, stylableDiagnostics)
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
