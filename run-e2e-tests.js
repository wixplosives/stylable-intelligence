const path = require('path');
const { runTests } = require('vscode-test');

async function main() {
    // Download VS Code, unzip it and run the integration test
    await runTests({
        extensionDevelopmentPath: __dirname,
        extensionTestsPath: path.join(__dirname, 'dist/test/e2e'),
        launchArgs: [path.join(__dirname, 'fixtures/e2e-cases')]
    });
}

main().catch(() => {
    console.error('Failed to run tests');
    process.exit(1);
});
