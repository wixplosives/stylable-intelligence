import * as asserters from './asserters';
import { createRange, ProviderRange } from '../../../src/lib/completion-providers'
import { Completion } from '../../../src/lib/completion-types';

describe('Named Values', function () {
    const str1 = 'shlomo';
    const str2 = 'momo';
    const str3 = 'poopy';
    const str4 = 'shmoopy';
    const path = "./import.st.css";

    [str1, str2, str3, str4].forEach((str, j, a) => {
        str.split('').forEach((c, i) => {

            const createComp = (str: string, rng: ProviderRange) => asserters.namedCompletion(
                str,
                rng,
                path,
                str === str4
                    ? 'pink'
                    : str === str3
                        ? 'brown'
                        : 'Stylable class'
            );
            let prefix = str.slice(0, i);

            it('completes classes and vars from imported file after -st-named, with prefix ' + prefix + ' ', function () {
                let rng = createRange(2, 15, 2, 15 + i);
                return asserters.getCompletions('named/st-named.st.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    if (prefix.length === 0) {
                        a.forEach(c => exp.push(createComp(c, rng)))
                    } else {
                        a.forEach(c => {
                            if (c.startsWith(prefix)) {
                                exp.push(createComp(c, rng))
                            } else {
                                notExp.push(createComp(c, rng));
                            }
                        })
                    }
                    asserter.suggested(exp);
                    asserter.notSuggested(notExp);
                });
            });

            it('completes names after single value, with prefix ' + prefix + ' ', function () {
                let rng = createRange(2, 22, 2, 22 + i);
                return asserters.getCompletions('named/st-named-single-value.st.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    if (prefix.length === 0) {
                        a.forEach(c => { if (c !== str1) { exp.push(createComp(c, rng)) } })
                    } else {
                        a.forEach(c => {
                            if (c.startsWith(prefix) && c !== str1) {
                                exp.push(createComp(c, rng))
                            } else {
                                notExp.push(createComp(c, rng));
                            }
                        })
                    }
                    asserter.suggested(exp);
                    asserter.notSuggested(notExp);
                });
            });

            it('completes names after multiple values, with prefix ' + prefix + ' ', function () {
                let rng = createRange(2, 29, 2, 29 + i);
                return asserters.getCompletions('named/st-named-multi-values.st.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    if (prefix.length === 0) {
                        a.forEach(c => { if (c !== str1 && c !== str3) { exp.push(createComp(c, rng)) } })
                    } else {
                        a.forEach(c => {
                            if (c.startsWith(prefix) && c !== str1 && c !== str3) {
                                exp.push(createComp(c, rng))
                            } else {
                                notExp.push(createComp(c, rng));
                            }
                        })
                    }
                    asserter.suggested(exp);
                    asserter.notSuggested(notExp);
                });
            });

            it('completes names on second line, with prefix ' + prefix + ' ', function () {
                let rng = createRange(3, 4, 3, 4 + i);
                return asserters.getCompletions('named/st-named-multi-line.st.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    if (prefix.length === 0) {
                        a.forEach(c => { if (c !== str1 && c !== str3) { exp.push(createComp(c, rng)) } })
                    } else {
                        a.forEach(c => {
                            if (c.startsWith(prefix) && c !== str1 && c !== str3) {
                                exp.push(createComp(c, rng))
                            } else {
                                notExp.push(createComp(c, rng));
                            }
                        })
                    }
                    asserter.suggested(exp);
                    asserter.notSuggested(notExp);
                });
            });
        });
    });

    const str5 = 'aMixin';
    const str6 = 'aFormatter';

    [str5, str6].forEach((str, j, a) => {
        str.split('').forEach((c, i) => {
            let prefix = str.slice(0, i);
            let rng = createRange(2, 15, 2, 15 + i);
            const path = "../mixins/js-mixins.js";

            const createComp = (str: string, rng: ProviderRange) => asserters.namedCompletion(str, rng, path, 'Mixin')
            xit('Completes names of functions from JS imports, with prefix ' + prefix + ' ', function () {
                return asserters.getCompletions('named/st-named-mixin.st.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    if (prefix.length <= 1) {
                        exp.push(createComp(str5, rng))
                        exp.push(createComp(str6, rng))
                    } else {
                        exp.push(createComp(str, rng))
                        notExp.push(createComp(str===str5 ? str6 : str5, rng))
                    }

                    asserter.suggested(exp);
                    asserter.notSuggested(notExp);
                });
            })

        })
    })
});

// Does not complete names that appear in later lines
