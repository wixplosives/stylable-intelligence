import StylableDotCompletionProvider, { Completion, snippet, ExtendedResolver } from '../src/provider'
import { Resolver, Stylesheet } from 'stylable'
import * as _ from 'lodash';
import { expect } from "chai";
import * as asserters from '../test-kit/asserters';

describe('Imports', function () {

    it('should complete :import at top level after ""', function () {
        return asserters.getCompletions('imports/top-level-no-chars.css').then((asserter) => {
                asserter.suggested([
                    asserters.importCompletion
                ]);
                asserter.notSuggested([
                ]);
            });
    });

    it('should complete :import at top level after ":"', function () {
        return asserters.getCompletions('imports/top-level-colon.css').then((asserter) => {
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
        return asserters.getCompletions('imports/top-level-import-exists.css').then((asserter) => {
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
        return asserters.getCompletions('imports/top-level-colon-colon.css').then((asserter) => {
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
        return asserters.getCompletions('imports/inside-simple-selector.css').then((asserter) => {
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
        return asserters.getCompletions('imports/inside-import-selector.css').then((asserter) => {
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
        return asserters.getCompletions(
            `
                :import{
                    -st-from:|
                }

                `, {
                'file1.js': '',
                'file2.css': ''
            }, true).then((asserter) => {

                asserter.suggested([
                    asserters.filePathCompletion('file1'),
                    asserters.filePathCompletion('file2.css')
                ]);

            });
    });

    it('should not complete -st-from, -st-default, -st-named inside import statements when exists', function () {
        return asserters.getCompletions('imports/inside-import-selector-with-fields.css').then((asserter) => {

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
