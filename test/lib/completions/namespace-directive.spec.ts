import * as asserters from './asserters';
import { createRange } from '../../../src/lib/completion-providers';
import { topLevelDirectives } from '../../../src/lib/completion-types';

describe('Namespace Directive', () => {
    describe('should complete @namespace at top level ', () => {
        topLevelDirectives.namespace.split('').map((c, i) => {
            const prefix = topLevelDirectives.namespace.slice(0, i);
            it(' with Prefix: ' + prefix + ' ', async () => {
                const asserter = await asserters.getCompletions('imports/top-level.st.css', prefix);
                asserter.suggested([asserters.namespaceDirectiveCompletion(createRange(0, 0, 0, i))]);
            });
        });
    });

    it('should not complete @namespace if exists', async () => {
        const asserter = await asserters.getCompletions('imports/top-level-import-exists.st.css');
        asserter.notSuggested([asserters.namespaceDirectiveCompletion(createRange(0, 0, 0, 0))]);
    });

    it('should not complete @namespace inside rulesets', async () => {
        const asserter = await asserters.getCompletions('imports/inside-ruleset.st.css');
        asserter.notSuggested([asserters.namespaceDirectiveCompletion(createRange(0, 0, 0, 0))]);
    });

    it('should not complete @namespace inside selectors', async () => {
        const asserter = await asserters.getCompletions('imports/before-selector.st.css');
        asserter.notSuggested([asserters.namespaceDirectiveCompletion(createRange(0, 0, 0, 0))]);
    });

    it('should not complete @namespace inside media query', async () => {
        const asserter = await asserters.getCompletions('imports/media-query.st.css');
        asserter.notSuggested([asserters.namespaceDirectiveCompletion(createRange(0, 0, 0, 0))]);
    });
});
