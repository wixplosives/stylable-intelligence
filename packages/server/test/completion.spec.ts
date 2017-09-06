import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers';

describe('completion unit test', function () {
    describe('root level', function () {
        it('should complete ONLY import and vars directive, root and existing classes at top level', function () {
            return asserters.getCompletions('general/top-level-existing-classes.css').then((asserter) => {
                asserter.suggested(
                    [
                        asserters.importDirectiveCompletion(createRange(3, 0, 3, 0)),
                        asserters.rootClassCompletion(createRange(3, 0, 3, 0)),
                        asserters.varsDirectiveCompletion(createRange(3, 0, 3, 0)),
                        asserters.classCompletion('gaga', (createRange(3, 0, 3, 0))),
                        asserters.classCompletion('baga', (createRange(3, 0, 3, 0))),
                    ]
                );
                asserter.notSuggested([
                    asserters.statesDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.extendsDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.mixinDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.variantDirectiveCompletion(createRange(0, 0, 0, 0))
                ]);
            });
        });

        it('should not complete broken classes at top level', function () {
            return asserters.getCompletions('general/top-level-existing-classes-broken.css').then((asserter) => {
                asserter.suggested(
                    [
                        asserters.importDirectiveCompletion(createRange(3, 0, 3, 0)),
                        asserters.rootClassCompletion(createRange(3, 0, 3, 0)),
                        asserters.classCompletion('gaga', (createRange(3, 0, 3, 0))),
                    ]
                );
                asserter.notSuggested([
                    asserters.classCompletion('baga', createRange(0, 0, 0, 0)),
                    asserters.statesDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.extendsDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.mixinDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.variantDirectiveCompletion(createRange(0, 0, 0, 0)),
                ]);
            });
        });

        it('should complete root and existing classes at top level after "."', function () {
            return asserters.getCompletions('general/top-level-dot.css').then((asserter) => {
                asserter.suggested([
                    asserters.rootClassCompletion(createRange(0, 0, 0, 1)),
                    asserters.classCompletion('gaga', (createRange(0, 0, 0, 1))),
                ]);
                asserter.notSuggested([
                    asserters.importDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.statesDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.extendsDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.mixinDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.variantDirectiveCompletion(createRange(0, 0, 0, 0)),
                ])
            });
        });

        it('should complete classes and tags, but not root, in non-initial selector chunks', function () {
            return asserters.getCompletions('general/non-initial-chunk.css').then((asserter) => {
                asserter.suggested(
                    [
                        asserters.classCompletion('shlomo', (createRange(6, 6, 6, 6))),
                        asserters.classCompletion('momo', (createRange(6, 6, 6, 6))),
                        asserters.classCompletion('Compo', (createRange(6, 6, 6, 6)), true),
                    ]
                );
                asserter.notSuggested([
                    asserters.rootClassCompletion(createRange(0, 0, 0, 0)),
                ]);
            });
        });

        it('should not break when no completions to provide', function () {
            return asserters.getCompletions('general/no-completions.css').then((asserter) => {
                asserter.exactSuggested([]);
            });
        });
    });



    describe('states', function () {
        it('should complete available states from same file after :', function () {
            return asserters.getCompletions('states/class-with-states.css').then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('hello', createRange(4, 5, 4, 6), 'states/class-with-states.css'),
                    asserters.stateCompletion('goodbye', createRange(4, 5, 4, 6), 'states/class-with-states.css')
                ]);
            });
        });


        it('should complete available states after : in complex selectors', function () {
            return asserters.getCompletions('states/complex-selectors.css').then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('hello', createRange(9, 19, 9, 20), 'states/complex-selectors.css')
                ]);
                asserter.notSuggested([
                    asserters.stateCompletion('goodbye', createRange(9, 19, 9, 20), 'states/complex-selectors.css'),
                    asserters.stateCompletion('cheerio', createRange(9, 19, 9, 20), 'states/complex-selectors.css')
                ]);
            });
        });

        it('should complete available states after : in complex selectors ending in state name', function () {
            return asserters.getCompletions('states/complex-selectors-with-states.css').then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('hello', createRange(9, 25, 9, 26), 'states/complex-selectors-with-states.css')
                ]);
                asserter.notSuggested([
                    asserters.stateCompletion('goodbye', createRange(9, 25, 9, 26), 'states/complex-selectors-with-states.css'),
                    asserters.stateCompletion('cheerio', createRange(9, 25, 9, 26), 'states/complex-selectors-with-states.css')
                ]);
            });
        });

        it('should not complete available states after : in complex selectors if existing', function () {
            return asserters.getCompletions('states/complex-selectors-with-states-existing.css').then((asserter) => {
                asserter.suggested([
                    asserters.stateCompletion('goodbye', createRange(4, 11, 4, 12), 'states/complex-selectors-with-states-existing.css')
                ]);
                asserter.notSuggested([
                    asserters.stateCompletion('hello', createRange(0, 0, 0, 0))
                ]);
            });
        });

        it('should not complete state value after :: ', function () {
            return asserters.getCompletions('states/class-with-states-double-colon.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.stateCompletion('hello', createRange(0, 0, 0, 0)),
                    asserters.stateCompletion('goodbye', createRange(0, 0, 0, 0))
                ]);
            });
        });

    });

    describe('extends', function () {
        it('complete extensible classes and tags', function () {
            return asserters.getCompletions('extends/extend.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.extendsCompletion('shlomo', createRange(6, 16, 6, 16)),
                        asserters.extendsCompletion('momo', createRange(6, 16, 6, 16)),
                        asserters.extendsCompletion('root', createRange(6, 16, 6, 16)),
                    ]);
                });
        });

        it('complete extensible classes and tags after space', function () {
            return asserters.getCompletions('extends/extend-space.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.extendsCompletion('shlomo', createRange(6, 17, 6, 17)),
                        asserters.extendsCompletion('momo', createRange(6, 17, 6, 17)),
                        asserters.extendsCompletion('root', createRange(6, 17, 6, 17)),
                    ]);
                });
        });
    });

    describe('multiple files', function () {

        it('complete states for localy imported component', function () {
            return asserters.getCompletions('states/locally-imported-component.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.stateCompletion('shmover', createRange(10, 5, 10, 6), 'states/comp-to-import.css')
                    ]);
                });
        });

        it('complete states for localy imported component (including local states)', function () {
            return asserters.getCompletions('states/locally-imported-component-with-states.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.stateCompletion('shmover', createRange(11, 5, 11, 6), 'states/comp-to-import.css'),
                        asserters.stateCompletion('clover', createRange(11, 5, 11, 6), 'states/locally-imported-component-with-states.css'),
                    ]);
                });
        });


        it('complete states for localy imported component ( recursive )', function () {
            return asserters.getCompletions('states/locally-imported-component-recursive.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.stateCompletion('shmover', createRange(11, 11, 11, 12), 'states/comp-to-import.css'),
                        asserters.stateCompletion('hoover', createRange(11, 11, 11, 12), 'states/mid-level-import.css'),
                        asserters.stateCompletion('clover', createRange(11, 11, 11, 12), 'states/locally-imported-component-recursive.css'),
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
                    // asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                ]);
            });
        });
    });
})
