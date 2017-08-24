import * as asserters from '../test-kit/asserters';

describe('completion unit test', function () {
    describe('root level', function () {
        it('should complete ONLY import directive, root and existing classes at top level', function () {
            return asserters.getCompletions('general/top-level-existing-classes.css').then((asserter) => {
                asserter.suggested(
                    [
                        asserters.importCompletion,
                        asserters.rootCompletion,
                        asserters.classCompletion('gaga'),
                        asserters.classCompletion('baga'),
                    ]
                );
                asserter.notSuggested([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });

        it('should complete root and existing classes at top level after "."', function () {
            return asserters.getCompletions('general/top-level-dot.css').then((asserter) => {
                asserter.suggested([
                    asserters.rootCompletion,
                    asserters.classCompletion('gaga'),
                ]);
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ])
            });
        });
    });

    describe('directives', function () {
        it('should not break when no completions to provide', function () {
            return asserters.getCompletions('general/no-completions.css').then((asserter) => {
                //todo: write 'no completions' asserter
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.stateCompletion('hello')
                ]);
            });
        });

        it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector', function () {
            return asserters.getCompletions('imports/inside-simple-selector.css').then((asserter) => {
                asserter.suggested([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });

        it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector after dash', function () {
            return asserters.getCompletions('general/inside-simple-selector-dash.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.statesDirectiveCompletion,
                        asserters.extendsDirectiveCompletion,
                        asserters.mixinDirectiveCompletion,
                        asserters.variantDirectiveCompletion
                    ]);
                });
        });

        it('should not complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector when they exist', function () {
            return asserters.getCompletions('general/inside-simple-selector-with-all-st-fields.css').then((asserter) => {
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

    describe('states', function () {
        it('should complete available states from same file after :', function () {
            return asserters.getCompletions('states/class-with-states.css').then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('hello', 'states/class-with-states.css'),
                    asserters.stateCompletion('goodbye', 'states/class-with-states.css')
                ]);
                asserter.notSuggested([
                    asserters.importCompletion
                ]);
            });
        });


        it('should complete available states after : in complex selectors', function () {
            return asserters.getCompletions('states/complex-selectors-with-states.css').then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('hello', 'states/complex-selectors-with-states.css')
                ]);
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.stateCompletion('goodbye', 'states/complex-selectors-with-states.css'),
                    asserters.stateCompletion('cheerio', 'states/complex-selectors-with-states.css')
                ]);
            });
        });

        it('should not complete available states after : in complex selectors if existing', function () {
            return asserters.getCompletions('states/complex-selectors-with-states-existing.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.stateCompletion('hello')

                ]);
            });
        });
    });

    describe('multiple files', function () {

        it('complete states for localy imported component', function () {
            return asserters.getCompletions('states/locally-imported-component.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.stateCompletion('shmover', 'states/comp-to-import.css')
                    ]);
                });
        });

        it('complete states for localy imported component (including local states)', function () {
            return asserters.getCompletions('states/locally-imported-component-with-states.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.stateCompletion('shmover', 'states/comp-to-import.css'),
                        asserters.stateCompletion('clover', 'states/locally-imported-component-with-states.css'),
                    ]);
                });
        });


        it('complete states for localy imported component ( recursive )', function () {
            return asserters.getCompletions('states/locally-imported-component-recursive.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.stateCompletion('shmover', 'states/comp-to-import.css'),
                        asserters.stateCompletion('hoover', 'states/mid-level-import.css'),
                        asserters.stateCompletion('clover', 'states/locally-imported-component-recursive.css'),
                    ]);
                });
        });

        xit('complete states for localy imported variant', function () {
            return asserters.getCompletions(
                `
                :import{
                    -st-from: "./comp.css";
                    -st-named: zagzag;

                }
                .gaga{
                    -st-extends: zagzag;
                }
                .gaga:|
                `).then((asserter) => {
                    asserter.suggested([
                        asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                    ]);
                });
        });

        it('should not complete directive value after :: ', function () {
            return asserters.getCompletions('states/class-with-states-double-colon.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.extendsCompletion('Comp'),
                    asserters.importCompletion,
                    asserters.mixinDirectiveCompletion
                ]);
            });
        });
    });
})
