import * as asserters from '../test-kit/asserters';

xdescribe('Variables', function () {

    it('should complete :vars at top level after ""', function () {
        return asserters.getCompletions('imports/top-level-no-chars.css').then((asserter) => {
                asserter.suggested([
                    asserters.varsCompletion
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

    it('should complete :vars at top level after ":"', function () {
        return asserters.getCompletions('imports/top-level-colon.css').then((asserter) => {
                asserter.suggested([
                    asserters.varsCompletion
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

    it('should not complete :vars at top level if exists', function () {
        return asserters.getCompletions('???.css').then((asserter) => {
                asserter.suggested([
                ]);
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

    it('should not complete :vars after ::', function () {
        return asserters.getCompletions('imports/top-level-colon-colon.css').then((asserter) => {
                asserter.suggested([]);
                asserter.notSuggested([
                    asserters.varsCompletion,
                    asserters.rootCompletion,
                    asserters.classCompletion('gaga'),
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
    });

    it('should not complete :vars inside selectors', function () {
        return asserters.getCompletions('imports/inside-simple-selector.css').then((asserter) => {
                asserter.suggested([]);
                asserter.notSuggested([
                    asserters.varsCompletion
                ]);
            });
    });

});
