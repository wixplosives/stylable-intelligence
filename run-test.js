const path = require('path');
process.env.CODE_TESTS_PATH = path.join(__dirname, 'dist', 'test', 'e2e');
process.env.CODE_TESTS_WORKSPACE = path.join(__dirname, 'fixtures', 'e2e-cases');

require('vscode/bin/test');
