import { createRange } from '../src/completion-providers';
import * as asserters from '../test-kit/asserters';
import { expect } from 'chai';
import * as path from 'path';

describe("Definitions", function () {
    describe("Local elements", function () {
        it("should return first definition of class in same file", function () {
            return asserters.getDefinition('definitions/local-class.st.css').then((defs) => {
                expect(defs.length).to.equal(1);
                let def = defs[0];
                expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/local-class.st.css'));
                expect(def.range).to.eql(createRange(0, 0, 0, 6))
            });
        });

        it("should return definition of var in same file", function () {
            return asserters.getDefinition('definitions/local-var.st.css').then((defs) => {
                expect(defs.length).to.equal(1);
                let def = defs[0];
                expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/local-var.st.css'));
                expect(def.range).to.eql(createRange(5, 4, 5, 7))
            });
        });

        it("should return definition of class in complex selector", function () {
            return asserters.getDefinition('definitions/local-class-complex.st.css').then((defs) => {
                expect(defs.length).to.equal(1);
                let def = defs[0];
                expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/local-class-complex.st.css'));
                expect(def.range).to.eql(createRange(0, 0, 0, 6))
            });
        });

        //Custom selector definition
        //Definition when usage is above definition
        //
    });
});
