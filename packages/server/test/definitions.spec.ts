import { createRange } from '../src/completion-providers';
import * as asserters from '../test-kit/asserters';
import { expect } from 'chai';
import * as path from 'path';

describe("Local class definition", function () {
    it.only("should return first definition of class in same file", function () {
        return asserters.getDefinition('definitions/local-class.st.css').then((defs) => {
            expect(defs.length).to.equal(1);
            let def = defs[0];
            expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/local-class.st.css'));
            expect(def.range).to.eql(createRange(0,0,0,6))
        });
    });
});
