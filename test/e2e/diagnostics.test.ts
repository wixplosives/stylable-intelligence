import * as vscode from 'vscode';

import path from 'path';
import { expect } from 'chai'
import pkgDir from 'pkg-dir';

// const fileUriToNativePath = (uri: string) => isWindows ? uri.slice(8).replace('%3A', ':') : uri.slice(7);

function getPathToDiagnostics(casePath:string){
    let pathToFile = ''
    if (process.platform === 'win32') {
        pathToFile = casePath.split('\\').join('/')
        pathToFile = pathToFile.split(':').join('%3A')
        pathToFile = pathToFile.charAt(0).toLowerCase() + pathToFile.slice(1)
        pathToFile = 'file:///' + pathToFile
    } else {
        pathToFile = 'file://' + casePath
    }
    return pathToFile

}

function assertDiagnosticExist(client: any, casePath: string, result: Object) {
    let diagnostic = client._diagnostics._data.get(getPathToDiagnostics(casePath))
    expect(diagnostic).to.be.not.empty
    return expect(diagnostic[0]).to.contain.keys(result)
}

suite('test diagnostics', function () {

    let rootDir: string | null;
    suiteSetup(async () => {
        rootDir = await pkgDir(__dirname);
    });

    test('should support single file error', function () {
        const casePath = path.join(rootDir!, 'fixtures', 'e2e-cases', 'single-file-diag.st.css')
        const ext = vscode.extensions.getExtension('wix.stylable-intelligence')
        let extClient: any;

        if (ext) {
            return ext.activate()
                .then(function (client) {
                    extClient = client
                    return vscode.workspace.openTextDocument(casePath)
                })
                .then((doc) => vscode.window.showTextDocument(doc))
                .then(function (editor) {
                    return assertDiagnosticExist(extClient, casePath, {
                        range: {
                            _start: { _line: 1, _character: 1 },
                            _end: { _line: 1, _character: 13 }
                        },
                        message: ".root class cannot be used after spacing",
                        severity: 0
                    })
                })
        } else {
            throw new Error('Where is my extension?!!')
        }
    })
})
