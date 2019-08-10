const path = require('path');
const { runTests } = require('vscode-test');

async function main() {
    try {
        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath: __dirname,
            extensionTestsPath: path.join(__dirname, 'dist/test/e2e'),
            launchArgs: [path.join(__dirname, 'fixtures/e2e-cases')]
        });
    } catch (e) {
        console.error('Test Failed', e);
        process.exit(1);
    }
}

main();
