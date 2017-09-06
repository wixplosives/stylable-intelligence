import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers'

describe('Variables Directive', function () {

    it('should complete :vars at top level after ""', function () {
        return asserters.getCompletions('imports/top-level-no-chars.css').then((asserter) => {
            asserter.suggested([
                asserters.varsDirectiveCompletion(createRange(0,0,0,0)),
            ]);
        });
    });

    it('should complete :vars at top level after ":"', function () {
        return asserters.getCompletions('imports/top-level-colon.css').then((asserter) => {
            asserter.suggested([
                asserters.varsDirectiveCompletion(createRange(0,0,0,1))
            ]);
        });
    });

    it('should complete :vars at top level even if exists', function () {
        return asserters.getCompletions('imports/top-level-import-exists.css').then((asserter) => {
            asserter.suggested([
                asserters.varsDirectiveCompletion(createRange(11,0,11,1)),
            ]);
        });
    });

    it('should not complete :vars after ::', function () {
        return asserters.getCompletions('imports/top-level-colon-colon.css').then((asserter) => {
            asserter.notSuggested([
                asserters.varsDirectiveCompletion(createRange(0,0,0,0)),
            ]);
        });
    });

    it('should not complete :vars inside rulesets', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
            asserter.suggested([]);
            asserter.notSuggested([
                asserters.varsDirectiveCompletion(createRange(0,0,0,0))
            ]);
        });
    });

    it('should not complete :vars inside media query', function () {
        return asserters.getCompletions('imports/media-query.css').then((asserter) => {
            asserter.suggested([]);
            asserter.notSuggested([
                asserters.varsDirectiveCompletion(createRange(0,0,0,0))
            ]);
        });
    });
});
