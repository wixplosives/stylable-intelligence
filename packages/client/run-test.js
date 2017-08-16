var path = require('path')
process.env.CODE_TESTS_PATH = path.resolve(__dirname, './dist/test')
process.env.CODE_TESTS_WORKSPACE = path.resolve(__dirname, './test/cases')
require('./node_modules/vscode/bin/test')
