import * as asserters from '../test-kit/asserters';
import { createRange, ProviderRange } from '../src/completion-providers'
import { Completion } from '../src/completion-types';

describe('Imported Values', function () {

    const str1 = 'Comp';
    const str2 = 'shlomo';
    const str3 = '.shlomo';


    [str1, str2].forEach((str, j, a) => {
        str.split('').forEach((c, i) => {

            const createComp = (str: string, rng: ProviderRange) => asserters.extendsCompletion(str, rng);
            let prefix = str.slice(0, i);

            it('completes default and named imports in -st-extends, with prefix ' + prefix + ' ', function () {
                let rng = createRange(7, 16, 7, Number.MAX_VALUE);
                return asserters.getCompletions('imports/st-extends.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    exp.push(createComp(a[j], rng));
                    if (prefix.length === 0) {
                        exp.push(createComp(a[1 - j], rng));
                    } else {
                        notExp.push(createComp(a[1 - j], rng));
                    }

                    asserter.suggested(exp);
                    asserter.notSuggested(notExp);
                });
            });

            it('completes named and default imports in -st-extends with final ; , with prefix ' + prefix + ' ', function () {
                let rng = createRange(7, 16, 7, Number.MAX_VALUE);
                return asserters.getCompletions('imports/st-extends-with-semicolon.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    exp.push(createComp(a[j], rng));
                    if (prefix.length === 0) {
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

    [str1, str3].forEach((str, j, a) => {
        str.split('').forEach((c, i) => {

            const createComp = (str: string, rng: ProviderRange) => asserters.classCompletion(str, rng, true);
            let prefix = str.slice(0, i);

            it('completes named and default imports as initial selectors, with prefix ' + prefix + ' ', function () {
                let rng = createRange(6, 0, 6, i);
                return asserters.getCompletions('imports/st-extends-selectors.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    exp.push(createComp(a[j], rng));
                    if (prefix.length === 0) {
                        exp.push(createComp(a[1 - j], rng));
                    } else {
                        notExp.push(createComp(a[1 - j], rng));
                    }

                    asserter.suggested(exp);
                    asserter.notSuggested(notExp);
                });
            });

            it('completes named and default imports as non-initial selectors, with prefix ' + prefix + ' ', function () {
                let rng = createRange(6, 6, 6, 6 + i);
                return asserters.getCompletions('imports/st-extends-complex-selectors.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    exp.push(createComp(a[j], rng));
                    if (prefix.length === 0) {
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
