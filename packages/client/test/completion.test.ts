import * as assert from 'assert';
import * as Bluebird from 'bluebird';
import * as path from 'path';
import * as vscode from 'vscode';

function testCompletion(fileToTest: string, testCases: [vscode.Position, string[]][], extraFiles: string[] =[]) {
    let casesPath = path.join(__dirname, '..', '..', 'test', 'cases', fileToTest)

    let testDoc:vscode.TextDocument;

    return vscode.workspace.openTextDocument(casesPath)
        .then((textDocument) => {
            testDoc = textDocument;
            return Promise.all(extraFiles.map(file => {
                return vscode.workspace.openTextDocument
            }))
        }).then(()=> {
            return vscode.window.showTextDocument(testDoc)
        }).then(() => {
            const ext = vscode.extensions.getExtension('Wix.stylable-intelligence')
            return Bluebird.delay(500, ext!.activate)
        }).then(() => {
            let promises = testCases.map(([position, expected]) => {
                return vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', testDoc.uri, position)
                    .then(list => {
                        let labels = list!.items.map(x => x.label);
                        for (let entry of expected) {
                            if (!~labels.indexOf(entry)) {
                                assert.fail('', entry, 'missing expected item in competion list', '');
                            }
                        }
                    })
            });
            return Promise.all(promises);
        });
}


suite("Extension Tests", () => {

    test("simple completion", () => {
        const testCases: [vscode.Position, string[]][] = [
            [new vscode.Position(0, 0), [':import', '.root']]
        ];
        return testCompletion('simple-completion.css', testCases);

    });
    test.skip("advanced completion", () => {
        const testCases: [vscode.Position, string[]][] = [
            [new vscode.Position(10, 6), ['shmover', 'bover']]
        ];
        return testCompletion('advanced-completion.css', testCases, ['advanced-dependency.css']);
    });
});

