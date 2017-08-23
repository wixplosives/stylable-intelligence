import * as vscode from 'vscode';
import * as path from 'path';
import {expect} from 'chai'
suite('test diagnostics', function() {
    test('should support single file error', function (){
        const casesPath = path.join(__dirname, '..', '..', 'test', 'cases', 'single-file-diag.css')
        const ext = vscode.extensions.getExtension('Wix.stylable-intelligence')
        let extClient:any;
        let testDoc:vscode.TextDocument

        return ext!.activate()
                .then(function(client) {
                    extClient = client
                    return vscode.workspace.openTextDocument(casesPath)
                })
                .then(function(doc) {
                    testDoc = doc;
                    return vscode.window.showTextDocument(doc)
                })
                .then(function(editor){
                    let diagnostic = extClient._diagnostics._data.get('file://' + casesPath)
                        expect(diagnostic[0]).to.include.keys({
                        range:{
                            _start:{_line:1, _character:1},
                            _end: {_line:1, _character:13}
                        },
                        message:".root class cannot be used after spacing",
                    })

                })
    })
})
