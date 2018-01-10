var webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var VendorChunkPlugin = require('webpack-vendor-chunk-plugin');
const path = require('path');
const glob = require("glob");
const {
    testGlob
} = require('./package.json');
const testFiles = glob.sync(testGlob);

const distPath = path.join(__dirname, '..', 'client', 'server');


const testsSetup = [path.join(__dirname, '..', 'client', 'server', 'test', 'setup.js')];
module.exports = {
    devtool: 'eval',
    entry: {
        main: './src/provider.ts',
        vendor: ['typescript', 'lodash'],
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
        extensions: ['.ts', '.tsx', '.js']
    },
    output: {
        filename: 'dist/[name].bundle.js',
        pathinfo: true
    },
    plugins: [
        new BundleAnalyzerPlugin(),
        new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: 'vendor.bundle.js' }),
        new VendorChunkPlugin('vendor')
    ],
    node: {
        fs: 'empty',
        module: 'empty'
    }

};
