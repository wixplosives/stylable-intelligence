const path = require('path');
const glob = require("glob");
const {
    testGlob
} = require('./package.json');
const testFiles = glob.sync(testGlob);

const distPath = path.join(__dirname,  '..', 'client', 'server');


const testsSetup = [path.join(__dirname, '..', 'client', 'server', 'test', 'setup.js')];
module.exports = {
    devtool: 'eval',
    entry: {
        test: testsSetup.concat(testFiles),
        webtest: testsSetup.concat(testFiles.map(fileName => `mocha-loader!${fileName}`))
    },
    output: {
        path: distPath,
        filename: '[name].bundle.js',
        libraryTarget: 'umd',
        pathinfo: true
    },
    devServer: {
        contentBase: distPath,
        inline: true,
        hot: false
    },
    module: {
        noParse: [/\.min\.js$/, /\.bundle\.js$/]
    }
};
