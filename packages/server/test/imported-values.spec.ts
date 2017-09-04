import * as asserters from '../test-kit/asserters';

describe('Imported Values', function () {
    it('completes default and named imports in -st-extends', function () {
        return asserters.getCompletions('imports/st-extends.css', true).then((asserter) => {
            asserter.suggested([
                asserters.extendsCompletion('Comp'),
                asserters.extendsCompletion('shlomo')
            ]);
            asserter.notSuggested([
                asserters.importCompletion,
                asserters.mixinDirectiveCompletion
            ]);
        });
    });

    it('completes named and default imports in -st-extends when a following ; exists', function () {
        return asserters.getCompletions('imports/st-extends-with-semicolon.css').then((asserter) => {
            asserter.suggested([
                asserters.extendsCompletion('Comp'),
                asserters.extendsCompletion('shlomo')
            ]);
            asserter.notSuggested([
                asserters.importCompletion,
                asserters.mixinDirectiveCompletion
            ]);
        });
    });

    it('completes named and default imports as initial selectors', function () {
        return asserters.getCompletions('imports/st-extends-selectors.css').then((asserter) => {
            asserter.suggested([
                asserters.classCompletion('Comp',true),
                asserters.classCompletion('shlomo'),
                asserters.importCompletion
            ]);
            asserter.notSuggested([
                asserters.mixinDirectiveCompletion
            ]);
        });
    });

    it('completes named and default imports as non-initial selectors', function () {
        return asserters.getCompletions('imports/st-extends-complex-selectors.css').then((asserter) => {
            asserter.suggested([
                asserters.classCompletion('shlomo'),
                asserters.classCompletion('Comp',true),
            ]);
            asserter.notSuggested([
                asserters.importCompletion,
                asserters.mixinDirectiveCompletion,
            ]);
        });
    });

});
