import fs from '@file-services/node';
import vscode from 'vscode';
import { expect } from 'chai';
import path from 'path';

suite('configuration with errors', function () {
    this.timeout(60000);

    let rootDir: string | null;

    suiteSetup(() => {
        rootDir = fs.dirname(fs.findClosestFileSync(__dirname, 'package.json')!);
    });

    async function getWorkingDocument(...testSubPath: string[]) {
        const casesPath = path.join(rootDir!, 'fixtures', 'config-errors', ...testSubPath);
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

    test('should handle errors in resolve namespace config', async () => {
        const testDoc = await getWorkingDocument('errors.st.css');
        await vscode.window.showTextDocument(testDoc);
        const diags = collectDiagnostics('stylable', testDoc.uri.fsPath);
        // make sure extension functions correctly
        expect(diags.length).to.not.eql(0);
    });
});
