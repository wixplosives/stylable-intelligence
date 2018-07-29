import { createRange, ProviderPosition } from '../../src/lib/completion-providers';
import * as asserters from '../../test-kit/asserters';
import { expect } from 'chai';
import * as path from 'path';
import { CASES_PATH } from "../../test-kit/asserters";
import { call } from 'when/node';

describe("Definitions", function () {
    describe("Local elements", function () {
        it("should return first definition of class in same file", function () {
            return asserters.getDefinition('definitions/local-class.st.css').then((defs) => {
                expect(defs.length).to.equal(1);
                let def = defs[0];
                expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/local-class.st.css'));
                expect(def.range).to.eql(createRange(0, 1, 0, 6))
            });
        });

        it("should return definition of var in same file", function () {
            return asserters.getDefinition('definitions/local-var.st.css').then((defs) => {
                expect(defs.length).to.equal(1);
                let def = defs[0];
                expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/local-var.st.css'));
                expect(def.range).to.eql(createRange(5, 4, 5, 7))
            });
        });

        it("should return definition of custom selector in same file", function () {
            return asserters.getDefinition('definitions/local-custom-selector.st.css').then((defs) => {
                expect(defs.length).to.equal(1);
                let def = defs[0];
                expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/local-custom-selector.st.css'));
                expect(def.range).to.eql(createRange(4, 17, 4, 24))
            });
        });

        it("should return definition of class in complex selector", function () {
            return asserters.getDefinition('definitions/local-class-complex.st.css').then((defs) => {
                expect(defs.length).to.equal(1);
                let def = defs[0];
                expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/local-class-complex.st.css'));
                expect(def.range).to.eql(createRange(0, 1, 0, 6))
            });
        });
    });

    describe("Imported elements", function () {
        describe("Classes", function () {
            it("should return definition of imported class in -st-named", function () {
                return asserters.getDefinition('definitions/imported-class-named.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(4, 1, 4, 5))
                });
            });

            it("should return definition of imported class in -st-extend", function () {
                return asserters.getDefinition('definitions/imported-class-extend.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(4, 1, 4, 5))
                });
            });

            it("should return definition of imported class used as pseudo-element", function () {
                return asserters.getDefinition('definitions/imported-class-pseudo-element.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(4, 1, 4, 5))
                });
            });

            it("should return definition of imported class from 3rd party module", function () {
                return asserters.getDefinition('definitions/imported-class-3rd-party.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, '../node_modules/fake-stylable-package/stylesheet.st.css'));
                    expect(def.range).to.eql(createRange(9, 1, 9, 6))
                });
            });
        });

        describe("Vars", function () {
            it("should return definition of imported var in -st-named", function () {
                return asserters.getDefinition('definitions/imported-var-named.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(14, 4, 14, 8))
                });
            });

            it("should return definition of 3rd party var in -st-named", function () {
                return asserters.getDefinition('definitions/3rd-party-var-named.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, '../node_modules/fake-stylable-package/stylesheet.st.css'));
                    expect(def.range).to.eql(createRange(1, 4, 1, 10))
                });
            });

            it("should return definition of imported var in RHS of rule", function () {
                return asserters.getDefinition('definitions/imported-var-value.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/import.st.css'));
                    expect(def.range).to.eql(createRange(14, 4, 14, 8))
                });
            });
        });

        describe("Mixins and Formatters", function () {
            it("should return definition of JS mixin in -st-named", function () {
                return asserters.getDefinition('definitions/imported-mixins-named-js.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, 'mixins/js-mixins.js'));
                    expect(def.range).to.eql(createRange(8, 8, 8, 14))
                });
            });

            it("should return definition of 3rd party JS mixin in -st-named", function () {
                return asserters.getDefinition('definitions/3rd-party-mixins-named-js.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, '../node_modules/fake-stylable-package/js-mixins.js'));
                    expect(def.range).to.eql(createRange(8, 8, 8, 14))
                });
            });

            //Feature undergoing redesign
            xit("should return definition of TS mixin in -st-named", function () {
                return asserters.getDefinition('definitions/imported-mixins-named-ts.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, 'mixins/my-mixins.ts'));
                    expect(def.range).to.eql(createRange(2, 16, 2, 29))
                });
            });

            it("should return definition of JS mixin in use", function () {
                return asserters.getDefinition('definitions/imported-mixins-value-js.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, 'mixins/js-mixins.js'));
                    expect(def.range).to.eql(createRange(33, 8, 33, 18))
                });
            });

            xit("should return definition of TS mixin in use", function () {
                return asserters.getDefinition('definitions/imported-mixins-value-ts.st.css').then((defs) => {
                    expect(defs.length).to.equal(1);
                    let def = defs[0];
                    expect(def.uri).to.equal(path.join(CASES_PATH, 'mixins/my-mixins.ts'));
                    expect(def.range).to.eql(createRange(19, 16, 19, 34))
                });
            });
        });

        describe("States", function () {

            let callLocs = [
                { filePath: 'definitions/states-import.st.css', pos: new ProviderPosition(1, 22) },
                { filePath: 'definitions/states-default.st.css', pos: new ProviderPosition(5, 14) },
                { filePath: 'definitions/states-default.st.css', pos: new ProviderPosition(7, 14) },
                { filePath: 'definitions/states-default.st.css', pos: new ProviderPosition(16, 14) },
                { filePath: 'definitions/states-default.st.css', pos: new ProviderPosition(20, 14) }
            ]

            callLocs.forEach(cl => {
                xit("Should find definition of rootState when called from file " + cl.filePath + " in position " + JSON.stringify(cl.pos), function () {

                    return asserters.getDefFromLoc(cl).then((defs) => {
                        expect(defs.length).to.equal(1);
                        let def = defs[0];
                        expect(def.uri).to.equal(path.join(CASES_PATH, 'mixins/states-import.st.css'));
                        expect(def.range).to.eql(createRange(0, 0, 0, 0))
                    });
                });
                // });
            });

            callLocs = [
                { filePath: 'definitions/states-import.st.css', pos: new ProviderPosition(5, 21) },
                { filePath: 'definitions/states-default.st.css', pos: new ProviderPosition(7, 30) },
                { filePath: 'definitions/states-default.st.css', pos: new ProviderPosition(18, 15) },
                { filePath: 'definitions/states-named.st.css', pos: new ProviderPosition(5, 17) },
            ]

            callLocs.forEach(cl => {
                it.only ("Should find definition of topState on element 'one' when called from file " + cl.filePath + " in position " + JSON.stringify(cl.pos), function () {
                    return asserters.getDefFromLoc(cl).then((defs) => {
                        expect(defs.length).to.equal(1);
                        let def = defs[0];
                        expect(def.uri).to.equal(path.join(CASES_PATH, 'definitions/states-import.st.css'));
                        expect(def.range).to.eql(createRange(4, 1, 4, 4))
                    });
                });
            });
        });
    });
});
