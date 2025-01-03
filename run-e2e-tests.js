// @ts-check
const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function runSuite(suiteName) {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = __dirname;

        // The path to the extension test script
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.join(__dirname, `./dist/test/e2e/${suiteName}/index`);

        // path to the test fixtures (root directory of test contexts)
        const pathToOpen = path.join(extensionDevelopmentPath, 'fixtures', suiteName);

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [pathToOpen],
        });
    } catch (err) {
        console.error('Failed to run tests');
        console.error(err);
        process.exit(1);
    }
}

async function runAllSuites() {
    await runSuite('latest');
    await runSuite('v5-with-no-config');
    await runSuite('v5-with-config');
    await runSuite('config-errors');
}

runAllSuites();
