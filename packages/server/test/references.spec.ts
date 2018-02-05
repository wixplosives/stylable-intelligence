import { createRange } from '../src/completion-providers';
import * as asserters from '../test-kit/asserters';
import { expect } from 'chai';
import * as path from 'path';
import { getReferences } from '../test-kit/asserters';

describe("References", function () {
    describe("Local classes", function () {
        it.only("should return all instances of local class when called from selector ", function () {
            const refs = getReferences('references/local-class-from-selector.st.css', { line: 5, character: 16 });
            expect(refs.length).to.equal(5);
        });
    });
});
