import fs from '@file-services/node';
import vscode, { TextDocument } from 'vscode';
import path from 'path';
import { expect } from 'chai';

// eslint-disable-next-line @typescript-eslint/ban-types
function assertDiagnosticExist(client: any, doc: TextDocument, result: object) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const diagnostics = client.diagnostics.get(doc.uri);

    expect(diagnostics).to.have.length.greaterThan(0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return expect(diagnostics[0]).to.contain.keys(result);
}

suite('test diagnostics', function () {
    this.timeout(60000);

    let rootDir: string;
    suiteSetup(() => {
        rootDir = fs.dirname(fs.findClosestFileSync(__dirname, 'package.json')!);
    });

    test('should support single file error', async () => {
        const casePath = path.join(rootDir, 'fixtures', 'e2e-cases', 'single-file-diag.st.css');
        const ext = vscode.extensions.getExtension('wix.stylable-intelligence');

        if (ext) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const client = await ext.activate();
            const doc = await vscode.workspace.openTextDocument(casePath);
            await vscode.window.showTextDocument(doc);
            return assertDiagnosticExist(client, doc, {
                range: {
                    _start: { _line: 1, _character: 1 },
                    _end: { _line: 1, _character: 13 },
                },
                message: '.root class cannot be used after spacing',
                severity: 0,
            });
        } else {
            throw new Error('Where is my extension?!!');
        }
    });
});
