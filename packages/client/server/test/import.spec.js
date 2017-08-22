"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserters = require("../test-kit/asserters");
describe.only('Imports', function () {
    it('should complete :import at top level after ""', function () {
        return asserters.getCompletions('imports/top-level-no-chars.css').then(function (asserter) {
            asserter.suggested([
                asserters.importCompletion
            ]);
            asserter.notSuggested([]);
        });
    });
    it('should complete :import at top level after ":"', function () {
        return asserters.getCompletions('imports/top-level-colon.css').then(function (asserter) {
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
        return asserters.getCompletions('imports/top-level-import-exists.css').then(function (asserter) {
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
        return asserters.getCompletions('imports/top-level-colon-colon.css').then(function (asserter) {
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
    it('should not complete :import inside selectors', function () {
        return asserters.getCompletions('imports/inside-simple-selector.css').then(function (asserter) {
            asserter.suggested([]);
            asserter.notSuggested([
                asserters.importFromDirectiveCompletion,
                asserters.importDefaultDirectiveCompletion,
                asserters.importNamedDirectiveCompletion,
                asserters.importCompletion
            ]);
        });
    });
    it('should complete -st-from, -st-default, -st-named inside import statements', function () {
        return asserters.getCompletions('imports/inside-import-selector.css').then(function (asserter) {
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
    it('should complete -st-from value from files in dir', function () {
        return asserters.getCompletions('imports/st-from.css').then(function (asserter) {
            asserter.suggested([
                asserters.filePathCompletion('import-from-here.css')
            ]);
        });
    });
    it('should not complete -st-from, -st-default, -st-named inside import statements when exists', function () {
        return asserters.getCompletions('imports/inside-import-selector-with-fields.css').then(function (asserter) {
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
    it('completes default import in -st-extends', function () {
        return asserters.getCompletions('imports/st-extends.css', true).then(function (asserter) {
            asserter.suggested([
                asserters.extendsCompletion('Comp')
            ]);
            asserter.notSuggested([
                asserters.importCompletion,
                asserters.mixinDirectiveCompletion
            ]);
        });
    });
    it.only('completes named import in -st-extends', function () {
        return asserters.getCompletions('imports/st-extends.css', true).then(function (asserter) {
            asserter.suggested([
                asserters.extendsCompletion('shlomo')
            ]);
            asserter.notSuggested([
                asserters.importCompletion,
                asserters.mixinDirectiveCompletion
            ]);
        });
    });
    it('completes name imported as default when a following ; exists', function () {
        return asserters.getCompletions('imports/st-extends-with-semicolon.css').then(function (asserter) {
            asserter.suggested([
                asserters.extendsCompletion('Comp')
            ]);
            asserter.notSuggested([
                asserters.importCompletion,
                asserters.mixinDirectiveCompletion
            ]);
        });
    });
});
//# sourceMappingURL=import.spec.js.map