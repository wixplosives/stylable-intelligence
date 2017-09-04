import * as asserters from '../test-kit/asserters';

describe('completion unit test', function () {
    describe('root level', function () {
        it('should complete ONLY import and vars directive, root and existing classes at top level', function () {
            return asserters.getCompletions('general/top-level-existing-classes.css').then((asserter) => {
                asserter.suggested(
                    [
                        asserters.importCompletion,
                        asserters.rootCompletion,
                        asserters.varsCompletion,
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

        it('should not complete broken classes at top level', function () {
            return asserters.getCompletions('general/top-level-existing-classes-broken.css').then((asserter) => {
                asserter.suggested(
                    [
                        asserters.importCompletion,
                        asserters.rootCompletion,
                        asserters.classCompletion('gaga'),
                    ]
                );
                asserter.notSuggested([
                    asserters.classCompletion('baga'),
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

        it('should complete classes and tags, but not root, in non-initial selector chunks', function () {
            return asserters.getCompletions('general/non-initial-chunk.css').then((asserter) => {
                asserter.suggested(
                    [
                        asserters.classCompletion('shlomo'),
                        asserters.classCompletion('momo'),
                        asserters.classCompletion('Compo',true),
                    ]
                );
                asserter.notSuggested([
                    asserters.rootCompletion,
                    asserters.importCompletion,
                    asserters.varsCompletion,
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
    });

    describe('directives', function () {
        it('should not break when no completions to provide', function () {
            return asserters.getCompletions('general/no-completions.css').then((asserter) => {
                //todo: write 'no completions' asserter
                asserter.exactSuggested([]);
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
            });
        });


        it('should complete available states after : in complex selectors', function () {
            return asserters.getCompletions('states/complex-selectors.css').then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('hello', 'states/complex-selectors.css')
                ]);
                asserter.notSuggested([
                    asserters.stateCompletion('goodbye', 'states/complex-selectors.css'),
                    asserters.stateCompletion('cheerio', 'states/complex-selectors.css')
                ]);
            });
        });

        it('should complete available states after : in complex selectors ending in state name', function () {
            return asserters.getCompletions('states/complex-selectors-with-states.css').then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('hello', 'states/complex-selectors-with-states.css')
                ]);
                asserter.notSuggested([
                    asserters.stateCompletion('goodbye', 'states/complex-selectors-with-states.css'),
                    asserters.stateCompletion('cheerio', 'states/complex-selectors-with-states.css')
                ]);
            });
        });

        it('should not complete available states after : in complex selectors if existing', function () {
            return asserters.getCompletions('states/complex-selectors-with-states-existing.css').then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('goodbye', 'states/complex-selectors-with-states-existing.css')
                ]);
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.stateCompletion('hello')
                ]);
            });
        });

        it('should not complete state value after :: ', function () {
            return asserters.getCompletions('states/class-with-states-double-colon.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.extendsCompletion('Comp'),
                    asserters.stateCompletion('hello'),
                    asserters.stateCompletion('goodbye'),
                    asserters.importCompletion,
                    asserters.mixinDirectiveCompletion
                ]);
            });
        });

    });

    describe('extends', function () {
        it('complete extensible classes and tags', function () {
            return asserters.getCompletions('extends/extend.css')
            .then((asserter) => {
                asserter.suggested([
                    asserters.extendsCompletion('shlomo'),
                    asserters.extendsCompletion('momo'),
                    asserters.extendsCompletion('root'),
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

        //revive
        xit('complete states for localy imported variant', function () {
            return asserters.getCompletions(
                `
                :import{
                    -st-from: "./comp.css";
                    -st-named: zagzag;

                }
                .gaga{
            //         -st-extends: zagzag;
            //     }
            //     .gaga:|
            //     `
                //     'comp.css':`
                //     .root{
                //         -st-states:shmover;
                //     }
                //     .zagzag{
                //         -st-variant:true;
                //     }
                // `
            ).then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                ]);
            });
        });
    });
})
