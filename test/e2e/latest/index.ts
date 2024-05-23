import { collectAndRunTests } from '../../lsp-testkit/collect-and-run-tests';

export function run() {
    return collectAndRunTests({ testsRoot: __dirname, suiteName: 'latest' });
}
