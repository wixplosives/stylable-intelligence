import { promisify } from 'util';
import { normalize } from 'path';
import Mocha from 'mocha';
import globCb from 'glob';

const glob = promisify(globCb);
const testsRoot = __dirname;

export async function run() {
    const mocha = new Mocha({
        ui: 'tdd'
    });
    mocha.useColors(true);
    const testFilePaths = await glob('**/**.test.js', { cwd: testsRoot, absolute: true });
    for (const filePath of testFilePaths) {
        mocha.addFile(normalize(filePath));
    }
    await new Promise((resolve, reject) => {
        try {
            mocha.run(failures => {
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
