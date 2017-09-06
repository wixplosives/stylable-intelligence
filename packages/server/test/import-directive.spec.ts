import * as asserters from '../test-kit/asserters';
import {createRange} from '../src/completion-providers';

describe('Import Directive', function () {

    it('should complete :import at top level after ""', function () {
        return asserters.getCompletions('imports/top-level-no-chars.css').then((asserter) => {
            asserter.suggested([
                asserters.importDirectiveCompletion(createRange(0,0,0,0))
            ]);
        });
    });

    it('should complete :import at top level after ":"', function () {
        return asserters.getCompletions('imports/top-level-colon.css').then((asserter) => {
            asserter.suggested([
                asserters.importDirectiveCompletion(createRange(0,0,0,1))
            ]);
        })
    });

    it('should complete :import at top level even if exists', function () {
        return asserters.getCompletions('imports/top-level-import-exists.css').then((asserter) => {
            asserter.suggested([
                asserters.importDirectiveCompletion(createRange(11,0,11,1)),
            ]);
        });
    });

    it('should not complete :import after ::', function () {
        return asserters.getCompletions('imports/top-level-colon-colon.css').then((asserter) => {
            asserter.notSuggested([
                asserters.importDirectiveCompletion(createRange(0,0,0,0)),
            ]);
        });
    });

    it('should not complete :import inside ruleset', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
            asserter.notSuggested([
                asserters.importFromDirectiveCompletion(createRange(0,0,0,0)),
            ]);
        });
    });

    it('should not complete :import inside ruleset', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
            asserter.notSuggested([
                asserters.importFromDirectiveCompletion(createRange(0,0,0,0)),
            ]);
        });
    });

    it('should not complete :import inside media query', function () {
        return asserters.getCompletions('imports/media-query.css').then((asserter) => {
            asserter.notSuggested([
                asserters.importDirectiveCompletion(createRange(0,0,0,0)),
            ]);
        });
    });

    describe('should not complete :import inside selectors', function () {
        [
            'imports/selector.css',
            'imports/selector-with-colon.css',
            'imports/selector-with-space.css',
            'imports/selector-with-colon-space.css',
            'imports/before-selector.css',
        ].map((src) => {
            it('complex rule ' + src.slice(0, src.indexOf('{')), function () {
                return asserters.getCompletions(src).then((asserter) => {
                    asserter.notSuggested([
                        asserters.statesDirectiveCompletion(createRange(0,0,0,0)),
                        asserters.extendsDirectiveCompletion(createRange(0,0,0,0)),
                        asserters.variantDirectiveCompletion(createRange(0,0,0,0)),
                    ]);
                });
            })
        });
    });
});
