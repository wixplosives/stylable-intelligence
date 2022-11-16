import fs from '@file-services/node';
import vscode, { Range } from 'vscode';
import path from 'path';
import { expect } from 'chai';
import { LanguageClient } from 'vscode-languageclient/node';
import { diagnostics as CSSTypeDiagnostics } from '@stylable/core/dist/features/css-type';

function collectDiagnostics(source: 'stylable' | 'css') {
    const diags = vscode.languages.getDiagnostics();
    const res = [];

    for (const [pathObj, fileDiags] of diags) {
        for (const diag of fileDiags) {
            if (diag.source === source) {
                res.push({
                    message: diag.message,
                    range: diag.range,
                    severity: diag.severity,
                    filePath: pathObj.fsPath,
                });
            }
        }
    }

    return res;
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
            const _client = await ext.activate();
            const doc = await vscode.workspace.openTextDocument(casePath);

            await vscode.window.showTextDocument(doc);

            const diags = collectDiagnostics('stylable');

            expect(diags).to.eql([
                {
                    range: new Range(0, 0, 0, 3),
                    message: CSSTypeDiagnostics.UNSCOPED_TYPE_SELECTOR('div').message,
                    severity: 1,
                    filePath: casePath,
                },
            ]);
        } else {
            throw new Error('Where is my extension?!!');
        }
    });

    test('should resolve a configured alias with no diagnostics', async () => {
        const casePath = path.join(rootDir, 'fixtures', 'e2e-cases', 'with-alias.st.css');
        const ext = vscode.extensions.getExtension<LanguageClient>('wix.stylable-intelligence');

        if (ext) {
            const _client = await ext.activate();
            const doc = await vscode.workspace.openTextDocument(casePath);

            await vscode.window.showTextDocument(doc);

            const diags = collectDiagnostics('stylable');
            const diagnosticsInTestSource = diags.filter((diag) => diag.filePath === casePath);

            expect(diagnosticsInTestSource).to.eql([]);
        } else {
            throw new Error('Where is my extension?!!');
        }
    });
});
