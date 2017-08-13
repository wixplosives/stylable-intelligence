import StylableDotCompletionProvider, { Completion, snippet, ExtendedResolver } from '../src/provider'
import { Resolver, Stylesheet } from 'stylable'
import * as _ from 'lodash';
import { expect } from "chai";
import * as asserters from '../test-kit/asserters';

describe('Imports', function () {

    it.only('should complete :import at top level after ""', function () {
        // console.log('d/f: ', __dirname, __filename);
        return asserters.getCompletions(__dirname + '/cases/top-level-1.css').then((asserter) => {
                asserter.suggested([
                    asserters.importCompletion
                ]);
                asserter.notSuggested([
                ]);
            });
    });

    it('should complete :import at top level after ":"', function () {
        return asserters.getCompletions(
            `:|
            .gaga{
                color:red;
            }
            `).then((asserter) => {
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
        return asserters.getCompletions(
            `:import {
                    -st-from: "./x";
                    -st-default: X;
                    -st-named: a, b;
            }
            :|
            .gaga{
                color:red;
            }
            `).then((asserter) => {
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
        return asserters.getCompletions(
            `.baga {
                color: red;
            }

            ::|
            `).then((asserter) => {
                asserter.suggested([
                ]);
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
        return asserters.getCompletions(
            `
                :import{
                    |
                }

                `, {}, true).then((asserter) => {

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
        return asserters.getCompletions(
            `
                :import{
                    -|
                }

                `, {}, true).then((asserter) => {

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
        return asserters.getCompletions(
            `
                :import{
                    -st-from: "./x";
                    -st-default: X;
                    -st-named: a, b;
                    -|
                }
                `, {}, true).then((asserter) => {

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
