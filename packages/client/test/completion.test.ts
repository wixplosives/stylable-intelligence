import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

function testCompletion(fileToTest: string, testCases: [vscode.Position, string[]][]) {
    const casesPath = path.join(__dirname, '..', '..', 'test', 'cases', fileToTest)
    const ext = vscode.extensions.getExtension('wix.stylable-intelligence')
    let testDoc:vscode.TextDocument

    if (ext) {
        return vscode.workspace.openTextDocument(casesPath)
            .then((doc) => {
                testDoc = doc;
                return vscode.window.showTextDocument(testDoc)
            })
            .then(() => ext.activate())
            .then(() => {
                return Promise.all(testCases.map(([position, expected]) => {
                    return vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', testDoc.uri, position)
                        .then(list => {
                            let labels = list!.items.map(x => x.label);
                            for (let entry of expected) {
                                if (!~labels.indexOf(entry)) {
                                    assert.fail('', entry, 'missing expected item in completion list', '');
                                }
                            }
                            return Promise.resolve()
                        })
                }))
            });
    } else {
        throw new Error('Where is my extension?!!')
    }
}


suite("Extension Tests", () => {

    test("simple completion", function () {
        this.timeout(5000)
        const testCases: [vscode.Position, string[]][] = [
            [new vscode.Position(0, 0), [':import', '.root', ':vars', '.gaga', '@namespace']]
        ];
        return testCompletion('simple-completion.stcss', testCases);
    });

    test("advanced completion", () => {
        const testCases: [vscode.Position, string[]][] = [
            [new vscode.Position(10, 6), [':shmover', ':bover']]
        ];
        return testCompletion('advanced-completion.stcss', testCases);
    });


    //Fix it so it tests something real (no :import)
    test.skip("No completions on .css files", function () {
        let starr: string[] = [];
        const testCases: [vscode.Position, string[]][] = [[new vscode.Position(0, 0), []]];
        return testCompletion('simple-completion.css', testCases);
    });

});

