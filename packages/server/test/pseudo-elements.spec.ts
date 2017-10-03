import * as asserters from '../test-kit/asserters';
import { createRange, ProviderRange } from '../src/completion-providers';
import { Completion } from '../src/index';

describe('Pseudo-elements', function () {
    describe('general', function () {
        it('should complete pseudo-element after local state', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended-local-state.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(11, 10, 11, 10), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(11, 10, 11, 10), './import.st.css'),
                ]);
            });
        });
    });

    describe('Deafult import used as tag', function () {
        it('should complete pseudo-element ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 4), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 4), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after : ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 5), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 5), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag-colon-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 6), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 6), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: + initial string ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag-colon-colon-letter.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 7), './import.st.css'),
                ]);
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 7), './import.st.css'),
                ]);
            });
        });

        it('should not complete pseudo-element if one exists ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag-pseudo-element-exists.st.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 6), './import.st.css'),
                    asserters.pseudoElementCompletion('lol', createRange(6, 4, 6, 6), './import.st.css'),
                ]);
            });
        });
    });

    describe('Deafult import extended by class', function () {
        it('should complete pseudo-element ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('momo', createRange(10, 5, 10, 5), './import.st.css'),
                    asserters.pseudoElementCompletion('shlomo', createRange(10, 5, 10, 5), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after : ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(10, 5, 10, 6), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(10, 5, 10, 6), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended-colon-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(10, 5, 10, 7), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(10, 5, 10, 7), './import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: + initial string ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended-colon-colon-letter.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(10, 5, 10, 8), './import.st.css'),
                ]);
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('momo', createRange(10, 5, 10, 8), './import.st.css'),
                ]);
            });
        });

        it('should not complete pseudo-element if one exists ', function () {
            return asserters.getCompletions('pseudo-elements/default-import-extended-pseudo-element-exists.st.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 6), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 6), './import.st.css'),
                ]);
            });
        });


        describe('*** Pseudos with prefix', function () {

            const str1 = '::shlomo';
            const str2 = '::momo';
            const createComp = (str: string, rng: ProviderRange) => asserters.pseudoElementCompletion(str.slice(2), rng, './import.st.css');

            [str1, str2].forEach((str, j, a) => {

                str.split('').forEach((c, i) => {
                    let prefix = str.slice(0, i);

                    it('should complete pseudo-element ' +a[j] + ' after local state with prefix: ' + prefix + ' ', function () {
                        let rng = createRange(10, 11, 10, 11 + i);
                        return asserters.getCompletions('pseudo-elements/default-import-local-state.st.css', prefix).then((asserter) => {

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

                    it('should complete pseudo-element ' +a[j] + ' after CSS state with prefix: ' + prefix + ' ', function () {
                        let rng = createRange(10, 12, 10, 12 + i);
                        return asserters.getCompletions('pseudo-elements/default-import-css-state.st.css', prefix).then((asserter) => {
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

                    it('should complete pseudo-element ' +a[j] + ' after imported state with prefix: ' + prefix + ' ', function () {
                        let rng = createRange(10, 12, 10, 12 + i);
                        return asserters.getCompletions('pseudo-elements/default-import-imported-state.st.css', prefix).then((asserter) => {
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

                });

            });


        });




    });

    describe('Named import extended by class', function () {
        it('should not complete root pseudo-elements on class extending named import', function () {
            return asserters.getCompletions('pseudo-elements/named-import-extended.st.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('bobo', createRange(9, 5, 9, 5), './import.st.css'),
                ]);
            });
        })

        it('should complete pseudo-element ', function () { //multifile
            return asserters.getCompletions('pseudo-elements/named-import-extended.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('momo', createRange(9, 5, 9, 5), './mid-import.st.css'),
                    asserters.pseudoElementCompletion('shlomo', createRange(9, 5, 9, 5), './mid-import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after : ', function () { //multifile
            return asserters.getCompletions('pseudo-elements/named-import-extended-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(9, 5, 9, 6), './mid-import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(9, 5, 9, 6), './mid-import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: ', function () { //multifile
            return asserters.getCompletions('pseudo-elements/named-import-extended-colon-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(9, 5, 9, 7), './mid-import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(9, 5, 9, 7), './mid-import.st.css'),
                ]);
            });
        });

        it('should complete pseudo-element after :: + initial string ', function () { //multifile
            return asserters.getCompletions('pseudo-elements/named-import-extended-colon-colon-letter.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(9, 5, 9, 8), './mid-import.st.css'),
                ]);
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('momo', createRange(9, 5, 9, 8), './mid-import.st.css'),
                ]);
            });
        });

        it('should not complete pseudo-element if one exists ', function () { //multifile
            return asserters.getCompletions('pseudo-elements/named-import-extended-pseudo-element-exists.st.css').then((asserter) => {
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(6, 4, 6, 6), './import.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(6, 4, 6, 6), './import.st.css'),
                ]);
            });
        });
    });

    describe('Recursive imports', function () {
        it('Should complete inner pseudo-elements', function () {
            return asserters.getCompletions('pseudo-elements/recursive-import-3.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(10, 11, 10, 11), './recursive-import-2.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(10, 11, 10, 11), './recursive-import-2.st.css'),
                ]);
            });
        })

        it('Should complete inner pseudo-elements after : ', function () {
            return asserters.getCompletions('pseudo-elements/recursive-import-3-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(9, 11, 9, 12), './recursive-import-2.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(9, 11, 9, 12), './recursive-import-2.st.css'),
                ]);
            });
        })

        it('Should complete inner pseudo-elements after :: ', function () {
            return asserters.getCompletions('pseudo-elements/recursive-import-3-colon-colon.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(9, 11, 9, 13), './recursive-import-2.st.css'),
                    asserters.pseudoElementCompletion('momo', createRange(9, 11, 9, 13), './recursive-import-2.st.css'),
                ]);
            });
        })

        it('Should complete inner pseudo-elements after :: + initial string ', function () {
            return asserters.getCompletions('pseudo-elements/recursive-import-3-colon-colon-letter.st.css').then((asserter) => {
                asserter.suggested([
                    asserters.pseudoElementCompletion('shlomo', createRange(9, 11, 9, 14), './recursive-import-2.st.css'),
                ]);
                asserter.notSuggested([
                    asserters.pseudoElementCompletion('momo', createRange(9, 11, 9, 14), './recursive-import-2.st.css'),
                ]);
            });
        })
    })
});
