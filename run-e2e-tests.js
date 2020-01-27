const path = require('path');
const { runTests } = require('vscode-test');

// Download VS Code, unzip it and run the integration test
runTests({
    extensionDevelopmentPath: __dirname,
    extensionTestsPath: path.join(__dirname, 'dist/test/e2e'),
    launchArgs: [path.join(__dirname, 'fixtures/e2e-cases')]
}).catch(e => {
    console.error('Test Failed', e);
    process.exit(1);
});
