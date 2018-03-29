import * as asserters from '../../test-kit/asserters';
import { createRange } from '../../src/lib/completion-providers';

describe('Completions', function () {
    describe('Stylesheet Top Level', function () {
        it('should complete ONLY import and vars directive, root and existing classes at top level', function () {
            return asserters.getCompletions('general/top-level-existing-classes.st.css').then((asserter) => {
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
            return asserters.getCompletions('general/top-level-existing-classes-broken.st.css').then((asserter) => {
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
            return asserters.getCompletions('general/top-level-dot.st.css').then((asserter) => {
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

        it('should complete named imports used locally only once', function () {
            return asserters.getCompletions('general/top-level-import-and-local.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.rootClassCompletion(createRange(9, 0, 9, 0)),
                    asserters.classCompletion('btn', (createRange(9, 0, 9, 0))),
                    asserters.varsDirectiveCompletion((createRange(9, 0, 9, 0))),
                    asserters.importDirectiveCompletion(createRange(9, 0, 9, 0)),
                    asserters.namespaceDirectiveCompletion(createRange(9, 0, 9, 0)),
                ]);
                asserter.notSuggested([
                    asserters.statesDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.extendsDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.mixinDirectiveCompletion(createRange(0, 0, 0, 0)),
                    asserters.variantDirectiveCompletion(createRange(0, 0, 0, 0)),
                ])
            });
        });

        it('should complete classes and tags, but not root, in non-initial selector chunks', function () {
            return asserters.getCompletions('general/non-initial-chunk.st.css').then((asserter) => {
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
            return asserters.getCompletions('general/no-completions.st.css');
        });
    });

    describe('Multiple Files', function () {

        it('complete states for localy imported component', function () {
            return asserters.getCompletions('states/locally-imported-component.st.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.stateSelectorCompletion('shmover', createRange(10, 5, 10, 6), './comp-to-import.st.css')
                    ]);
                });
        });

        it('complete states for localy imported component (including local states)', function () {
            return asserters.getCompletions('states/locally-imported-component-with-states.st.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.stateSelectorCompletion('shmover', createRange(11, 5, 11, 6), './comp-to-import.st.css'),
                        asserters.stateSelectorCompletion('clover', createRange(11, 5, 11, 6)),
                    ]);
                });
        });

        it('complete states for localy imported component ( recursive )', function () {
            return asserters.getCompletions('states/locally-imported-component-recursive.st.css')
                .then((asserter) => {
                    asserter.suggested([
                        asserters.stateSelectorCompletion('shmover', createRange(11, 11, 11, 12), './comp-to-import.st.css'),
                        asserters.stateSelectorCompletion('hoover', createRange(11, 11, 11, 12), './mid-level-import.st.css'),
                        asserters.stateSelectorCompletion('clover', createRange(11, 11, 11, 12)),
                    ]);
                });
        });
    });

    // describe.only('Missing Files', function() {
    //     it('Should not break when import file is missing', function() {
    //         return asserters.getCompletions('general/missing-import.st.css').then((asserter) => {
    //             asserter.exactSuggested([]);
    //         });
    //     })
    // })
})
