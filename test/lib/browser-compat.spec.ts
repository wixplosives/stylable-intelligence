import path from 'path';
import webpack from 'webpack';
import MemoryFS from 'memory-fs';
import pkgDir from 'pkg-dir';

describe('browser-compatible', () => {
    it('bundleable by webpack with no errors', async function() {
        this.timeout(50000);
        const memoryFS = new MemoryFS();
        const rootPath = await pkgDir(__dirname);

        const compiler = webpack({
            mode: 'development',
            entry: {
                main: path.join(rootPath!, 'dist', 'src', 'lib', 'service.js')
            },
            node: {
                path: 'empty', // users should provide alias to path-webpack
                net: 'empty',
                fs: 'empty',
                module: 'empty'
            }
        });

        compiler.outputFileSystem = memoryFS;

        await new Promise((res, rej) =>
            compiler.run((err, stats) => {
                if (err || stats.hasErrors()) {
                    rej(err || new Error(stats.toString()));
                } else {
                    res();
                }
            })
        );
    });
});
