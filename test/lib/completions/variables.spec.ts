import * as asserters from './asserters';
import { createRange } from '../../../src/lib/completion-providers'

describe('Variables', function () {
    describe('from path', () => {
        describe('value()', function () {

            'value('.split('').map((c, i) => {
                let prefix = 'value('.slice(0, i);

                it('should be completed inside rule value, with prefix ' + prefix + ' ', function () {
                    return asserters.getCompletions('variables/local-vars.st.css', prefix).then((asserter) => {
                        asserter.suggested([
                            asserters.valueDirective(createRange(6, 10, 6, 11 + i)),
                        ]);
                    });
                });

                it('should be completed inside rule value when other values exist, with prefix ' + prefix + ' ', function () {
                    return asserters.getCompletions('variables/local-vars-several-values.st.css', prefix).then((asserter) => {
                        asserter.suggested([
                            asserters.valueDirective(createRange(6, 25, 6, 26 + i)),
                        ]);
                    });
                });

                it('should be completed inside rule value inside a complex selector, with prefix ' + prefix + ' ', function () {
                    return asserters.getCompletions('variables/complex-selector.st.css', prefix).then((asserter) => {
                        asserter.suggested([
                            asserters.valueDirective(createRange(15, 10, 15, 11 + i)),
                        ]);
                    });
                });
            });

            it('should not be completed for st-directives', function () {
                return asserters.getCompletions('variables/directive.st.css').then((asserter) => {
                    asserter.notSuggested([
                        asserters.valueDirective(createRange(6, 17, 6, 17)),
                    ]);
                });
            });

            it('should not be completed inside other value()', function () {
                return asserters.getCompletions('variables/inside-value-local-vars.st.css').then((asserter) => {
                    asserter.notSuggested([
                        asserters.valueDirective(createRange(6, 23, 6, 23)),
                    ]);
                });

            });
        })

        describe('Inside value()', function () {
            const str1 = 'color1';
            const str2 = 'color2';

            str1.split('').forEach((c, i) => {
                let prefix = str1.slice(0, i);
                it('Local variables should be completed, with prefix ' + prefix + ' ', function () {
                    return asserters.getCompletions('variables/inside-value-local-vars.st.css', prefix).then((asserter) => {
                        asserter.suggested([
                            asserters.valueCompletion(str1, createRange(6, 27, 6, 27 + i), 'red', 'Local variable'),
                            asserters.valueCompletion(str2, createRange(6, 27, 6, 27 + i), 'blue', 'Local variable'),
                        ])
                    });
                });

                it('Imported variables should be completed, with prefix ' + prefix + ' ', function () {
                    return asserters.getCompletions('variables/inside-value-imported-vars.st.css', prefix).then((asserter) => {
                        asserter.suggested([
                            asserters.valueCompletion(str1, createRange(6, 27, 6, 27 + i), 'red', './import.st.css'),
                            asserters.valueCompletion(str2, createRange(6, 27, 6, 27 + i), 'blue', './import.st.css'),
                        ])
                    });
                });

                it('Variable being defined should not be completed, with prefix ' + prefix + ' ', function () {
                    return asserters.getCompletions('variables/inside-value-defined-var.st.css', prefix).then((asserter) => {
                        asserter.suggested([
                            asserters.valueCompletion(str1, createRange(6, 20, 6, 20 + i), 'red', './import.st.css'),
                            asserters.valueCompletion(str2, createRange(6, 20, 6, 20 + i), 'blue', './import.st.css'),
                        ]);
                        asserter.notSuggested([
                            asserters.valueCompletion('localvar', createRange(6, 20, 6, 20 + i), 'cyclic value', 'Local variable'),
                        ])

                    });
                });
            });
        });
    });

    describe('from node_modules', () => {
        describe('value()', function () {
            const importedValue = 'color1';

            importedValue.split('').forEach((c, i) => {
                let prefix = importedValue.slice(0, i);

                it('completes named variable imports in a declaration , with prefix ' + prefix + ' ', function () {
                    return asserters.getCompletions('imports/from-package/value.st.css', prefix).then((asserter) => {
                        asserter.suggested([
                            asserters.valueCompletion(importedValue, createRange(6, 17, 6, 17 + i), 'goldenrod', "fake-stylable-package/stylesheet.st.css")
                        ]);
                    });
                });
            });
        });
    });
});

