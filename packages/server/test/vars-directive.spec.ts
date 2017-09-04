import * as asserters from '../test-kit/asserters';

describe('Variables Directive', function () {

    it('should complete :vars at top level after ""', function () {
        return asserters.getCompletions('imports/top-level-no-chars.css').then((asserter) => {
                asserter.suggested([
                    asserters.varsCompletion,
                    asserters.rootCompletion,
                    asserters.classCompletion('gaga'),
                ]);
                asserter.notSuggested([
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

    it('should complete :vars at top level even if exists', function () {
        return asserters.getCompletions('imports/top-level-import-exists.css').then((asserter) => {
                asserter.suggested([
                    asserters.importCompletion,
                    asserters.varsCompletion,
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

    it('should not complete :vars inside rulesets', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
                asserter.suggested([]);
                asserter.notSuggested([
                    asserters.varsCompletion
                ]);
            });
    });

});
