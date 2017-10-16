import * as asserters from '../test-kit/asserters';
import { createRange, ProviderRange } from '../src/completion-providers';
import { Completion } from '../src/completion-types';

describe('Custom Selectors', function () {

    describe('Local Selectors', function () {

        const str1 = ':--popo';
        const str2 = ':--pongo';
        const createComp = (str: string, rng: ProviderRange, path: string) => asserters.classCompletion(str, rng, true);

        [str1, str2].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);

                it('should be completed at top level, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(10, 0, 10, 0 + i);
                    return asserters.getCompletions('custom-selectors/local-selector.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng, 'custom-selectors/local-selector.st.css'));
                        if (prefix.length <= 5) {
                            exp.push(createComp(a[1 - j], rng, 'custom-selectors/local-selector.st.css'));
                        } else {
                            notExp.push(createComp(a[1 - j], rng, 'custom-selectors/local-selector.st.css'));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should be completed in complex selectors, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(10, 11, 10, 11 + i);
                    return asserters.getCompletions('custom-selectors/local-selector-complex.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng, 'custom-selectors/local-selector-complex.st.css'));
                        if (prefix.length <= 5) {
                            exp.push(createComp(a[1 - j], rng, 'custom-selectors/local-selector-complex.st.css'));
                        } else {
                            notExp.push(createComp(a[1 - j], rng, 'custom-selectors/local-selector-complex.st.css'));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

            });
        });

    });

    describe('Local Selectors with imported type', function () {

        const str1 = ':state';
        const str2 = ':otherState';
        const str3 = '::momo';
        const str4 = '::shlomo';


        [str1, str2].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);
                const createComp = (str: string, rng: ProviderRange, path: string) => asserters.stateCompletion(str.slice(1), rng, path);

                it('should have relevant states, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(10, 8, 10, 8 + i);
                    return asserters.getCompletions('pseudo-elements/custom-selector-local.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng, 'pseudo-elements/import.st.css'));
                        if (prefix.length <= 1) {
                            exp.push(createComp(a[1 - j], rng, 'pseudo-elements/import.st.css'));
                        } else {
                            notExp.push(createComp(a[1 - j], rng, 'pseudo-elements/import.st.css'));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });
            });
        });

        [str3, str4].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                const createComp = (str: string, rng: ProviderRange, path: string) => asserters.pseudoElementCompletion(str.slice(2), rng, path);
                let prefix = str.slice(0, i);

                it('should have relevant pseudo-elements, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(10, 8, 10, 8 + i);
                    return asserters.getCompletions('pseudo-elements/custom-selector-local.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng, './import.st.css'));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng, './import.st.css'));
                        } else {
                            notExp.push(createComp(a[1 - j], rng, './import.st.css'));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });
            });
        });
    });
});
