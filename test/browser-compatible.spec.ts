import fs from '@file-services/node';
import { createWebpackFs } from '@file-services/webpack';
import { createMemoryFs } from '@file-services/memory';
import path from 'path';
import webpack from 'webpack';

describe('browser-compatible', () => {
    it('bundleable by webpack with no errors', async function() {
        this.timeout(50000);
        const rootPath = fs.dirname(fs.findClosestFileSync(__dirname, 'package.json')!);

        const compiler = webpack({
            mode: 'development',
            entry: {
                main: path.join(rootPath!, 'dist', 'src', 'lib', 'service.js')
            },
            module: {
                rules: [],
                noParse: [
                    require.resolve('typescript/lib/typescript.js')
                ] as any
            },
            node: {
                fs: 'empty',
                net: 'empty'
            }
        });

        compiler.outputFileSystem = createWebpackFs(createMemoryFs());

        await new Promise((res, rej) =>
            compiler.run((err, stats) => {
                if (err || stats.hasErrors() || stats.hasWarnings()) {
                    rej(err || new Error(stats.toString()));
                } else {
                    res();
                }
            })
        );
    });
});
