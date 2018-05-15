import { expect } from 'chai';
import { trimLiteral } from './service.spec';


let processSourceAndLocation: any;
let astSymbolFromLocation: any;
let StylableClassSelector: any;
let StylableDeclarationProp: any;
let StylableRoot: any;

xdescribe('astSymbolFromLocation', () => {

    it('Should return root of meta at top level', () => {
        const { fs, meta, line, column } = processSourceAndLocation({
            files: {
                '/style.st.css': {
                    content: trimLiteral`
                    |*
                    |
                    |.a {
                    |    color:red;
                    |}
                    |
                    |:vars {
                    |   x: y;
                    |}
                    |
                    |:import {
                    |   -st-from: './import.st.css';
                    |   -st-default: Comp;
                    |}`
                },
                '/import.st.css': {
                    content: trimLiteral`
                    |.b {
                    |    -st-states: stateOfConfusion;
                    |}`
                }
            }
        });

        const astSymbol = astSymbolFromLocation('/style.st.css', line, column);

        expect(astSymbol);
        expect(astSymbol).to.equal(meta.rawAst);
    });

    it('should return selector class AST', () => {
        const { fs, meta, line, column } = processSourceAndLocation({
            files: {
                '/style.st.css': {
                    content: `
                        .a .b| {
                            color:red;
                        }
                    `
                }
            }
        });

        const astSymbol = astSymbolFromLocation('/style.st.css', line, column);

        expect(astSymbol).to.be.instanceOf(StylableClassSelector);
        expect(astSymbol.parent(), 'rule of selector').to.equal(meta.ast.children[0]);
        expect(astSymbol.index(), 'selector index').to.equal(2);
    });

    it('should return selector class AST', () => {
        const { fs, meta, line, column } = processSourceAndLocation({
            files: {
                '/style.st.css': {
                    content: `
                        .b {
                            -st-states: x, y;
                        }
                        .a .b| {
                            color:red;
                        }
                    `
                }
            }
        });

        const astSymbol = astSymbolFromLocation('/style.st.css', line, column);

        expect(astSymbol.getStates()).to.equal([{ x: null, y: null }]);
    });

    it('should return selector declaration prop AST', () => {
        const { fs, meta, line, column } = processSourceAndLocation({
            files: {
                '/style.st.css': {
                    content: `
                        .a .b {
                            color|:red;
                        }
                    `
                }
            }
        });

        const astSymbol = astSymbolFromLocation('/style.st.css', line, column);

        expect(astSymbol).to.be.instanceOf(StylableDeclarationProp);
        expect(astSymbol.parent(), 'declaration').to.equal(meta.ast.children[0].children[0]);
        expect(astSymbol.name).to.equal('color');
    });

});
