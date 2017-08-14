"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserters = require("../test-kit/asserters");
xdescribe('completion unit test', function () {
    describe('root level', function () {
        it('should complete ONLY import directive, root and existing classes at top level', function () {
            return asserters.getCompletions("\n            .gaga{\n                color:red;\n            }\n            |\n            .baga{\n\n            }\n            ").then(function (asserter) {
                asserter.suggested([
                    asserters.importCompletion,
                    asserters.rootCompletion,
                    asserters.classCompletion('gaga')
                ]);
                asserter.notSuggested([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
        it('should complete root and existing classes at top level after "."', function () {
            return asserters.getCompletions("\n            .|\n\n            .gaga{\n                color:red;\n            }\n            ").then(function (asserter) {
                asserter.suggested([
                    asserters.rootCompletion,
                    asserters.classCompletion('gaga')
                ]);
                asserter.notSuggested([
                    asserters.importCompletion,
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
            return asserters.getCompletions("\n            .gaga{\n                |\n            }\n            ", {}, true).then(function (asserter) {
                asserter.suggested([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
        it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules after dash', function () {
            return asserters.getCompletions("\n            .gaga{\n                -|\n                color:red;\n            }\n\n            ", {}, true).then(function (asserter) {
                asserter.suggested([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
        it('should not complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules when exists', function () {
            return asserters.getCompletions("\n            .gaga{\n                -st-states: a, b;\n                -st-extends: Comp;\n                -st-mixin: MixA;\n                -st-variant: BigButton;\n                -|\n            }\n\n            ", {}, true).then(function (asserter) {
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
                "\n            .gaga:hover{\n                |\n            }\n            ",
                "\n            .gaga.baga{\n                |\n            }\n            ",
                "\n            .gaga div{\n                |\n            }\n            ",
                "\n            .gaga > div{\n                |\n            }\n            ",
                "\n            div.baga{\n                |\n            }\n            ",
                "\n            @media(max-width:200){\n                div.baga{\n                    |\n                }\n            }\n            "
            ].map(function (src) {
                it('complex rule ' + src.slice(0, src.indexOf('{')), function () {
                    return asserters.getCompletions(src, {}, true).then(function (asserter) {
                        asserter.suggested([
                            asserters.mixinDirectiveCompletion
                        ]);
                        asserter.notSuggested([
                            asserters.statesDirectiveCompletion,
                            asserters.extendsDirectiveCompletion,
                            asserters.variantDirectiveCompletion
                        ]);
                    });
                });
            });
        });
    });
    describe('states', function () {
        it('should complete available states after :', function () {
            return asserters.getCompletions("\n                .gaga{\n                    -st-states:hello;\n                }\n                .gaga:|\n                ", {}, true).then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('hello')
                ]);
                asserter.notSuggested([
                    asserters.importCompletion
                ]);
            });
        });
        it('should not break for untyped classes', function () {
            return asserters.getCompletions("\n            .gaga{\n            }\n            .gaga:|\n            ", {}, true).then(function (asserter) {
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.stateCompletion('hello')
                ]);
            });
        });
        it('should complete available states after : in complex selectors', function () {
            return asserters.getCompletions("\n                .gaga{\n                    -st-states:hello;\n                }\n                .zagzag{\n                    -st-states:goodbye;\n                }\n                .baga{\n                    -st-states:cheerio;\n                }\n                .zagzag button.gaga:hover:| .baga\n                ", {}, true).then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('hello')
                ]);
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.stateCompletion('goodbye'),
                    asserters.stateCompletion('cheerio')
                ]);
            });
        });
        it('should not complete available states after : in complex selectors if existing', function () {
            return asserters.getCompletions("\n                .gaga{\n                    -st-states:hello;\n                }\n                .zagzag button.gaga:hello:| .baga\n                ", {}, true).then(function (asserter) {
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.stateCompletion('hello')
                ]);
            });
        });
    });
    describe('multiple files', function () {
        it('allow extending component css file', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from:\"./comp.css\";\n                    -st-default:Comp;\n                }\n                .gaga{\n                    -st-extends:|\n                }\n                ", {
                'comp.css': ""
            }, true).then(function (asserter) {
                asserter.suggested([
                    asserters.extendsCompletion('Comp')
                ]);
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.mixinDirectiveCompletion
                ]);
            });
        });
        it('allow extending component css file (with existing ;)', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from:\"./comp.css\";\n                    -st-default:Comp;\n                }\n                .gaga{\n                    -st-extends:| ;\n                }\n                ", {
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
                asserter.suggested([
                    asserters.extendsCompletion('Comp', range)
                ]);
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.mixinDirectiveCompletion
                ]);
            });
        });
        it('complete states for localy imported component', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from: \"./comp.css\";\n                    -st-default: Comp;\n\n                }\n                .gaga{\n                    -st-extends: Comp;\n                }\n                .gaga:|\n                ", {
                'comp.css': "\n                            .root{\n                                -st-states:shmover;\n                            }\n                        "
            }, true).then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                ]);
            });
        });
        it('complete states for localy imported component (including local states)', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from: \"./comp.css\";\n                    -st-default: Comp;\n\n                }\n                .gaga{\n                    -st-extends: Comp;\n                    -st-states: hello;\n                }\n                .gaga:|\n                ", {
                'comp.css': "\n                            .root{\n                                -st-states:shmover;\n                            }\n                        "
            }, true).then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css'),
                    asserters.stateCompletion('hello')
                ]);
            });
        });
        it('complete states for localy imported component ( recursive )', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from: \"./comp2.css\";\n                    -st-default: Comp;\n                }\n                .gaga{\n                    -st-extends: Comp;\n                    -st-states: normalstate;\n                }\n                .gaga:|\n                ", {
                'comp1.css': "\n                            .root{\n                                -st-states:recursestate;\n                            }\n                    ",
                'comp2.css': "\n                        :import{\n                            -st-from: \"./comp1.css\";\n                            -st-default: Zag;\n                        }\n                        .root{\n                            -st-extends:Zag;\n                            -st-states:importedstate;\n                        }\n                    "
            }, true).then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('importedstate', 'projectRoot/comp2.css'),
                    asserters.stateCompletion('recursestate', 'projectRoot/comp1.css'),
                    asserters.stateCompletion('normalstate')
                ]);
            });
        });
        xit('complete states for localy imported variant', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from: \"./comp.css\";\n                    -st-named: zagzag;\n\n                }\n                .gaga{\n                    -st-extends: zagzag;\n                }\n                .gaga:|\n                ", {
                'comp.css': "\n                            .root{\n                                -st-states:shmover;\n                            }\n                            .zagzag{\n                                -st-variant:true;\n                            }\n                        "
            }, true).then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                ]);
            });
        });
        it('should not break while typing', function () {
            return asserters.getCompletions("\n                .|\n                .gaga{\n                    -st-states:hello;\n                }\n                .gaga:hello{\n\n                }\n                ", {
                'comp.css': ""
            }, false).then(function (asserter) {
                asserter.suggested([
                    asserters.classCompletion('gaga')
                ]);
            });
        });
        it('should not complete when broken', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from:\"./comp.css\";\n                    -st-default:Comp;\n                }\n                .gaga{\n                    -st-extends::| ;\n                }\n                ", {
                'comp.css': ""
            }, true).then(function (asserter) {
                asserter.notSuggested([
                    asserters.extendsCompletion('Comp'),
                    asserters.importCompletion,
                    asserters.mixinDirectiveCompletion
                ]);
            });
        });
    });
});
//# sourceMappingURL=completion.spec.js.map