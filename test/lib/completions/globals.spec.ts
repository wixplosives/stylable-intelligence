import * as asserters from './asserters';
import { createRange, ProviderRange } from '../../../src/lib/completion-providers';
import { Completion } from '../../../src/lib/completion-types';

describe('Global scope reference', () => {
    const str = ':global()';
    const createComp = (rng: ProviderRange) => asserters.globalCompletion(rng);

    str.split('').forEach((c, i) => {
        const prefix = str.slice(0, i);
        it('should be completed at top level, with prefix ' + prefix, () => {
            const rng = createRange(0, 0, 0, 0 + i);
            return asserters.getCompletions('imports/top-level.st.css', prefix).then(asserter => {
                const exp: Array<Partial<Completion>> = [];

                exp.push(createComp(rng));

                asserter.suggested(exp);
            });
        });

        it('should be completed at top level after element, with prefix ' + prefix, () => {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag.st.css', prefix).then(asserter => {
                const rng = createRange(6, 4, 6, 4 + i);
                const exp: Array<Partial<Completion>> = [];

                exp.push(createComp(rng));

                asserter.suggested(exp);
            });
        });

        it('should be completed inside custom selector definition, with prefix ' + prefix, () => {
            return asserters.getCompletions('custom-selectors/inside-selector-def.st.css', prefix).then(asserter => {
                const rng = createRange(8, 39, 8, 39 + i);
                const exp: Array<Partial<Completion>> = [];

                exp.push(createComp(rng));

                asserter.suggested(exp);
            });
        });
    });
});
