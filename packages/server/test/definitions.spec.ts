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

        it("should return definition of custom selector in same file", function () {
            return asserters.getDefinition('definitions/local-custom-selector.st.css').then((defs) => {
                expect(defs.length).to.equal(1);
                let def = defs[0];
                expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/local-custom-selector.st.css'));
                expect(def.range).to.eql(createRange(4, 17, 4, 24))
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
    });

    describe("Imported elements", function () {
        describe("Classes", function () {
            it("should return definition of imported class in -st-named", function () {
                return asserters.getDefinition('definitions/imported-class-named.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(4, 1, 4, 5))
                });
            });

            it("should return definition of imported class in -st-extend", function () {
                return asserters.getDefinition('definitions/imported-class-extend.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(4, 1, 4, 5))
                });
            });

            it("should return definition of imported class used as pseudo-element", function () {
                return asserters.getDefinition('definitions/imported-class-pseudo-element.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(4, 1, 4, 5))
                });
            });
        });

        describe("Vars", function () {
            it("should return definition of imported var in -st-named", function () {
                return asserters.getDefinition('definitions/imported-var-named.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(14, 4, 14, 8))
                });
            });

            it("should return definition of imported var in RHS of rule", function () {
                return asserters.getDefinition('definitions/imported-var-value.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(14, 4, 14, 8))
                });
            });
        });

        describe("Mixins and Formatters", function () {
            it("should return definition of JS mixin in -st-named", function () {
                return asserters.getDefinition('definitions/imported-mixins-named-js.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'mixins/js-mixins.js'));
                    expect(def.range).to.eql(createRange(8, 8, 8, 14))
                });
            });

            it("should return definition of TS mixin in -st-named", function () {
                return asserters.getDefinition('definitions/imported-mixins-named-ts.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'mixins/my-mixins.ts'));
                    expect(def.range).to.eql(createRange(3, 16, 3, 29))
                });
            });

            it("should return definition of JS mixin in use", function () {
                return asserters.getDefinition('definitions/imported-mixins-value-js.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'mixins/js-mixins.js'));
                    expect(def.range).to.eql(createRange(33, 8, 33, 18))
                });
            });

            it("should return definition of TS mixin in use", function () {
                return asserters.getDefinition('definitions/imported-mixins-value-ts.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(__dirname, '/../test/cases/', 'mixins/my-mixins.ts'));
                    expect(def.range).to.eql(createRange(20, 16, 20, 34))
                });
            });
        });

    });
});
