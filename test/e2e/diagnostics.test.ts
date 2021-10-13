import fs from '@file-services/node';
import vscode, { Diagnostic, Range, TextDocument } from 'vscode';
import path from 'path';
import { expect } from 'chai';
import { LanguageClient } from 'vscode-languageclient/node';

function assertDiagnosticExist(client: LanguageClient, doc: TextDocument, result: Diagnostic) {
    const diagnostics = client.diagnostics!.get(doc.uri);

    expect(diagnostics).to.have.length.greaterThan(0);
    return expect(diagnostics![0]).to.contain.keys(result);
}

suite('test diagnostics', function () {
    this.timeout(60000);

    let rootDir: string;
    suiteSetup(() => {
        rootDir = fs.dirname(fs.findClosestFileSync(__dirname, 'package.json')!);
    });

    test('should support single file error', async () => {
        const casePath = path.join(rootDir, 'fixtures', 'e2e-cases', 'single-file-diag.st.css');
        const ext = vscode.extensions.getExtension<LanguageClient>('wix.stylable-intelligence');

        if (ext) {
            const client = await ext.activate();
            const doc = await vscode.workspace.openTextDocument(casePath);
            await vscode.window.showTextDocument(doc);
            return assertDiagnosticExist(client, doc, {
                range: new Range(1, 1, 1, 13),
                message: '.root class cannot be used after spacing',
                severity: 0,
            });
        } else {
            throw new Error('Where is my extension?!!');
        }
    });
});
