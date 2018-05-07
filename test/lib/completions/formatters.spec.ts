import * as asserters from './asserters';
import { createRange, ProviderRange } from '../../../src/lib/completion-providers';
import { Completion } from '../../../src/lib/completion-types';


describe('Formatters', function () {

    const ts_formatter_1 = 'paramlessFormatter';
    const ts_formatter_2 = 'formatterWithParams';
    const js_formatter_1 = 'aFormatter';
    const js_formatter_2 = 'aFormatterWithParams';
    const ts_mixin_1 = 'paramlessMixin';
    const ts_mixin_2 = 'aBareMixin';
    const js_mixin_1 = 'aMixin';
    const js_mixin_2 = 'aBareMixin';
    const str4 = 'aMixin';
    const badStr = 'notARealMixin'
    const badJsStr = 'aFormatter'
    const tsFrom = './my-mixins.ts';
    const jsFrom = './js-mixins.js';
    const createComp = (str: string, rng: ProviderRange, path: string) => asserters.codeMixinCompletion(str, rng, path);


    describe('TS Formatters', function () {

        [ts_formatter_1, ts_formatter_2].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);
                it('should complete imported TS formatters, but not mixins, with prefix ' + prefix, function () {
                    let rng = createRange(12, 11, 12, 11 + i);
                    return asserters.getCompletions('mixins/imported-formatters.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        if (i === 0) {
                            exp.push(createComp(ts_formatter_1, rng, tsFrom))
                            exp.push(createComp(ts_formatter_2, rng, tsFrom))
                        }
                        else if (str === ts_formatter_1) {
                            exp.push(createComp(ts_formatter_1, rng, tsFrom))
                            notExp.push(createComp(ts_formatter_2, rng, tsFrom))
                        } else {
                            exp.push(createComp(ts_formatter_2, rng, tsFrom))
                            notExp.push(createComp(ts_formatter_1, rng, tsFrom))
                        }
                        notExp.push(createComp(ts_mixin_1, rng, tsFrom))
                        notExp.push(createComp(ts_mixin_2, rng, tsFrom))

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                }).timeout(10000);

                it('should complete imported TS formatters after value, with prefix ' + prefix, function () {
                    let rng = createRange(11, 49, 11, 49 + i);
                    return asserters.getCompletions('mixins/imported-formatters-single-value.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        if (i === 0) {
                            exp.push(createComp(ts_formatter_1, rng, tsFrom))
                            exp.push(createComp(ts_formatter_2, rng, tsFrom))
                        }
                        else if (str === ts_formatter_1) {
                            exp.push(createComp(ts_formatter_1, rng, tsFrom))
                            notExp.push(createComp(ts_formatter_2, rng, tsFrom))
                        } else {
                            exp.push(createComp(ts_formatter_2, rng, tsFrom))
                            notExp.push(createComp(ts_formatter_1, rng, tsFrom))
                        }
                        notExp.push(createComp(ts_mixin_1, rng, tsFrom))
                        notExp.push(createComp(ts_mixin_2, rng, tsFrom))

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                }).timeout(10000);

            });
        });
    })

    describe('JS Formatters', function () {

        [js_formatter_1, js_formatter_2].forEach((str, j, a) => {
            str.split('').forEach((c, i) => {
                let prefix = str.slice(0, i);
                it('should complete imported JS formatters, but not mixins, with prefix ' + prefix, function () {
                    let rng = createRange(12, 11, 12, 11 + i);
                    return asserters.getCompletions('mixins/imported-formatters.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        if (i <= js_formatter_1.length) {
                            exp.push(createComp(js_formatter_1, rng, jsFrom))
                        } else {
                            notExp.push(createComp(js_formatter_1, rng, jsFrom))
                        }
                        exp.push(createComp(js_formatter_2, rng, jsFrom))

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                }).timeout(10000);

                it('should complete imported JS formatters after value, with prefix ' + prefix, function () {
                    let rng = createRange(11, 49, 11, 49 + i);
                    return asserters.getCompletions('mixins/imported-formatters-single-value.st.css', prefix).then((asserter) => {
                        let exp: Partial<Completion>[] = [];
                        let notExp: Partial<Completion>[] = [];

                        if (i <= js_formatter_1.length) {
                            exp.push(createComp(js_formatter_1, rng, jsFrom))
                        } else {
                            notExp.push(createComp(js_formatter_1, rng, jsFrom))
                        }
                        exp.push(createComp(js_formatter_2, rng, jsFrom))

                        asserter.suggested(exp);
                        asserter.notSuggested(notExp);
                    });
                }).timeout(10000);

            });
        });

        it('should complete formatters inside a mixin param list', function () {
            return asserters.getCompletions('mixins/imported-mixins-in-param-list.st.css').then((asserter) => {
                let rng = createRange(0, 0, 0, 0);
                let notExp: Partial<Completion>[] = [];

                notExp.push(createComp('paramlessMixin', rng, tsFrom))
                notExp.push(createComp('paramfulMixin', rng, tsFrom))
                notExp.push(createComp('aMixin', rng, jsFrom))
                notExp.push(createComp('aBareMixin', rng, jsFrom))

                asserter.notSuggested(notExp);
            });
        })
    })

});

