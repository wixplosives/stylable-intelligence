import * as asserters from '../test-kit/asserters';
import { createRange, ProviderRange } from '../src/completion-providers';
import { Completion } from '../src/index';

describe('Pseudo-elements', function () {

    describe('Deafult import used as tag', function () {

        const str1 = '::shlomo';
        const str2 = '::momo';
        const createComp = (str: string, rng: ProviderRange) => asserters.pseudoElementCompletion(str.slice(2), rng, './import.st.css');

        [str1, str2].forEach((str, j, a) => {

            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);

                it('should complete pseudo-element ' + a[j] + ' after class with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(6, 4, 6, 4 + i);

                    return asserters.getCompletions('pseudo-elements/default-import-as-tag.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after CSS state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(9, 10, 9, 10 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-as-tag-css-state.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after imported state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(9, 10, 9, 10 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-as-tag-imported-state.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should not complete pseudo-element ' + a[j] + ' if a pseudo-element exists with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(5, 12, 5, 12 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-as-tag-pseudo-element-exists.st.css', prefix).then((asserter) => {
                        let notExp: Partial<Completion>[] = [];

                        notExp.push(createComp(a[0], rng));
                        notExp.push(createComp(a[1], rng));

                        asserter.notSuggested(notExp);
                    });
                });
            });
        });
    });

    describe('Deafult import extended by class', function () {

        const str1 = '::shlomo';
        const str2 = '::momo';
        const createComp = (str: string, rng: ProviderRange) => asserters.pseudoElementCompletion(str.slice(2), rng, './import.st.css');

        [str1, str2].forEach((str, j, a) => {

            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);

                it('should complete pseudo-element ' + a[j] + ' after class with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 5, 10, 5 + i);

                    return asserters.getCompletions('pseudo-elements/default-import-extended.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after local state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(11, 10, 11, 10 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-extended-local-state.st.css', prefix).then((asserter) => {

                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after CSS state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 12, 10, 12 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-extended-css-state.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after imported state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 12, 10, 12 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-extended-imported-state.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should not complete pseudo-element ' + a[j] + ' if a pseudo-element exists with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(6, 4, 6, 6 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-extended-pseudo-element-exists.st.css', prefix).then((asserter) => {
                        let notExp: Partial<Completion>[] = [];

                        notExp.push(createComp(a[0], rng));
                        notExp.push(createComp(a[1], rng));

                        asserter.notSuggested(notExp);
                    });
                });
            });
        });
    });

    describe('Named import extended by class', function () {

        const str1 = '::shlomo';
        const str2 = '::momo';
        const createComp = (str: string, rng: ProviderRange) => asserters.pseudoElementCompletion(str.slice(2), rng, './mid-import.st.css');

        [str1, str2].forEach((str, j, a) => {

            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);

                it('should complete pseudo-element ' + a[j] + ' after class with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 5, 10, 5 + i);

                    return asserters.getCompletions('pseudo-elements/named-import-extended.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after local state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 16, 10, 16 + i);
                    return asserters.getCompletions('pseudo-elements/named-import-extended-local-state.st.css', prefix).then((asserter) => {

                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after CSS state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 13, 10, 13 + i);
                    return asserters.getCompletions('pseudo-elements/named-import-extended-css-state.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after imported state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 16, 10, 16 + i);
                    return asserters.getCompletions('pseudo-elements/named-import-extended-imported-state.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should not complete pseudo-element ' + a[j] + ' if a pseudo-element exists with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(6, 4, 6, 6 + i);
                    return asserters.getCompletions('pseudo-elements/default-import-extended-pseudo-element-exists.st.css', prefix).then((asserter) => {
                        let notExp: Partial<Completion>[] = [];

                        notExp.push(createComp(a[0], rng));
                        notExp.push(createComp(a[1], rng));

                        asserter.notSuggested(notExp);
                    });
                });
            });
        });

        it('should not complete root pseudo-elements on class extending named import', function () {
            return asserters.getCompletions('pseudo-elements/named-import-extended.st.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('bobo', createRange(9, 5, 9, 5), './import.st.css'),
                ]);
            });
        })
    });

    describe('Recursive imports', function () {
        const str1 = '::shlomo';
        const str2 = '::momo';
        const createComp = (str: string, rng: ProviderRange) => asserters.pseudoElementCompletion(str.slice(2), rng, './recursive-import-1.st.css');

        [str1, str2].forEach((str, j, a) => {

            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);

                it('should complete pseudo-element ' + a[j] + ' after pseudo-element with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 11, 10, 11 + i);

                    return asserters.getCompletions('pseudo-elements/recursive-import-3.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after CSS state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 16, 10, 16 + i);
                    return asserters.getCompletions('pseudo-elements/recursive-import-3-css-state.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                it('should complete pseudo-element ' + a[j] + ' after imported state with prefix: ' + prefix + ' ', function () {
                    let rng = createRange(10, 17, 10, 17 + i);
                    return asserters.getCompletions('pseudo-elements/recursive-import-3-imported-state.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        exp.push(createComp(a[j], rng));
                        if (prefix.length <= 2) {
                            exp.push(createComp(a[1 - j], rng));
                        } else {
                            notExp.push(createComp(a[1 - j], rng));
                        }

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                });

                    it('should not complete pseudo-element ' + a[j] + ' if a pseudo-element exists with prefix: ' + prefix + ' ', function () {
                        let rng = createRange(0,0,0,0);
                        return asserters.getCompletions('pseudo-elements/recursive-import-3-pseudo-element-exists.st.css', prefix).then((asserter) => {
                            let notExp: Partial<Completion>[] = [];

                            notExp.push(createComp(a[0], rng));
                            notExp.push(createComp(a[1], rng));

                            asserter.notSuggested(notExp);
                        });
                    });
            });
        });
    });
});
