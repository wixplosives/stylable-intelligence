import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers'

describe('Inner Directives', function () {
    it('should complete -st-from, -st-default, -st-named, -st-theme inside import directives', function () {
        return asserters.getCompletions('imports/inside-import-selector.css').then((asserter) => {
            asserter.suggested([
                asserters.importFromDirectiveCompletion(createRange(2,4,2,4)),
                asserters.importDefaultDirectiveCompletion(createRange(2,4,2,4)),
                asserters.importNamedDirectiveCompletion(createRange(2,4,2,4)),
                asserters.themeDirectiveCompletion(createRange(2,4,2,4)),
            ]);
        });
    });

    it('should not complete -st-from, -st-default, -st-named, -st-theme inside import directives when exists', function () {
        return asserters.getCompletions('imports/inside-import-selector-with-fields.css').then((asserter) => {
            asserter.notSuggested([
                asserters.importFromDirectiveCompletion(createRange(0,0,0,0)),
                asserters.importDefaultDirectiveCompletion(createRange(0,0,0,0)),
                asserters.importNamedDirectiveCompletion(createRange(0,0,0,0)),
                asserters.themeDirectiveCompletion(createRange(0,0,0,0)),
            ]);
        });
    });

    it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector ruleset', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
            asserter.suggested([
                asserters.statesDirectiveCompletion(createRange(2,4,2,4)),
                asserters.extendsDirectiveCompletion(createRange(2,4,2,4)),
                asserters.mixinDirectiveCompletion(createRange(2,4,2,4)),
                asserters.variantDirectiveCompletion(createRange(2,4,2,4)),
            ]);
        });
    });

    it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector ruleset after dash', function () {
        return asserters.getCompletions('general/inside-simple-ruleset-dash.css')
            .then((asserter) => {
                asserter.suggested([
                    asserters.statesDirectiveCompletion(createRange(2,4,2,5)),
                    asserters.extendsDirectiveCompletion(createRange(2,4,2,5)),
                    asserters.mixinDirectiveCompletion(createRange(2,4,2,5)),
                    asserters.variantDirectiveCompletion(createRange(2,4,2,5)),
                ]);
            });
    });

    it('should not complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector ruleset when they exist', function () {
        return asserters.getCompletions('general/inside-simple-ruleset-with-all-st-fields.css').then((asserter) => {
            asserter.notSuggested([
                asserters.statesDirectiveCompletion(createRange(0,0,0,0)),
                asserters.extendsDirectiveCompletion(createRange(0,0,0,0)),
                asserters.mixinDirectiveCompletion(createRange(0,0,0,0)),
                asserters.variantDirectiveCompletion(createRange(0,0,0,0)),
            ]);
        });
    });

    it('should complete -st-mixin, but not -st-states, -st-extends, -st-variant inside media query', function () {
        return asserters.getCompletions('complex-selectors/media-query.css').then((asserter) => {
            asserter.suggested([
                asserters.mixinDirectiveCompletion(createRange(2,8,2,8)),
            ])
            asserter.notSuggested([
                asserters.statesDirectiveCompletion(createRange(0,0,0,0)),
                asserters.extendsDirectiveCompletion(createRange(0,0,0,0)),
                asserters.variantDirectiveCompletion(createRange(0,0,0,0)),
            ]);
        });
    });

    describe('should complete -st-mixin, but not -st-states, -st-extends, -st-variant inside complex rules', function () {
        [
            'complex-selectors/class-and-class.css',
            'complex-selectors/class-and-descendant.css',
            'complex-selectors/class-and-tag.css',
            'complex-selectors/tag-and-class.css',
            'complex-selectors/class-and-state.css',
        ].map((src) => {
            it('complex rule ' + src.slice(0, src.indexOf('{')), function () {
                return asserters.getCompletions(src).then((asserter) => {
                    asserter.suggested([
                        asserters.mixinDirectiveCompletion(createRange(1,4,1,4)),
                    ])
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
