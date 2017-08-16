import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

function testCompletion(fileToTest: string, testCases: [vscode.Position, string[]][]) {
    const casesPath = path.join(__dirname, '..', '..', 'test', 'cases', fileToTest)
    const ext = vscode.extensions.getExtension('Wix.stylable-intelligence')
    let testDoc:vscode.TextDocument

    return vscode.workspace.openTextDocument(casesPath)
        .then((doc)=> {
           testDoc = doc;
           return vscode.window.showTextDocument(testDoc)
        })
        .then(() =>  ext!.activate())
        .then(() => {
            return Promise.all(testCases.map(([position, expected]) => {
                return vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', testDoc.uri, position)
                    .then(list => {
                        let labels = list!.items.map(x => x.label);
                        for (let entry of expected) {
                            if (!~labels.indexOf(entry)) {
                                assert.fail('', entry, 'missing expected item in competion list', '');
                            }
                        }
                        return Promise.resolve()
                    })
            }))
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
        return testCompletion('advanced-completion.css', testCases);
    });
});

