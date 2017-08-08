var path = require('path')
process.env.CODE_TESTS_PATH = path.resolve(__dirname, './dist/test')
require('./node_modules/vscode/bin/test')
