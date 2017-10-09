import * as asserters from '../test-kit/asserters';
import { createRange, ProviderRange } from '../src/completion-providers';
import { Completion } from '../src/completion-types';

describe('States', function () {

    describe('Local states', function () {

        const str1 = ':hello';
        const str2 = ':goodbye';
        const str3 = ':holla';
        const createComp = (str: string, rng: ProviderRange, path: string) => asserters.stateCompletion(str.slice(1), rng, path);

        [str1, str2].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);

                it('should complete available states from same file, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(4, 5, 4, 5 + i);
                    return asserters.getCompletions('states/class-with-states.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng, './states/class-with-states.css'));
                        if (prefix.length <= 1) {
                            exp.push(createComp(a[1 - j], rng, './states/class-with-states.css'));
                        } else {
                            notExp.push(createComp(a[1 - j], rng, './states/class-with-states.css'));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete available states after in complex selectors, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(9, 19, 9, 19 + i);
                    return asserters.getCompletions('states/complex-selectors.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        if (str === str1) {
                            exp.push(createComp(str1, rng, './states/complex-selectors.css'));
                        } else if (prefix.length <= 1) {
                            exp.push(createComp(str1, rng, './states/complex-selectors.css'));
                        }
                        notExp.push(createComp(str2, rng, './states/complex-selectors.css'));

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });
            });
        });

        [str1, str3].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);

                it('should complete only unused states in complex selectors ending in state name, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(9, 25, 9, 25 + i);
                    return asserters.getCompletions('states/complex-selectors-with-states.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        if (str === str1) {
                            exp.push(createComp(str1, rng, './states/complex-selectors-with-states.css'));
                        } else if (prefix.length <= 2) {
                            exp.push(createComp(str1, rng, './states/complex-selectors-with-states.css'));
                        }
                        notExp.push(createComp(str3, rng, './states/complex-selectors-with-states.css'));

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });
            });
        });

        it('should not complete state value after :: ', function () {
            return asserters.getCompletions('states/class-with-states-double-colon.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.stateCompletion('hello', createRange(0, 0, 0, 0)),
                    asserters.stateCompletion('goodbye', createRange(0, 0, 0, 0))
                ]);
            });
        });
    });

    describe('Imported states', function () {

        const str1 = ':state';
        const str2 = ':otherState';
        const str3 = ':anotherState';
        const str4 = ':oneMoreState';

        const createComp = (str: string, rng: ProviderRange, path: string) => asserters.stateCompletion(str.slice(1), rng, path);

        [str1, str2].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);

                it('should complete state ' + str + ' value for default import used as tag, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(6, 4, 6, 4 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-as-tag.st.css', prefix).then((asserter) => {
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

                it('should complete state ' + str + ' value for local class extending default import, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(10, 5, 10, 5 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-extended.st.css', prefix).then((asserter) => {
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
                let prefix = str.slice(0, i);

                it('should complete state ' + str + ' value for local class extending named import, with prefix ' + prefix + ' ', function () {
                    let rng = createRange(9, 5, 9, 5 + i);
                    return asserters.getCompletions('pseudo-elements/named-import-extended-named.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng, 'pseudo-elements/import.st.css'));
                        if (prefix.length <= 1) {
                            exp.push(createComp(a[1 - j], rng, 'pseudo-elements/import.st.css'));
                        } else {
                            notExp.push(createComp(a[1 - j], rng, 'pseudo-elements/import.st.css'));
                        }
                        notExp.push(createComp(str1, rng, 'pseudo-elements/import.st.css'));
                        notExp.push(createComp(str2, rng, 'pseudo-elements/import.st.css'));

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });
            });
        });

        [str1, str2].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                let rng = createRange(10, 11, 10, 11 + i);
                let prefix = str.slice(0, i);
                it('should complete pseudo-element state ' + str + ' after pseudo-element, with prefix ' + prefix + ' ', function () {
                    return asserters.getCompletions('pseudo-elements/recursive-import-3.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng, 'pseudo-elements/recursive-import-1.st.css'));
                        if (prefix.length <= 1) {
                            exp.push(createComp(a[1 - j], rng, 'pseudo-elements/recursive-import-1.st.css'));
                        } else {
                            notExp.push(createComp(a[1 - j], rng, 'pseudo-elements/recursive-import-1.st.css'));
                        }
                        notExp.push(createComp(str3, rng, 'pseudo-elements/recursive-import-1.st.css'));
                        notExp.push(createComp(str4, rng, 'pseudo-elements/recursive-import-1.st.css'));

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });
            });
        });

        [str3, str4].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);
                it('should complete only unused pseudo-element states when pseudo-element state exists, with prefix ' + prefix + ' ', function () {
                let rng = createRange(9, 25, 9, 25 + i);
                    return asserters.getCompletions('pseudo-elements/multiple-states.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        if (prefix.length <= 1 || str === str4) {
                            exp.push(createComp(str4, rng, 'pseudo-elements/import.st.css'));
                        }
                        notExp.push(createComp(str1, rng, 'pseudo-elements/import.st.css'));
                        notExp.push(createComp(str2, rng, 'pseudo-elements/import.st.css'));
                        notExp.push(createComp(str3, rng, 'pseudo-elements/import.st.css'));

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });
            });
        });
    });
});
