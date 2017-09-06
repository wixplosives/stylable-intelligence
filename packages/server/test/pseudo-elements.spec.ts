import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers';

describe('Pseudo-elements', function () {
    it('should complete pseudo-element on default import used as tag', function () {
        return asserters.getCompletions('pseudo-elements/default-import-as-tag.st.css').then((asserter) => {
            asserter.suggested([
                asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 4), './import.st.css'),
                asserters.pseudoElementCompletion('lol', createRange(6, 4, 6, 4), './import.st.css'),
            ]);
        });
    });

    it('should complete pseudo-element on default import used as tag after : ', function () {
        return asserters.getCompletions('pseudo-elements/default-import-as-tag-colon.st.css').then((asserter) => {
            asserter.suggested([
                asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 5), './import.st.css'),
                asserters.pseudoElementCompletion('lol', createRange(6, 4, 6, 5), './import.st.css'),
            ]);
        });
    });

    it('should complete pseudo-element on default import used as tag after :: ', function () {
        return asserters.getCompletions('pseudo-elements/default-import-as-tag-colon-colon.st.css').then((asserter) => {
            asserter.suggested([
                asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 6), './import.st.css'),
                asserters.pseudoElementCompletion('lol', createRange(6, 4, 6, 6), './import.st.css'),
            ]);
        });
    });

    xit('should complete pseudo-element on default import used as tag after :: + initial string ', function () {
        return asserters.getCompletions('pseudo-elements/default-import-as-tag-colon-colon-letter.st.css').then((asserter) => {
            asserter.suggested([
                asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 7), './import.st.css'),
            ]);
            asserter.notSuggested([
                asserters.pseudoElementCompletion('lol', createRange(6, 4, 6, 7), './import.st.css'),
            ]);
        });
    });


});
