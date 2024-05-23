import fs from '@file-services/node';
import vscode from 'vscode';
import { expect } from 'chai';
import path from 'path';

suite('configuration (stylable v5 without config)', function () {
    this.timeout(60000);

    let rootDir: string | null;

    suiteSetup(() => {
        rootDir = fs.dirname(fs.findClosestFileSync(__dirname, 'package.json')!);
    });

    async function getWorkingDocument(...testSubPath: string[]) {
        const casesPath = path.join(rootDir!, 'fixtures', 'v5-with-no-config', ...testSubPath);
        const ext = vscode.extensions.getExtension('wix.stylable-intelligence');

        if (ext) {
            const doc = await vscode.workspace.openTextDocument(casesPath);
            await ext.activate();
            return doc;
        } else {
            throw new Error('Where is my extension?!!');
        }
    }
    function collectDiagnostics(source: 'stylable' | 'css', file: string) {
        const diags = vscode.languages.getDiagnostics();
        const res = [];

        for (const [pathObj, fileDiags] of diags) {
            for (const diag of fileDiags) {
                if (diag.source === source && file === pathObj.fsPath) {
                    res.push({
                        message: diag.message,
                        range: diag.range,
                        severity: diag.severity,
                        filePath: fs.realpathSync.native(pathObj.fsPath),
                    });
                }
            }
        }

        return res;
    }

    test('should set experimentalSelectorInference=false for version lower then 6 (if not set)', async () => {
        const testDoc = await getWorkingDocument('selector-infer-test.st.css');
        await vscode.window.showTextDocument(testDoc);

        const diags = collectDiagnostics('stylable', testDoc.uri.fsPath);
        expect(diags).to.eql([]);
    });
});
