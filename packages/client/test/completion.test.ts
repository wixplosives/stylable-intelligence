import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';


function testCompletion(fileName: string, testCases: [vscode.Position, string[]][]) {
    console.log(path.join(__dirname, '..', '..', 'test', fileName));
    // vscode.languages.registerCompletionItemProvider('css',{})
    let testDoc:vscode.TextDocument;

    return vscode.workspace.openTextDocument(path.join(__dirname, '..', '..', 'test', fileName))
        .then((textDocument) => {
            testDoc = textDocument;
            return vscode.window.showTextDocument(textDocument) })
        .then(editor => {
            let promises = testCases.map(([position, expected]) => {
                return vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', testDoc.uri, position)
                    .then(list => {
                        let labels = list!.items.map(x => x.label);
                        for (let entry of expected) {
                            if (labels.indexOf(entry) < 0) {
                                assert.fail('', entry, 'missing expected item in competion list', '');
                            }
                        }
                    })
            });
            return Promise.all(promises);
        });
}


suite("Extension Tests", () => {

    test.skip("simple completion", () => {
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

