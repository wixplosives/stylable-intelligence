import * as asserters from '../../test-kit/asserters';
import { createRange, ProviderRange } from '../../src/server/completion-providers';
import { Completion } from '../../src/server/completion-types';


describe('Global scope reference', function () {

    const str = ':global()';
    const createComp = (rng: ProviderRange) => asserters.globalCompletion(rng);

    str.split('').forEach((c, i) => {
        let prefix = str.slice(0, i);
        it('should be completed at top level, with prefix ' + prefix, function () {
            let rng = createRange(0, 0, 0, 0 + i);
            return asserters.getCompletions('imports/top-level.st.css', prefix).then((asserter) => {
                let exp: Partial<Completion>[] = [];

                exp.push(createComp(rng));

                asserter.suggested(exp);
            });
        });

        it('should be completed at top level after element, with prefix ' + prefix, function () {
            return asserters.getCompletions('pseudo-elements/default-import-as-tag.st.css', prefix).then((asserter) => {
                let rng = createRange(6, 4, 6, 4 + i);
                let exp: Partial<Completion>[] = [];

                exp.push(createComp(rng));

                asserter.suggested(exp);
            });
        });

        it('should be completed inside custom selector definition, with prefix ' + prefix, function () {
            return asserters.getCompletions('custom-selectors/inside-selector-def.st.css', prefix).then((asserter) => {
                let rng = createRange(8, 39, 8, 39 + i);
                let exp: Partial<Completion>[] = [];

                exp.push(createComp(rng));

                asserter.suggested(exp);
            });
        });

    });
});
