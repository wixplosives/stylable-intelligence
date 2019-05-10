const { join } = require('path');
const { env } = process;

env.CODE_TESTS_PATH = join(__dirname, 'dist', 'test', 'e2e');
env.CODE_TESTS_WORKSPACE = join(__dirname, 'fixtures', 'e2e-cases');

require('vscode/bin/test');
