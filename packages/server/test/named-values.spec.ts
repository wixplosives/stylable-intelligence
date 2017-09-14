import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers'

describe('Named Values', function () {
    it('completes classes from imported file after -st-named', function () {
        return asserters.getCompletions('named/st-named.st.css').then((asserter) => {
            asserter.suggested([
                asserters.extendsCompletion('bobo',createRange(2,14,2,Number.MAX_VALUE)),
                asserters.extendsCompletion('momo',createRange(2,14,2,Number.MAX_VALUE)),
                asserters.extendsCompletion('shlomo',createRange(2,14,2,Number.MAX_VALUE))
            ]);
        });
    });

    it('completes classes from imported file after -st-named with following semicolon', function () {
        return asserters.getCompletions('named/st-named-semicolon.st.css').then((asserter) => {
            asserter.suggested([
                asserters.extendsCompletion('bobo',createRange(2,14,2,Number.MAX_VALUE)),
                asserters.extendsCompletion('momo',createRange(2,14,2,Number.MAX_VALUE)),
                asserters.extendsCompletion('shlomo',createRange(2,14,2,Number.MAX_VALUE))
            ]);
        });
    });

    it('completes classes from imported file after -st-named with initial string', function () {
        return asserters.getCompletions('named/st-named-initial-string.st.css').then((asserter) => {
            asserter.suggested([
                asserters.extendsCompletion('bobo',createRange(2,14,2,Number.MAX_VALUE)),
                asserters.extendsCompletion('momo',createRange(2,14,2,Number.MAX_VALUE)),
                asserters.extendsCompletion('shlomo',createRange(2,14,2,Number.MAX_VALUE))
            ]);
        });
    });

});
