import * as asserters from '../test-kit/asserters';

describe('Import Directive', function () {

    it('should complete :import at top level after ""', function () {
        return asserters.getCompletions('imports/top-level-no-chars.css').then((asserter) => {
            asserter.suggested([
                asserters.importCompletion
            ]);
            asserter.notSuggested([
            ]);
        });
    });

    it('should complete :import at top level after ":"', function () {
        return asserters.getCompletions('imports/top-level-colon.css').then((asserter) => {
            asserter.suggested([
                asserters.importCompletion
            ]);
            asserter.notSuggested([
                asserters.rootCompletion,
                asserters.classCompletion('gaga'),
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.mixinDirectiveCompletion,
                asserters.variantDirectiveCompletion
            ]);
        });
    });

    it('should complete :import at top level even if exists', function () {
        return asserters.getCompletions('imports/top-level-import-exists.css').then((asserter) => {
            asserter.suggested([
                asserters.importCompletion,
            ]);
            asserter.notSuggested([
                asserters.rootCompletion,
                asserters.classCompletion('gaga'),
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.mixinDirectiveCompletion,
                asserters.variantDirectiveCompletion
            ]);
        });
    });

    it('should not complete :import after ::', function () {
        return asserters.getCompletions('imports/top-level-colon-colon.css').then((asserter) => {
            asserter.suggested([]);
            asserter.notSuggested([
                asserters.importCompletion,
                asserters.rootCompletion,
                asserters.classCompletion('gaga'),
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.mixinDirectiveCompletion,
                asserters.variantDirectiveCompletion
            ]);
        });
    });

    it('should not complete :import inside ruleset', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
            asserter.suggested([]);
            asserter.notSuggested([
                asserters.importFromDirectiveCompletion,
                asserters.importDefaultDirectiveCompletion,
                asserters.importNamedDirectiveCompletion,
                asserters.importCompletion
            ]);
        });
    });

    it('should not complete :import inside ruleset', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
            asserter.suggested([]);
            asserter.notSuggested([
                asserters.importFromDirectiveCompletion,
                asserters.importDefaultDirectiveCompletion,
                asserters.importNamedDirectiveCompletion,
                asserters.importCompletion
            ]);
        });
    });

    it('should not complete :import inside media query', function () {
        return asserters.getCompletions('imports/media-query.css').then((asserter) => {
            asserter.notSuggested([
                asserters.importCompletion,
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
                        asserters.statesDirectiveCompletion,
                        asserters.extendsDirectiveCompletion,
                        asserters.variantDirectiveCompletion
                    ]);
                });
            })
        });
    });
});
