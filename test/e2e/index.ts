import { normalize } from 'path';
import Mocha from 'mocha';
import glob from 'glob';

const testsRoot = __dirname;

export async function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
    });
    const testFilePaths = await glob('**/**.test.js', { cwd: testsRoot, absolute: true });
    for (const filePath of testFilePaths) {
        mocha.addFile(normalize(filePath));
    }
    await new Promise<void>((resolve, reject) => {
        try {
            mocha.run((failures) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}
