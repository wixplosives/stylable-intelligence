"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserters = require("../test-kit/asserters");
describe('completion unit test', function () {
    describe('root level', function () {
        it('should complete ONLY import directive, root and existing classes at top level', function () {
            return asserters.getCompletions('general/top-level-existing-classes.css').then(function (asserter) {
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
            return asserters.getCompletions('general/top-level-dot.css').then(function (asserter) {
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
        xit('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector', function () {
            return asserters.getCompletions('imports/inside-simple-selector.css').then(function (asserter) {
                asserter.suggested([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
        xit('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector after dash', function () {
            return asserters.getCompletions('general/inside-simple-selector-dash.css')
                .then(function (asserter) {
                asserter.suggested([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
        it('should not complete -st-states, -st-extends, -st-mixin, -st-variant inside simple selector when they exist', function () {
            return asserters.getCompletions('general/inside-simple-selector-with-all-st-fields.css').then(function (asserter) {
                asserter.notSuggested([
                    asserters.statesDirectiveCompletion,
                    asserters.extendsDirectiveCompletion,
                    asserters.mixinDirectiveCompletion,
                    asserters.variantDirectiveCompletion
                ]);
            });
        });
        //TODO: Split into small tests, or find way to do this with 1 file.
        describe('should not complete -st-states, -st-extends, -st-variant inside complex rules', function () {
            [
                'complex-selectors/class-and-class.css',
                'complex-selectors/class-and-descendant.css',
                'complex-selectors/class-and-tag.css',
                'complex-selectors/tag-and-class.css',
                'complex-selectors/class-and-state.css',
                'complex-selectors/media-query.css',
            ].map(function (src) {
                it('complex rule ' + src.slice(0, src.indexOf('{')), function () {
                    return asserters.getCompletions(src).then(function (asserter) {
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
        xit('should complete available states from same file after :', function () {
            return asserters.getCompletions('states/class-with-states.css').then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('hello', 'states/class-with-states.css'),
                    asserters.stateCompletion('goodbye', 'states/class-with-states.css')
                ]);
                asserter.notSuggested([
                    asserters.importCompletion
                ]);
            });
        });
        xit('should not break for untyped classes', function () {
            return asserters.getCompletions("\n            .gaga{\n            }\n            .gaga:|\n            ").then(function (asserter) {
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.stateCompletion('hello')
                ]);
            });
        });
        xit('should complete available states after : in complex selectors', function () {
            return asserters.getCompletions('states/complex-selectors-with-states.css').then(function (asserter) {
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
            return asserters.getCompletions('states/complex-selectors-with-states-existing.css').then(function (asserter) {
                asserter.notSuggested([
                    asserters.importCompletion,
                    asserters.stateCompletion('hello')
                ]);
            });
        });
    });
    xdescribe('multiple files', function () {
        it('complete states for localy imported component', function () {
            return asserters.getCompletions('states/locally-imported-component.css')
                .then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                ]);
            });
        });
        it('complete states for localy imported component (including local states)', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from: \"./comp.css\";\n                    -st-default: Comp;\n\n                }\n                .gaga{\n                    -st-extends: Comp;\n                    -st-states: hello;\n                }\n                .gaga:|\n                ").then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css'),
                    asserters.stateCompletion('hello')
                ]);
            });
        });
        it('complete states for localy imported component ( recursive )', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from: \"./comp2.css\";\n                    -st-default: Comp;\n                }\n                .gaga{\n                    -st-extends: Comp;\n                    -st-states: normalstate;\n                }\n                .gaga:|\n                ").then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('importedstate', 'projectRoot/comp2.css'),
                    asserters.stateCompletion('recursestate', 'projectRoot/comp1.css'),
                    asserters.stateCompletion('normalstate')
                ]);
            });
        });
        xit('complete states for localy imported variant', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from: \"./comp.css\";\n                    -st-named: zagzag;\n\n                }\n                .gaga{\n                    -st-extends: zagzag;\n                }\n                .gaga:|\n                ").then(function (asserter) {
                asserter.suggested([
                    asserters.stateCompletion('shmover', 'projectRoot/comp.css')
                ]);
            });
        });
        it('should not break while typing', function () {
            return asserters.getCompletions("\n                .|\n                .gaga{\n                    -st-states:hello;\n                }\n                .gaga:hello{\n\n                }\n                ").then(function (asserter) {
                asserter.suggested([
                    asserters.classCompletion('gaga')
                ]);
            });
        });
        it('should not complete when broken', function () {
            return asserters.getCompletions("\n                :import{\n                    -st-from:\"./comp.css\";\n                    -st-default:Comp;\n                }\n                .gaga{\n                    -st-extends::| ;\n                }\n                ").then(function (asserter) {
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