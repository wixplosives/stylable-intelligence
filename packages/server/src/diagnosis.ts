import { StylableMeta } from 'stylable/dist/src/stylable-processor';
import { Diagnostic, Range,DiagnosticSeverity } from 'vscode-languageserver-types/lib/main';
import { TextDocument } from 'vscode-languageserver-types/lib/main';
// import {NodeSource} from 'postcss'
import * as path from 'path';
import {safeParse, Diagnostics, process, StylableTransformer, FileProcessor} from 'stylable';
import {Diagnostic as Report} from 'stylable/src/diagnostics'

export function createDiagnosis(doc:TextDocument, fp:FileProcessor<StylableMeta>):Diagnostic[] {
    let file = doc.uri.replace('file://','')
    if (!doc.uri.endsWith('.st.css')) {return []};
    let stylableDiagnostics = new Diagnostics()
    let transformer = new StylableTransformer({
        diagnostics: stylableDiagnostics,
        fileProcessor: fp,
        requireModule: () => ({"default":{}})
    })

    let docPostCSSRoot = safeParse(doc.getText(), { from:path.resolve(file) })
    let meta = process(docPostCSSRoot, stylableDiagnostics)

    fp.add(file, meta);
    transformer.transform(meta)
    return stylableDiagnostics.reports.map(reportToDiagnostic)
}

//stylable diagnostic to protocol diagnostic
function reportToDiagnostic(report:Report) {
    let severity = report.type === 'error' ? DiagnosticSeverity.Error: DiagnosticSeverity.Warning
    let range = createRange(report)
    return Diagnostic.create(range, report.message, severity )
}

function createRange(report:Report) {
    let source = report.node.source
    let start = {line: -1, character: -1}
    let end =  {line: -1, character: -1}
    if(report.options.word){
        let lines:string[] = (source.input as any).css.split('\n')
        for (var i=0; i < lines.length; ++i) {
            const wordIndex = lines[i].indexOf(report.options.word!)
            if (!!~wordIndex) {
                start.line = i
                start.character = wordIndex
                end.line = i
                end.character = wordIndex + report.options.word!.length
                break
            }
        }
    } else {
        start.line =  source.start!.line - 1
        start.character =source.start!.column - 1
        end.line = source.end!.line -1
        end.character = source.end!.column
    }
    return Range.create(start, end)
}
