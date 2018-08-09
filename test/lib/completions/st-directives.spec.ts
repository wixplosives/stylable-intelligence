import * as asserters from './asserters';
import { createRange } from '../../../src/lib/completion-providers'
import { importDirectives, rulesetDirectives } from '../../../src/lib/completion-types';

describe('Inner Directives', function () {


    describe('should complete -st-from inside import selector ', function () {
        importDirectives.from.split('').map((c, i) => {
            let prefix = importDirectives.from.slice(0, i);
            it(' with Prefix: ' + prefix + ' ', function () {
                return asserters.getCompletions('imports/inside-import-selector.st.css', prefix).then((asserter) => {
                    asserter.suggested([
                        asserters.importFromDirectiveCompletion(createRange(2, 4, 2, 4 + i))
                    ]);
                });
            });
        });
    });

    describe('should complete -st-default inside import selector ', function () {
        importDirectives.default.split('').map((c, i) => {
            let prefix = importDirectives.default.slice(0, i);
            it(' with Prefix: ' + prefix + ' ', function () {
                return asserters.getCompletions('imports/inside-import-selector.st.css', prefix).then((asserter) => {
                    asserter.suggested([
                        asserters.importDefaultDirectiveCompletion(createRange(2, 4, 2, 4 + i))
                    ]);
                });
            });
        });
    });

    describe('should complete -st-named inside import selector ', function () {
        importDirectives.named.split('').map((c, i) => {
            let prefix = importDirectives.named.slice(0, i);
            it(' with Prefix: ' + prefix + ' ', function () {
                return asserters.getCompletions('imports/inside-import-selector.st.css', prefix).then((asserter) => {
                    asserter.suggested([
                        asserters.importNamedDirectiveCompletion(createRange(2, 4, 2, 4 + i))
                    ]);
                });
            });
        });
    });

    it('should not complete -st-from, -st-default, -st-named inside import directives when exists', function () {
        return asserters.getCompletions('imports/inside-import-selector-with-fields.st.css').then((asserter) => {
            asserter.notSuggested([
                asserters.importFromDirectiveCompletion(createRange(0, 0, 0, 0)),
                asserters.importDefaultDirectiveCompletion(createRange(0, 0, 0, 0)),
                asserters.importNamedDirectiveCompletion(createRange(0, 0, 0, 0)),
            ]);
        });
    });

    it('should not complete -st-from, -st-default, -st-named outisde the import ruleset', function () {
        return asserters.getCompletions('imports/outside-ruleset.st.css').then((asserter) => {
            asserter.notSuggested([
                asserters.importFromDirectiveCompletion(createRange(0, 0, 0, 0)),
                asserters.importDefaultDirectiveCompletion(createRange(0, 0, 0, 0)),
                asserters.importNamedDirectiveCompletion(createRange(0, 0, 0, 0)),
            ]);
        });
    });

    describe('should complete -st-states inside simple selector ruleset ', function () {
        rulesetDirectives.states.split('').map((c, i) => {
            let prefix = rulesetDirectives.states.slice(0, i);
            it(' with Prefix: ' + prefix + ' ', function () {
                return asserters.getCompletions('imports/inside-ruleset.st.css', prefix).then((asserter) => {
                    asserter.suggested([
                        asserters.statesDirectiveCompletion(createRange(2, 4, 2, 4 + i))
                    ]);
                });
            });
        });
    });

    describe('should complete -st-extends inside simple selector ruleset ', function () {
        rulesetDirectives.extends.split('').map((c, i) => {
            let prefix = rulesetDirectives.extends.slice(0, i);
            it(' with Prefix: ' + prefix + ' ', function () {
                return asserters.getCompletions('imports/inside-ruleset.st.css', prefix).then((asserter) => {
                    asserter.suggested([
                        asserters.extendsDirectiveCompletion(createRange(2, 4, 2, 4 + i))
                    ]);
                });
            });
        });
    });

    describe('should complete -st-mixin inside simple selector ruleset ', function () {
        rulesetDirectives.mixin.split('').map((c, i) => {
            let prefix = rulesetDirectives.mixin.slice(0, i);
            it(' with Prefix: ' + prefix + ' ', function () {
                return asserters.getCompletions('imports/inside-ruleset.st.css', prefix).then((asserter) => {
                    asserter.suggested([
                        asserters.mixinDirectiveCompletion(createRange(2, 4, 2, 4 + i))
                    ]);
                });
            });
        });
    });

    it('should not complete -st-states, -st-extends, -st-mixin inside simple selector ruleset when they exist', function () {
        return asserters.getCompletions('general/inside-simple-ruleset-with-all-st-fields.st.css').then((asserter) => {
            asserter.notSuggested([
                asserters.statesDirectiveCompletion(createRange(0, 0, 0, 0)),
                asserters.extendsDirectiveCompletion(createRange(0, 0, 0, 0)),
                asserters.mixinDirectiveCompletion(createRange(0, 0, 0, 0)),
            ]);
        });
    });

    it('should complete -st-mixin, but not -st-states, -st-extends inside media query', function () {
        return asserters.getCompletions('complex-selectors/media-query.st.css').then((asserter) => {
            asserter.suggested([
                asserters.mixinDirectiveCompletion(createRange(2, 8, 2, 8)),
            ])
            asserter.notSuggested([
                asserters.statesDirectiveCompletion(createRange(0, 0, 0, 0)),
                asserters.extendsDirectiveCompletion(createRange(0, 0, 0, 0)),
            ]);
        });
    });

    describe('should complete -st-mixin, but not -st-states, -st-extends inside complex rules', function () {
        [
            'complex-selectors/class-and-class.st.css',
            'complex-selectors/class-and-descendant.st.css',
            'complex-selectors/class-and-tag.st.css',
            'complex-selectors/tag-and-class.st.css',
            'complex-selectors/class-and-state.st.css',
        ].map((src) => {
            it('complex rule ' + src.slice(0, src.indexOf('{')), function () {
                return asserters.getCompletions(src).then((asserter) => {
                    asserter.suggested([
                        asserters.mixinDirectiveCompletion(createRange(1, 4, 1, 4)),
                    ])
                    asserter.notSuggested([
                        asserters.statesDirectiveCompletion(createRange(0, 0, 0, 0)),
                        asserters.extendsDirectiveCompletion(createRange(0, 0, 0, 0)),
                    ]);
                });
            })
        });
    });
});
