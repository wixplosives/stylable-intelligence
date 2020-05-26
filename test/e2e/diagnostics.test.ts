import fs from '@file-services/node';
import vscode from 'vscode';
import path from 'path';
import { expect } from 'chai';

// const fileUriToNativePath = (uri: string) => isWindows ? uri.slice(8).replace('%3A', ':') : uri.slice(7);

function getPathToDiagnostics(casePath: string) {
    let pathToFile = '';
    if (process.platform === 'win32') {
        pathToFile = casePath.split('\\').join('/');
        pathToFile = pathToFile.split(':').join('%3A');
        pathToFile = pathToFile.charAt(0).toLowerCase() + pathToFile.slice(1);
        pathToFile = 'file:///' + pathToFile;
    } else {
        pathToFile = 'file://' + casePath;
    }
    return pathToFile;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function assertDiagnosticExist(client: any, casePath: string, result: object) {
    // eslint-disable-next-line
    const diagnostic = client._diagnostics._data.get(getPathToDiagnostics(casePath));
    expect(diagnostic).to.have.length.greaterThan(0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return expect(diagnostic[0]).to.contain.keys(result);
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
            return assertDiagnosticExist(client, casePath, {
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
