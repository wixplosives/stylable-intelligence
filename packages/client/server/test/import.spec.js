"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserters = require("../test-kit/asserters");
describe('Imports', function () {
    it('should complete :import at top level after ""', function () {
        return asserters.getCompletions("|\n            .gaga{\n                color:red;\n            }\n            ").then(function (asserter) {
            asserter.suggested([
                asserters.importCompletion
            ]);
            asserter.notSuggested([]);
        });
    });
    it('should complete :import at top level after ":"', function () {
        return asserters.getCompletions(":|\n            .gaga{\n                color:red;\n            }\n            ").then(function (asserter) {
            asserter.suggested([
                asserters.importCompletion
            ]);
            asserter.notSuggested([
                asserters.rootCompletion,
                asserters.classCompletion('gaga'),
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.mixinDirectiveCompletion,
                asserters.variantDirectiveCompletion
            ]);
        });
    });
    it('should complete :import at top level even if exists', function () {
        return asserters.getCompletions(":import {\n                    -st-from: \"./x\";\n                    -st-default: X;\n                    -st-named: a, b;\n            }\n            :|\n            .gaga{\n                color:red;\n            }\n            ").then(function (asserter) {
            asserter.suggested([
                asserters.importCompletion,
            ]);
            asserter.notSuggested([
                asserters.rootCompletion,
                asserters.classCompletion('gaga'),
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.mixinDirectiveCompletion,
                asserters.variantDirectiveCompletion
            ]);
        });
    });
    it('should not complete :import after ::', function () {
        return asserters.getCompletions(".baga {\n                color: red;\n            }\n\n            ::|\n            ").then(function (asserter) {
            asserter.suggested([]);
            asserter.notSuggested([
                asserters.importCompletion,
                asserters.rootCompletion,
                asserters.classCompletion('gaga'),
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.mixinDirectiveCompletion,
                asserters.variantDirectiveCompletion
            ]);
        });
    });
    it('should not complete :import inside import statements', function () {
        return asserters.getCompletions("\n                :import{\n                    |\n                }\n\n                ", {}, true).then(function (asserter) {
            asserter.suggested([
                asserters.importFromDirectiveCompletion,
                asserters.importDefaultDirectiveCompletion,
                asserters.importNamedDirectiveCompletion
            ]);
            asserter.notSuggested([
                asserters.importCompletion,
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.variantDirectiveCompletion,
                asserters.mixinDirectiveCompletion
            ]);
        });
    });
    it('should complete -st-from, -st-default, -st-named inside import statements', function () {
        return asserters.getCompletions("\n                :import{\n                    -|\n                }\n\n                ", {}, true).then(function (asserter) {
            asserter.suggested([
                asserters.importFromDirectiveCompletion,
                asserters.importDefaultDirectiveCompletion,
                asserters.importNamedDirectiveCompletion
            ]);
            asserter.notSuggested([
                asserters.statesDirectiveCompletion,
                asserters.extendsDirectiveCompletion,
                asserters.variantDirectiveCompletion,
                asserters.mixinDirectiveCompletion
            ]);
        });
    });
    xit('should complete -st-from value from files in dir', function () {
        return asserters.getCompletions("\n                :import{\n                    -st-from:|\n                }\n\n                ", {
            'file1.js': '',
            'file2.css': ''
        }, true).then(function (asserter) {
            asserter.suggested([
                asserters.filePathCompletion('file1'),
                asserters.filePathCompletion('file2.css')
            ]);
        });
    });
    it('should not complete -st-from, -st-default, -st-named inside import statements when exists', function () {
        return asserters.getCompletions("\n                :import{\n                    -st-from: \"./x\";\n                    -st-default: X;\n                    -st-named: a, b;\n                    -|\n                }\n                ", {}, true).then(function (asserter) {
            asserter.notSuggested([
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
//# sourceMappingURL=import.spec.js.map