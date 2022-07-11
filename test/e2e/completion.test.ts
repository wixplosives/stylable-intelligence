import fs from '@file-services/node';
import vscode from 'vscode';
import assert from 'assert';
import path from 'path';

async function getCompletions(testDoc: vscode.TextDocument, position: vscode.Position) {
    return await vscode.commands.executeCommand<vscode.CompletionList>(
        'vscode.executeCompletionItemProvider',
        testDoc.uri,
        position
    );
}

suite('Extension Tests', function () {
    this.timeout(60000);

    let rootDir: string | null;

    suiteSetup(() => {
        rootDir = fs.dirname(fs.findClosestFileSync(__dirname, 'package.json')!);
    });

    async function getWorkingDocument(fileToTest: string) {
        const casesPath = path.join(rootDir!, 'fixtures', 'e2e-cases', fileToTest);
        const ext = vscode.extensions.getExtension('wix.stylable-intelligence');

        if (ext) {
            const doc = await vscode.workspace.openTextDocument(casesPath);
            await ext.activate();
            return doc;
        } else {
            throw new Error('Where is my extension?!!');
        }
    }

    async function testCompletion(fileToTest: string, testCases: Array<[vscode.Position, string[]]>) {
        const testDoc = await getWorkingDocument(fileToTest);
        await vscode.window.showTextDocument(testDoc);

        return Promise.all(
            testCases.map(async ([position, expected]) => {
                const completions = await getCompletions(testDoc, position);
                const labels = completions.items.map((x) => x.label);

                for (const entry of expected) {
                    if (!~labels.indexOf(entry)) {
                        assert.fail('missing expected item in completion list');
                    }
                }
            })
        );
    }

    test('simple completion', () => {
        const testCases: Array<[vscode.Position, string[]]> = [
            [new vscode.Position(0, 0), [':import', '.root', ':vars', '.gaga', '@namespace']],
        ];
        return testCompletion('simple-completion.st.css', testCases);
    });

    test('simple completion includes css completions', () => {
        const testCases: Array<[vscode.Position, string[]]> = [[new vscode.Position(2, 11), ['goldenrod']]];
        return testCompletion('simple-completion.st.css', testCases);
    });

    test('advanced completion', () => {
        const testCases: Array<[vscode.Position, string[]]> = [[new vscode.Position(10, 6), [':shmover', ':bover']]];
        return testCompletion('advanced-completion.st.css', testCases);
    });

    test('should order Stylable completions above CSS ones', async () => {
        const doc = await getWorkingDocument('empty.st.css');
        const completions = await getCompletions(doc, new vscode.Position(0, 0));

        // Stylable completion
        const stImportCompIndex = completions.items.findIndex((comp) => comp.label === '@st-import');
        // CSS completion
        const mediaCompIndex = completions.items.findIndex((comp) => comp.label === '@media');

        if (stImportCompIndex === -1 || mediaCompIndex === -1 || stImportCompIndex > mediaCompIndex) {
            assert.fail('completion sorting is wrong, Stylable should have priority');
        }
    });

    // Fix it so it tests something real (no :import)
    test.skip('No completions on .css files', () => {
        const testCases: Array<[vscode.Position, string[]]> = [[new vscode.Position(0, 0), []]];
        return testCompletion('simple-completion.css', testCases);
    });
});
