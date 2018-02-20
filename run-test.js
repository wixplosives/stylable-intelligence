console.log('run-test');
var path = require('path');
process.env.CODE_TESTS_PATH = path.resolve(__dirname, './dist/test/e2e');
process.env.CODE_TESTS_WORKSPACE = path.resolve(__dirname, './fixtures/cases');
console.log('require')
require('vscode/bin/test')
console.log('require done')
