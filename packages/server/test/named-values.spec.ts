import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers'

describe('Named Values', function () {
    it('completes classes from imported file after -st-named', function () {
        return asserters.getCompletions('named/st-named.st.css').then((asserter) => {
            asserter.suggested([
                asserters.namedCompletion('bobo', createRange(2, 14, 2, Number.MAX_VALUE)),
                asserters.namedCompletion('momo', createRange(2, 14, 2, Number.MAX_VALUE)),
                asserters.namedCompletion('shlomo', createRange(2, 14, 2, Number.MAX_VALUE))
            ]);
        });
    });

    it('completes classes from imported file after -st-named with following semicolon', function () {
        return asserters.getCompletions('named/st-named-semicolon.st.css').then((asserter) => {
            asserter.suggested([
                asserters.namedCompletion('bobo', createRange(2, 14, 2, Number.MAX_VALUE)),
                asserters.namedCompletion('momo', createRange(2, 14, 2, Number.MAX_VALUE)),
                asserters.namedCompletion('shlomo', createRange(2, 14, 2, Number.MAX_VALUE))
            ]);
        });
    });

    it('completes classes from imported file after -st-named with initial string', function () {
        return asserters.getCompletions('named/st-named-initial-string.st.css').then((asserter) => {
            asserter.suggested([
                asserters.namedCompletion('bobo', createRange(2, 14, 2, Number.MAX_VALUE)),
                asserters.namedCompletion('momo', createRange(2, 14, 2, Number.MAX_VALUE)),
                asserters.namedCompletion('shlomo', createRange(2, 14, 2, Number.MAX_VALUE))
            ]);
        });
    });

    it('completes names after single value', function () {
        return asserters.getCompletions('named/st-named-multi-value.st.css').then((asserter) => {
            asserter.suggested([
                asserters.namedCompletion('bobo', createRange(2, 21, 2, Number.MAX_VALUE), true),
                asserters.namedCompletion('momo', createRange(2, 21, 2, Number.MAX_VALUE), true),
            ]);
            asserter.notSuggested([
                asserters.namedCompletion('shlomo', createRange(2, 21, 2, Number.MAX_VALUE))
            ]);
        });
    });

    it('completes names after multiple values', function () {
        return asserters.getCompletions('named/st-named-multi-values.st.css').then((asserter) => {
            asserter.suggested([
                asserters.namedCompletion('momo', createRange(2, 27, 2, Number.MAX_VALUE), true),
            ]);
            asserter.notSuggested([
                asserters.namedCompletion('bobo', createRange(2, 21, 2, Number.MAX_VALUE), true),
                asserters.namedCompletion('shlomo', createRange(2, 21, 2, Number.MAX_VALUE))
            ]);
        });
    });

    xit('completes more than one name after ,', function () {
        return asserters.getCompletions('named/st-named-multi-value-comma.st.css').then((asserter) => {
            asserter.suggested([
                asserters.namedCompletion('bobo', createRange(2, 21, 2, Number.MAX_VALUE), true),
                asserters.namedCompletion('momo', createRange(2, 21, 2, Number.MAX_VALUE), true),
            ]);
            asserter.notSuggested([
                asserters.namedCompletion('shlomo', createRange(2, 21, 2, Number.MAX_VALUE))
            ]);
        });
    });

    xit('completes more than one name with following ; ', function () {
        return asserters.getCompletions('named/st-named-multi-value-semicolon.st.css').then((asserter) => {
            asserter.suggested([
                asserters.namedCompletion('bobo', createRange(2, 21, 2, Number.MAX_VALUE), true),
                asserters.namedCompletion('momo', createRange(2, 21, 2, Number.MAX_VALUE), true),
            ]);
            asserter.notSuggested([
                asserters.namedCompletion('shlomo', createRange(2, 21, 2, Number.MAX_VALUE))
            ]);
        });
    });

    xit('completes more than one name with initial string ', function () {
        return asserters.getCompletions('named/st-named-multi-value-initial-string.st.css').then((asserter) => {
            asserter.suggested([
                asserters.namedCompletion('momo', createRange(2, 21, 2, Number.MAX_VALUE), true),
            ]);
            asserter.notSuggested([
                asserters.namedCompletion('bobo', createRange(2, 21, 2, Number.MAX_VALUE), true),
                asserters.namedCompletion('shlomo', createRange(2, 21, 2, Number.MAX_VALUE))
            ]);
        });
    });

});
