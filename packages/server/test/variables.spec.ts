import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers'

describe('Variables', function () {

    it('should complete value() inside rule value', function () {
        return asserters.getCompletions('variables/local-vars.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.valueDirective(createRange(6,10,6,11)),
                ]);
            });
    });

    it('should complete value() inside rule value after initial string', function () {
        return asserters.getCompletions('variables/local-vars-initial-string.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.valueDirective(createRange(6,10,6,13)),
                ]);
            });
    });

    it('should complete value() inside rule value inside a complex selector', function () {
        return asserters.getCompletions('variables/complex-selector.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.valueDirective(createRange(15,10,15,11)),
                ]);
            });
    });

});


/*
not inside other value
after name ...

*/
