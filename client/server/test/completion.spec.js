"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserters = require("../test-kit/asserters");
describe('completion unit test', function () {
    describe('root level', function () {
        it('should complete import directive, root and existing classes at top level', function () {
            return asserters.completions("\n            .gaga{\n                color:red;\n            }\n            |\n            .baga{\n\n            }\n            ").then(function (asserter) {
                asserter.assertCompletions([
                    asserters.importCompletion,
                    asserters.rootCompletion,
                    asserters.classCompletion('gaga')
                ]);
                asserter.assertNoCompletions([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
        it('should complete root and existing classes at top level after "."', function () {
            return asserters.completions("\n            .|\n\n            .gaga{\n                color:red;\n            }\n            ").then(function (asserter) {
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
                ]);
            });
        });
        it('should complete :import at top level after ":"', function () {
            return asserters.completions(":|\n            .gaga{\n                color:red;\n            }\n            ").then(function (asserter) {
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
            return asserters.completions("\n            .gaga{\n                |\n            }\n            ", {}, true).then(function (asserter) {
                asserter.assertCompletions([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
        it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules after dash', function () {
            return asserters.completions("\n            .gaga{\n                -|\n                color:red;\n            }\n\n            ", {}, true).then(function (asserter) {
                asserter.assertCompletions([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
        it('should not complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules when exists', function () {
            return asserters.completions("\n            .gaga{\n                -st-states: a, b;\n                -st-extends: Comp;\n                -st-mixin: MixA;\n                -st-variant: BigButton;\n                -|\n            }\n\n            ", {}, true).then(function (asserter) {
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
                "\n            .gaga:hover{\n                |\n            }\n            ",
                "\n            .gaga.baga{\n                |\n            }\n            ",
                "\n            .gaga div{\n                |\n            }\n            ",
                "\n            .gaga > div{\n                |\n            }\n            ",
                "\n            div.baga{\n                |\n            }\n            ",
                "\n            @media(max-width:200){\n                div.baga{\n                    |\n                }\n            }\n            "
            ].map(function (src) {
                it('complex rule ' + src.slice(0, src.indexOf('{')), function () {
                    return asserters.completions(src, {}, true).then(function (asserter) {
                        asserter.assertCompletions([
                            asserters.mixinDirectiveCompletion
                        ]);
                        asserter.assertNoCompletions([
                            asserters.statesDirectiveCompletion,
                            asserters.extendsDirectiveCompletion,
                            asserters.variantDirectiveCompletion
                        ]);
                    });
                });
            });
        });
        describe('imports', function () {
            it('should complete -st-from, -st-default, -st-named inside import statements', function () {
                return asserters.completions("\n                :import{\n                    -|\n                }\n\n                ", {}, true).then(function (asserter) {
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
                return asserters.completions("\n                :import{\n                    -st-from:|\n                }\n\n                ", {
                    'file1.js': '',
                    'file2.css': ''
                }, true).then(function (asserter) {
                    asserter.assertCompletions([
                        asserters.filePathCompletion('file1'),
                        asserters.filePathCompletion('file2.css')
                    ]);
                });
            });
            it('should not complete -st-from, -st-default, -st-named inside import statements when exists', function () {
                return asserters.completions("\n                :import{\n                    -st-from: \"./x\";\n                    -st-default: X;\n                    -st-named: a, b;\n                    -|\n                }\n                ", {}, true).then(function (asserter) {
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
            return asserters.completions("\n                .gaga{\n                    -st-states:hello;\n                }\n                .gaga:|\n                ", {}, true).then(function (asserter) {
                asserter.assertCompletions([
                    asserters.stateCompletion('hello')
                ]);
                asserter.assertNoCompletions([
                    asserters.importCompletion
                ]);
            });
        });
        it('should not break for untyped classes', function () {
            return asserters.completions("\n            .gaga{\n            }\n            .gaga:|\n            ", {}, true).then(function (asserter) {
                asserter.assertNoCompletions([
                    asserters.importCompletion,
                    asserters.stateCompletion('hello')
                ]);
            });
        });
        it('should complete available states after : in complex selectors', function () {
            return asserters.completions("\n                .gaga{\n                    -st-states:hello;\n                }\n                .zagzag{\n                    -st-states:goodbye;\n                }\n                .baga{\n                    -st-states:cheerio;\n                }\n                .zagzag button.gaga:hover:| .baga\n                ", {}, true).then(function (asserter) {
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
            return asserters.completions("\n                .gaga{\n                    -st-states:hello;\n                }\n                .zagzag button.gaga:hello:| .baga\n                ", {}, true).then(function (asserter) {
                asserter.assertNoCompletions([
                    asserters.importCompletion,
                    asserters.stateCompletion('hello')
                ]);
            });
        });
    });
    describe('multiple files', function () {
        it('allow extending component css file', function () {
            return asserters.completions("\n                :import{\n                    -st-from:\"./comp.css\";\n                    -st-default:Comp;\n                }\n                .gaga{\n                    -st-extends:|\n                }\n                ", {
                'comp.css': ""
            }, true).then(function (asserter) {
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
            return asserters.completions("\n                :import{\n                    -st-from:\"./comp.css\";\n                    -st-default:Comp;\n                }\n                .gaga{\n                    -st-extends:| ;\n                }\n                ", {
                'comp.css': ""
            }, true).then(function (asserter) {
                var range = undefined;
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
            return asserters.completions("\n                :import{\n                    -st-from: \"./comp.css\";\n                    -st-default: Comp;\n\n                }\n                .gaga{\n                    -st-extends: Comp;\n                }\n                .gaga:|\n                ", {
                'comp.css': "\n                            .root{\n                                -st-states:shmover;\n                            }\n                        "
            }, true).then(function (asserter) {
                asserter.assertCompletions([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                ]);
            });
        });
        it('complete states for localy imported component (including local states)', function () {
            return asserters.completions("\n                :import{\n                    -st-from: \"./comp.css\";\n                    -st-default: Comp;\n\n                }\n                .gaga{\n                    -st-extends: Comp;\n                    -st-states: hello;\n                }\n                .gaga:|\n                ", {
                'comp.css': "\n                            .root{\n                                -st-states:shmover;\n                            }\n                        "
            }, true).then(function (asserter) {
                asserter.assertCompletions([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css'),
                    asserters.stateCompletion('hello')
                ]);
            });
        });
        it('complete states for localy imported component ( recursive )', function () {
            return asserters.completions("\n                :import{\n                    -st-from: \"./comp2.css\";\n                    -st-default: Comp;\n                }\n                .gaga{\n                    -st-extends: Comp;\n                    -st-states: normalstate;\n                }\n                .gaga:|\n                ", {
                'comp1.css': "\n                            .root{\n                                -st-states:recursestate;\n                            }\n                    ",
                'comp2.css': "\n                        :import{\n                            -st-from: \"./comp1.css\";\n                            -st-default: Zag;\n                        }\n                        .root{\n                            -st-extends:Zag;\n                            -st-states:importedstate;\n                        }\n                    "
            }, true).then(function (asserter) {
                asserter.assertCompletions([
                    asserters.stateCompletion('importedstate', 'projectRoot/comp2.css'),
                    asserters.stateCompletion('recursestate', 'projectRoot/comp1.css'),
                    asserters.stateCompletion('normalstate')
                ]);
            });
        });
        xit('complete states for localy imported variant', function () {
            return asserters.completions("\n                :import{\n                    -st-from: \"./comp.css\";\n                    -st-named: zagzag;\n\n                }\n                .gaga{\n                    -st-extends: zagzag;\n                }\n                .gaga:|\n                ", {
                'comp.css': "\n                            .root{\n                                -st-states:shmover;\n                            }\n                            .zagzag{\n                                -st-variant:true;\n                            }\n                        "
            }, true).then(function (asserter) {
                asserter.assertCompletions([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                ]);
            });
        });
        it('should not break while typing', function () {
            return asserters.completions("\n                .|\n                .gaga{\n                    -st-states:hello;\n                }\n                .gaga:hello{\n\n                }\n                ", {
                'comp.css': ""
            }, false).then(function (asserter) {
                asserter.assertCompletions([
                    asserters.classCompletion('gaga')
                ]);
            });
        });
        it('should not complete when broken', function () {
            return asserters.completions("\n                :import{\n                    -st-from:\"./comp.css\";\n                    -st-default:Comp;\n                }\n                .gaga{\n                    -st-extends::| ;\n                }\n                ", {
                'comp.css': ""
            }, true).then(function (asserter) {
                asserter.assertNoCompletions([
                    asserters.extendsCompletion('Comp'),
                    asserters.importCompletion,
                    asserters.mixinDirectiveCompletion
                ]);
            });
        });
    });
});
//# sourceMappingURL=completion.spec.js.map