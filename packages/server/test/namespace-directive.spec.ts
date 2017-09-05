import * as asserters from '../test-kit/asserters';

describe('Namespace Directive', function () {

    it('should complete @namespace at top level after ""', function () {
        return asserters.getCompletions('imports/top-level-no-chars.css').then((asserter) => {
                asserter.suggested([
                    asserters.namespaceDirectiveCompletion,
                ]);
            });
    });

    it('should complete @namespace at top level after "@"', function () {
        return asserters.getCompletions('imports/top-level-at-sign.css').then((asserter) => {
                asserter.suggested([
                    asserters.namespaceDirectiveCompletion
                ]);
            });
    });

    it('should not complete @namespace if exists', function () {
        return asserters.getCompletions('imports/top-level-import-exists.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.namespaceDirectiveCompletion
                ]);
            });
    });

    it('should not complete @namespace inside rulesets', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
                asserter.suggested([]);
                asserter.notSuggested([
                    asserters.namespaceDirectiveCompletion
                ]);
            });
    });

    it('should not complete @namespace inside selectors', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.namespaceDirectiveCompletion
                ]);
            });
    });

    it('should not complete @namespace inside media query', function () {
        return asserters.getCompletions('imports/media-query.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.namespaceDirectiveCompletion
                ]);
            });
    });

});
