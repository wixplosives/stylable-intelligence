const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const VendorChunkPlugin = require('webpack-vendor-chunk-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const glob = require("glob");
const {
    testGlob
} = require('./package.json');
const testFiles = glob.sync(testGlob);

const distPath = path.join(__dirname, '..', 'client', 'server');


const testsSetup = [path.join(__dirname, '..', 'client', 'server', 'test', 'setup.js')];
module.exports = {
    // devtool: 'eval',
    entry: {
        main: './src/service.ts'
    },
    devServer: {
        // contentBase: distPath,
        inline: true,
        hot: false
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: {
                loader: 'ts-loader',
                options: {
                    compilerOptions: {
                        "declaration": false
                    }
                }
            }
        }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].bundle.js',
        pathinfo: true
    },
    plugins: [
        // new BundleAnalyzerPlugin(),
        new HtmlWebpackPlugin()
    ],
    node: {
        fs: 'empty',
        module: 'empty'
    }

};
