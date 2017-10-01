import * as asserters from '../test-kit/asserters';
import {createRange} from '../src/completion-providers'
import { topLevelDirectives } from '../src/completion-types';

describe('Namespace Directive', function () {

    describe('should complete @namespace at top level ', function () {
        topLevelDirectives.namespace.split('').map((c, i) => {
            let prefix = topLevelDirectives.namespace.slice(0, i);
            it(' with Prefix: ' + prefix + ' ', function () {
                return asserters.getCompletions('imports/top-level.css', prefix).then((asserter) => {
                    asserter.suggested([
                        asserters.namespaceDirectiveCompletion(createRange(0, 0, 0, i))
                    ]);
                });
            });
        })
    })

    it('should not complete @namespace if exists', function () {
        return asserters.getCompletions('imports/top-level-import-exists.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.namespaceDirectiveCompletion(createRange(0,0,0,0))
                ]);
            });
    });

    it('should not complete @namespace inside rulesets', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.namespaceDirectiveCompletion(createRange(0,0,0,0))
                ]);
            });
    });

    it('should not complete @namespace inside selectors', function () {
        return asserters.getCompletions('imports/before-selector.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.namespaceDirectiveCompletion(createRange(0,0,0,0))
                ]);
            });
    });

    it('should not complete @namespace inside media query', function () {
        return asserters.getCompletions('imports/media-query.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.namespaceDirectiveCompletion(createRange(0,0,0,0))
                ]);
            });
    });

});
