import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers';
import { topLevelDirectives } from '../src/completion-types';

describe('Import Directive', function () {

    describe('should complete :import at top level ', function () {
        topLevelDirectives.import.split('').map((c, i) => {
            let prefix = topLevelDirectives.import.slice(0, i);
            it('when it doesn\'t exist, with prefix: ' + prefix + ' ', function () {
                return asserters.getCompletions('imports/top-level.css', prefix).then((asserter) => {
                    asserter.suggested([
                        asserters.importDirectiveCompletion(createRange(0, 0, 0, i))
                    ]);
                });
            });

            it('when it exists, with prefix: ' + prefix + ' ', function () {
                return asserters.getCompletions('imports/top-level-import-exists.css', prefix).then((asserter) => {
                    asserter.suggested([
                        asserters.importDirectiveCompletion(createRange(11, 0, 11, i)),
                    ]);
                });
            });
        });

        it('should not complete :import after ::', function () {
            return asserters.getCompletions('imports/top-level-colon-colon.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.importDirectiveCompletion(createRange(0, 0, 0, 0)),
                ]);
            });
        });

        it('should not complete :import inside ruleset', function () {
            return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.importDirectiveCompletion(createRange(0, 0, 0, 0)),
                ]);
            });
        });

        it('should not complete :import inside media query', function () {
            return asserters.getCompletions('imports/media-query.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.importDirectiveCompletion(createRange(0, 0, 0, 0)),
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
                            asserters.importDirectiveCompletion(createRange(0, 0, 0, 0)),
                        ]);
                    });
                })
            });
        });
    });
});
