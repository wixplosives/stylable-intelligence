import vscode from 'vscode';
import assert from 'assert';
import path from 'path';
import pkgDir from 'pkg-dir';

suite('Extension Tests', () => {
    let rootDir: string | null;

    suiteSetup(async () => {
        rootDir = await pkgDir(__dirname);
    });

    async function testCompletion(fileToTest: string, testCases: Array<[vscode.Position, string[]]>) {
        const casesPath = path.join(rootDir!, 'fixtures', 'e2e-cases', fileToTest);
        const ext = vscode.extensions.getExtension('wix.stylable-intelligence');
        let testDoc: vscode.TextDocument;

        if (ext) {
            const doc = await vscode.workspace.openTextDocument(casesPath);
            testDoc = doc;
            await vscode.window.showTextDocument(testDoc);
            await ext.activate();

            return Promise.all(testCases.map(async ([position, expected]) => {
                const list = await vscode.commands.executeCommand<vscode.CompletionList>(
                    'vscode.executeCompletionItemProvider',
                    testDoc.uri,
                    position
                );
                const labels = list!.items.map(x => x.label);
                for (const entry of expected) {
                    if (!~labels.indexOf(entry)) {
                        assert.fail('', entry, 'missing expected item in completion list', '');
                    }
                }
            }));
        } else {
            throw new Error('Where is my extension?!!');
        }
    }

    test('simple completion', function() {
        this.timeout(30000);
        const testCases: Array<[vscode.Position, string[]]> = [
            [new vscode.Position(0, 0), [':import', '.root', ':vars', '.gaga', '@namespace']]
        ];
        return testCompletion('simple-completion.st.css', testCases);
    });

    test('simple completion includes css completions', function() {
        this.timeout(30000);
        const testCases: Array<[vscode.Position, string[]]> = [[new vscode.Position(2, 11), ['goldenrod']]];
        return testCompletion('simple-completion.st.css', testCases);
    });

    test('advanced completion', function() {
        this.timeout(30000);
        const testCases: Array<[vscode.Position, string[]]> = [[new vscode.Position(10, 6), [':shmover', ':bover']]];
        return testCompletion('advanced-completion.st.css', testCases);
    });

    // Fix it so it tests something real (no :import)
    test.skip('No completions on .css files', () => {
        const testCases: Array<[vscode.Position, string[]]> = [[new vscode.Position(0, 0), []]];
        return testCompletion('simple-completion.css', testCases);
    });
});
