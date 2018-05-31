import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { expect } from 'chai'
import { Position } from 'vscode-languageserver-types';
const pkgDir = require('pkg-dir');


suite.only("Extension Tests", () => {
    let rootDir: string;
    suiteSetup(async () => {
        rootDir = await pkgDir(__dirname);
    });

    function testDefinition(file: string, position: Position) {
        const casesPath = path.join(rootDir, 'fixtures', 'e2e-cases', file);
        const ext = vscode.extensions.getExtension('wix.stylable-intelligence');
        let testDoc: vscode.TextDocument

        if (ext) {
            return vscode.workspace.openTextDocument(casesPath)
                .then((doc) => {
                    testDoc = doc;
                    return vscode.window.showTextDocument(testDoc)
                })
                .then(() => ext.activate())
                .then(() => {
                    // return Promise.all(position.map(([position, expected]) => {
                    return vscode.commands.executeCommand<vscode.Location[]>('vscode.executeDefinitionProvider', testDoc.uri, position)
                        .then(list => {
                            if (!list) {
                                throw new Error("Where is my list?")
                            }

                            expect(list.length).to.eql(1);
                            expect(list[0].uri.fsPath).to.eql(testDoc.uri.fsPath)
                        })
                    // }))
                });
        } else {
            throw new Error('Where is my extension?!!')
        }
    }


    test("simple completion", function () {
        // const testCases: [vscode.Position, string[]][] = [
        //     [new vscode.Position(5, 20), ]
        // ];
        return testDefinition('simple-definition.st.css', new vscode.Position(5, 20));
    });


});

