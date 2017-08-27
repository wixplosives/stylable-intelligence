const glob = require('glob');

const { testGlob } = require('./package.json');
const StylablePlugin = require('stylable-integration/webpack-plugin');
const testFiles = glob.sync(testGlob);

module.exports = {
    devtool: 'source-map',
    entry: {
        src: ['./src/index.tsx'],
        tests: ['./test/setup.ts', ...testFiles.map(fileName => `mocha-loader!${fileName}`)]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    compilerOptions: {
                        "noEmit": false
                    }
                }
            },
            {
                test: /\.css$/,
                loader: 'stylable-integration/webpack-loader',
                options: { injectFileCss: true }
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    output: {
        filename:'./dist/[name].bundle.js',
        pathinfo: true
    },
    devServer: {
        disableHostCheck: true
    },
    plugins: [
        new StylablePlugin({ injectFileCss: true })
    ]
}
