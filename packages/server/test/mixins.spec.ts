import * as asserters from '../test-kit/asserters';
import { createRange, ProviderRange } from '../src/completion-providers';
import { Completion } from '../src/completion-types';


describe('Mixin values', function () {

    const str1 = 'momo';
    const from1 = './recursive-import-1.st.css'
    const str2 = 'shlomo';
    const from2 = './recursive-import-1.st.css'
    const str3 = 'Comp';
    const from3 = './recursive-import-2.st.css'
    const str4 = 'local';
    const from4 = 'Local file';
    const froms = [from1, from2, from3, from4];

    const createComp = (str: string, rng: ProviderRange, path: string) => asserters.mixinCompletion(str, rng, path);

    [str1, str2, str3, str4].forEach((str, j, a) => {
        str.split('').forEach((c, i) => {
            let prefix = str.slice(0, i);
            let rng = createRange(15, 15, 15, 15 + i);

            it('should complete local and imported classes, with prefix ' + prefix, function () {
                return asserters.getCompletions('pseudo-elements/recursive-import-3-mixin.st.css', prefix).then((asserter) => {
                    let exp: Partial<Completion>[] = [];
                    let notExp: Partial<Completion>[] = [];

                    if (i === 0) {
                        a.forEach((comp, k) => exp.push(createComp(a[k], rng, froms[k])))
                    } else {
                        exp.push(createComp(str, rng, froms[j]));
                        a.forEach((comp, k) => {
                            if (comp!==str) {
                                notExp.push(createComp(a[k], rng, froms[k]))
                            }
                        })
                    }

                    asserter.suggested(exp);
                    asserter.notSuggested(notExp);
                });
            });
        });
    });
});
