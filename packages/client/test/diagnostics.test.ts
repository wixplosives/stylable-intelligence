import * as vscode from 'vscode';
import * as path from 'path';

suite('test diagnostics', function() {
    test.only('should support single file error', function (){
        const casesPath = path.join(__dirname, '..', '..', 'test', 'cases', 'single-file-diag.css')
        const ext = vscode.extensions.getExtension('Wix.stylable-intelligence')
        let testDoc:vscode.TextDocument

        return ext!.activate()
                .then(function() {
                    return vscode.workspace.openTextDocument(casesPath)
                })
                .then(function(doc) {
                    testDoc = doc;
                    return vscode.window.showTextDocument(doc)
                })
                .then(function(editor){
                    let diagnostics = vscode.languages.createDiagnosticCollection()
                })
    })
})
