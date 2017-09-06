import * as asserters from '../test-kit/asserters';
import { createRange } from '../src/completion-providers'

describe('Imported Values', function () {
        it('completes default and named imports in -st-extends', function () {
            return asserters.getCompletions('imports/st-extends.css').then((asserter) => {
                asserter.suggested([
                    asserters.extendsCompletion('Comp',createRange(7,16,7,16)),
                    asserters.extendsCompletion('shlomo',createRange(7,16,7,16))
                ]);
            });
        });

        it('completes named and default imports in -st-extends when a following ; exists', function () {
            return asserters.getCompletions('imports/st-extends-with-semicolon.css').then((asserter) => {
                asserter.suggested([
                    asserters.extendsCompletion('Comp',createRange(7,16,7,16)),
                    asserters.extendsCompletion('shlomo',createRange(7,16,7,16))
                ]);
            });
        });

        it('completes named and default imports as initial selectors', function () {
            return asserters.getCompletions('imports/st-extends-selectors.css').then((asserter) => {
                asserter.suggested([
                    asserters.classCompletion('Comp',createRange(6,0,6,0), true),
                    asserters.classCompletion('shlomo',createRange(6,0,6,0)),
                    asserters.importDirectiveCompletion(createRange(6,0,6,0))
                ]);
            });
        });

        it('completes named and default imports as non-initial selectors', function () {
            return asserters.getCompletions('imports/st-extends-complex-selectors.css').then((asserter) => {
                asserter.suggested([
                    asserters.classCompletion('shlomo', createRange(6,6,6,6)),
                    asserters.classCompletion('Comp', createRange(6,6,6,6), true),
                ]);
            });
        });

    });
