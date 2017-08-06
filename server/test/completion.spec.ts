import StylableDotCompletionProvider, { Completion, snippet, ExtendedResolver, ProviderPosition, ProviderRange } from '../src/provider'
import { Resolver, Stylesheet } from 'stylable'
import * as _ from 'lodash';
import { expect } from "chai";
import { TestResolver } from '../test-kit/test-resolver';
import * as asserters from '../test-kit/asserters'

describe('completion unit test', function () {
    describe('root level', function () {
        it('should complete import directive, root and existing classes at top level', function () {
            return asserters.completions(`
            .gaga{
                color:red;
            }
            |
            .baga{

            }
            `).then((asserter) => {
                    asserter.assertCompletions(
                        [
                            asserters.importCompletion,
                            asserters.rootCompletion,
                            asserters.classCompletion('gaga')
                        ]
                    );
                    asserter.assertNoCompletions([
                        asserters.statesDirectiveCompletion,
                        asserters.extendsDirectiveCompletion,
                        asserters.mixinDirectiveCompletion,
                        asserters.variantDirectiveCompletion
                    ]);
                });
        });
        it('should complete root and existing classes at top level after "."', function () {
            return asserters.completions(
                `
            .|

            .gaga{
                color:red;
            }
            `).then((asserter) => {
                    asserter.assertCompletions([
                        asserters.rootCompletion,
                        asserters.classCompletion('gaga')
                    ]);
                    asserter.assertNoCompletions([
                        asserters.importCompletion,
                        asserters.statesDirectiveCompletion,
                        asserters.extendsDirectiveCompletion,
                        asserters.mixinDirectiveCompletion,
                        asserters.variantDirectiveCompletion
                    ])
                });
        });
        it('should complete :import at top level after ":"', function () {
            return asserters.completions(
                `:|
            .gaga{
                color:red;
            }
            `).then((asserter) => {

                    asserter.assertCompletions([
                        asserters.importCompletion

                    ]);
                    asserter.assertNoCompletions([
                        asserters.rootCompletion,
                        asserters.classCompletion('gaga'),
                        asserters.statesDirectiveCompletion,
                        asserters.extendsDirectiveCompletion,
                        asserters.mixinDirectiveCompletion,
                        asserters.variantDirectiveCompletion
                    ]);
                });
        });
    });
    describe('directives', function () {
        it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules', function () {
            return asserters.completions(
                `
            .gaga{
                |
            }
            `, {}, true).then((asserter) => {

                    asserter.assertCompletions([
                        asserters.statesDirectiveCompletion,
                        asserters.extendsDirectiveCompletion,
                        asserters.mixinDirectiveCompletion,
                        asserters.variantDirectiveCompletion
                    ]);

                });
        });

        it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules after dash', function () {
            return asserters.completions(
                `
            .gaga{
                -|
                color:red;
            }

            `, {}, true).then((asserter) => {

                    asserter.assertCompletions([
                        asserters.statesDirectiveCompletion,
                        asserters.extendsDirectiveCompletion,
                        asserters.mixinDirectiveCompletion,
                        asserters.variantDirectiveCompletion
                    ]);

                });
        });
        it('should not complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules when exists', function () {
            return asserters.completions(
                `
            .gaga{
                -st-states: a, b;
                -st-extends: Comp;
                -st-mixin: MixA;
                -st-variant: BigButton;
                -|
            }

            `, {}, true).then((asserter) => {

                    asserter.assertNoCompletions([
                        asserters.statesDirectiveCompletion,
                        asserters.extendsDirectiveCompletion,
                        asserters.mixinDirectiveCompletion,
                        asserters.variantDirectiveCompletion
                    ]);

                });
        });
        describe('should not complete -st-states, -st-extends, -st-variant inside complex rules', function () {
            [
                `
            .gaga:hover{
                |
            }
            `,
                `
            .gaga.baga{
                |
            }
            `,
                `
            .gaga div{
                |
            }
            `,
                `
            .gaga > div{
                |
            }
            `,
                `
            div.baga{
                |
            }
            `,
                `
            @media(max-width:200){
                div.baga{
                    |
                }
            }
            `
            ].map((src) => {

                it('complex rule ' + src.slice(0, src.indexOf('{')), function () {
                    return asserters.completions(src, {}, true).then((asserter) => {
                        asserter.assertCompletions([
                            asserters.mixinDirectiveCompletion
                        ])
                        asserter.assertNoCompletions([
                            asserters.statesDirectiveCompletion,
                            asserters.extendsDirectiveCompletion,
                            asserters.variantDirectiveCompletion
                        ]);

                    });
                })
            });


        });
        describe('imports', function () {
            it('should complete -st-from, -st-default, -st-named inside import statements', function () {
                return asserters.completions(
                    `
                :import{
                    -|
                }

                `, {}, true).then((asserter) => {

                        asserter.assertCompletions([
                            asserters.importFromDirectiveCompletion,
                            asserters.importDefaultDirectiveCompletion,
                            asserters.importNamedDirectiveCompletion
                        ]);
                        asserter.assertNoCompletions([
                            asserters.statesDirectiveCompletion,
                            asserters.extendsDirectiveCompletion,
                            asserters.variantDirectiveCompletion,
                            asserters.mixinDirectiveCompletion
                        ]);
                    });
            });
            xit('should complete -st-from value from files in dir', function () {
                return asserters.completions(
                    `
                :import{
                    -st-from:|
                }

                `, {
                        'file1.js': '',
                        'file2.css': ''
                    }, true).then((asserter) => {

                        asserter.assertCompletions([
                            asserters.filePathCompletion('file1'),
                            asserters.filePathCompletion('file2.css')
                        ]);

                    });
            });

            it('should not complete -st-from, -st-default, -st-named inside import statements when exists', function () {
                return asserters.completions(
                    `
                :import{
                    -st-from: "./x";
                    -st-default: X;
                    -st-named: a, b;
                    -|
                }
                `, {}, true).then((asserter) => {

                        asserter.assertNoCompletions([
                            asserters.importFromDirectiveCompletion,
                            asserters.importDefaultDirectiveCompletion,
                            asserters.importNamedDirectiveCompletion,
                            asserters.statesDirectiveCompletion,
                            asserters.extendsDirectiveCompletion,
                            asserters.variantDirectiveCompletion,
                            asserters.mixinDirectiveCompletion
                        ]);
                    });
            });
        });
    });
    describe('states', function () {
        it('should complete available states after :', function () {
            return asserters.completions(
                `
                .gaga{
                    -st-states:hello;
                }
                .gaga:|
                `, {}, true).then((asserter) => {
                    asserter.assertCompletions([
                        asserters.stateCompletion('hello')
                    ]);
                    asserter.assertNoCompletions([
                        asserters.importCompletion
                    ]);
                });
        });
        it('should not break for untyped classes', function () {
            return asserters.completions(
                `
            .gaga{
            }
            .gaga:|
            `, {}, true).then((asserter) => {

                    asserter.assertNoCompletions([
                        asserters.importCompletion,
                        asserters.stateCompletion('hello')
                    ]);
                });
        });
        it('should complete available states after : in complex selectors', function () {
            return asserters.completions(
                `
                .gaga{
                    -st-states:hello;
                }
                .zagzag{
                    -st-states:goodbye;
                }
                .baga{
                    -st-states:cheerio;
                }
                .zagzag button.gaga:hover:| .baga
                `, {}, true).then((asserter) => {
                    asserter.assertCompletions([
                        asserters.stateCompletion('hello')
                    ]);
                    asserter.assertNoCompletions([
                        asserters.importCompletion,
                        asserters.stateCompletion('goodbye'),
                        asserters.stateCompletion('cheerio')
                    ]);
                });
        });
        it('should not complete available states after : in complex selectors if existing', function () {
            return asserters.completions(
                `
                .gaga{
                    -st-states:hello;
                }
                .zagzag button.gaga:hello:| .baga
                `, {}, true).then((asserter) => {
                    asserter.assertNoCompletions([
                        asserters.importCompletion,
                        asserters.stateCompletion('hello')

                    ]);
                });
        });
    });

    describe('multiple files', function () {
        it('allow extending component css file', function () {
            return asserters.completions(
                `
                :import{
                    -st-from:"./comp.css";
                    -st-default:Comp;
                }
                .gaga{
                    -st-extends:|
                }
                `, {
                    'comp.css': ``
                }, true).then((asserter) => {
                    asserter.assertCompletions([
                        asserters.extendsCompletion('Comp')
                    ]);
                    asserter.assertNoCompletions([
                        asserters.importCompletion,
                        asserters.mixinDirectiveCompletion
                    ]);
                });
        });

        it('allow extending component css file (with existing ;)', function () {
            return asserters.completions(
                `
                :import{
                    -st-from:"./comp.css";
                    -st-default:Comp;
                }
                .gaga{
                    -st-extends:| ;
                }
                `, {
                    'comp.css': ``
                }, true).then((asserter) => {
                    const range = undefined;
                    /* TODO: add range, see that works in vscode */
                    // {
                    //     start:{
                    //         line:6,
                    //         character:13
                    //     },
                    //     end:{
                    //         line:6,
                    //         character:15
                    //     }
                    // }
                    asserter.assertCompletions([
                        asserters.extendsCompletion('Comp', range)
                    ]);
                    asserter.assertNoCompletions([
                        asserters.importCompletion,
                        asserters.mixinDirectiveCompletion
                    ]);
                });
        });

        it('complete states for localy imported component', function () {
            return asserters.completions(
                `
                :import{
                    -st-from: "./comp.css";
                    -st-default: Comp;

                }
                .gaga{
                    -st-extends: Comp;
                }
                .gaga:|
                `,
                {
                    'comp.css': `
                            .root{
                                -st-states:shmover;
                            }
                        `
                }, true).then((asserter) => {
                    asserter.assertCompletions([
                        asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                    ]);
                });
        });

        it('complete states for localy imported component (including local states)', function () {
            return asserters.completions(
                `
                :import{
                    -st-from: "./comp.css";
                    -st-default: Comp;

                }
                .gaga{
                    -st-extends: Comp;
                    -st-states: hello;
                }
                .gaga:|
                `,
                {
                    'comp.css': `
                            .root{
                                -st-states:shmover;
                            }
                        `
                }, true).then((asserter) => {
                    asserter.assertCompletions([
                        asserters.stateCompletion('shmover', 'projectRoot/comp.css'),
                        asserters.stateCompletion('hello')
                    ]);
                });
        });


        it('complete states for localy imported component ( recursive )', function () {
            return asserters.completions(
                `
                :import{
                    -st-from: "./comp2.css";
                    -st-default: Comp;
                }
                .gaga{
                    -st-extends: Comp;
                    -st-states: normalstate;
                }
                .gaga:|
                `,
                {
                    'comp1.css': `
                            .root{
                                -st-states:recursestate;
                            }
                    `,
                    'comp2.css': `
                        :import{
                            -st-from: "./comp1.css";
                            -st-default: Zag;
                        }
                        .root{
                            -st-extends:Zag;
                            -st-states:importedstate;
                        }
                    `
                }, true).then((asserter) => {
                    asserter.assertCompletions([
                        asserters.stateCompletion('importedstate', 'projectRoot/comp2.css'),
                        asserters.stateCompletion('recursestate', 'projectRoot/comp1.css'),
                        asserters.stateCompletion('normalstate')
                    ]);
                });
        });
        xit('complete states for localy imported variant', function () {
            return asserters.completions(
                `
                :import{
                    -st-from: "./comp.css";
                    -st-named: zagzag;

                }
                .gaga{
                    -st-extends: zagzag;
                }
                .gaga:|
                `,
                {
                    'comp.css': `
                            .root{
                                -st-states:shmover;
                            }
                            .zagzag{
                                -st-variant:true;
                            }
                        `
                }, true).then((asserter) => {
                    asserter.assertCompletions([
                        asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                    ]);
                });
        });


        it('should not break while typing', function () {
            return asserters.completions(
                `
                .|
                .gaga{
                    -st-states:hello;
                }
                .gaga:hello{

                }
                `, {
                    'comp.css': ``
                }, false).then((asserter) => {
                    asserter.assertCompletions([
                        asserters.classCompletion('gaga')
                    ]);
                });
        });

        it('should not complete when broken', function () {
            return asserters.completions(
                `
                :import{
                    -st-from:"./comp.css";
                    -st-default:Comp;
                }
                .gaga{
                    -st-extends::| ;
                }
                `, {
                    'comp.css': ``
                }, true).then((asserter) => {
                    asserter.assertNoCompletions([
                        asserters.extendsCompletion('Comp'),
                        asserters.importCompletion,
                        asserters.mixinDirectiveCompletion
                    ]);
                });
        });
    });
})
