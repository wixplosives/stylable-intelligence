import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers';

describe('Pseudo-elements', function () {
    describe('Deafult import used as tag', function () {
        it.only('should complete pseudo-element ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 4), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 4), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after : ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 5), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 5), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag-colon-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 6), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 6), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: + initial string ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag-colon-colon-letter.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 7), './import.st.css'),
                ]);
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 7), './import.st.css'),
                ]);
            });
        });

        it('should not complete pseudo-element if one exists ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag-pseudo-element-exists.st.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 6), './import.st.css'),
                    asserters.pseudoElementCompletion('lol', createRange(6, 4, 6, 6), './import.st.css'),
                ]);
            });
        });
    });

    describe('Deafult import extended by class', function () {
        it('should complete pseudo-element ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(10, 4, 10, 4), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(10, 4, 10, 4), './import.st.css'),
                ]);
            });
        });
        it('should complete pseudo-element after : ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(10, 4, 10, 5), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(10, 4, 10, 5), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended-colon-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(10, 4, 10, 6), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(10, 4, 10, 6), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: + initial string ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended-colon-colon-letter.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 7), './import.st.css'),
                ]);
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 7), './import.st.css'),
                ]);
            });
        });

        it('should not complete pseudo-element if one exists ', function () { //Comp::shlomo|:state
            return asserters.getCompletions('pseudo-elements/default-import-extended-pseudo-element-exists.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 6), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 6), './import.st.css'),
                ]);
            });
        });

    });
});
