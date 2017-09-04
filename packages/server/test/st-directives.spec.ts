import * as asserters from '../test-kit/asserters';

describe('Inner Directives', function () {
    it('should complete -st-from, -st-default, -st-named, -st-theme inside import directives', function () {
        return asserters.getCompletions('imports/inside-import-selector.css').then((asserter) => {
            asserter.suggested([
                asserters.importFromDirectiveCompletion,
                asserters.importDefaultDirectiveCompletion,
                asserters.importNamedDirectiveCompletion,
                asserters.themeDirectiveCompletion,
            ]);
        });
    });

    it('should not complete -st-from, -st-default, -st-named, -st-theme inside import directives when exists', function () {
        return asserters.getCompletions('imports/inside-import-selector-with-fields.css').then((asserter) => {
            asserter.notSuggested([
                asserters.importFromDirectiveCompletion,
                asserters.importDefaultDirectiveCompletion,
                asserters.importNamedDirectiveCompletion,
                asserters.themeDirectiveCompletion,
            ]);
        });
    });

    it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector ruleset', function () {
        return asserters.getCompletions('imports/inside-ruleset.css').then((asserter) => {
            asserter.suggested([
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.mixinDirectiveCompletion,
                asserters.variantDirectiveCompletion
            ]);
        });
    });

    it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector ruleset after dash', function () {
        return asserters.getCompletions('general/inside-simple-ruleset-dash.css')
            .then((asserter) => {
                asserter.suggested([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
    });

    it('should not complete -st-states, -st-extends, -st-mixin, -st-variant inside simple ruleset when they exist', function () {
        return asserters.getCompletions('general/inside-simple-ruleset-with-all-st-fields.css').then((asserter) => {
            asserter.notSuggested([
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.mixinDirectiveCompletion,
                asserters.variantDirectiveCompletion
            ]);
        });
    });

    describe('should not complete -st-states, -st-extends, -st-variant inside complex rules', function () {
        [
            'complex-selectors/class-and-class.css',
            'complex-selectors/class-and-descendant.css',
            'complex-selectors/class-and-tag.css',
            'complex-selectors/tag-and-class.css',
            'complex-selectors/class-and-state.css',
            'complex-selectors/media-query.css',
        ].map((src) => {
            it('complex rule ' + src.slice(0, src.indexOf('{')), function () {
                return asserters.getCompletions(src).then((asserter) => {
                    asserter.suggested([
                        asserters.mixinDirectiveCompletion
                    ])
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
