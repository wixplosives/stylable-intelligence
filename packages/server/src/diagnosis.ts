import { Diagnostic } from 'vscode-languageserver-types/lib/main';
import { TextDocument } from 'vscode-languageserver-types/lib/main';

import * as stylable from 'stylable';

export function createDiagnosis(doc:TextDocument):Diagnostic[] {
    let docPostCSSRoot = stylable.safeParse(doc.getText(), {from:doc.uri})
    let stylableDiagnostics = new stylable.Diagnostics()
    stylable.process(docPostCSSRoot, stylableDiagnostics)
    console.log(JSON.stringify(stylableDiagnostics))
    return []
}
