import { expect } from 'chai';
import { trimLiteral } from './service.spec';


let processSourceAndLocation: any;
let astSymbolFromLocation: any;
let StylableClassSelector: any;
let StylableDeclarationProp: any;
let StylableRoot: any;
let StylableDeclaration: any;

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

        const astNode = astSymbolFromLocation('/style.st.css', line, column);

        expect(astNode).to.be.instanceOf(StylableRoot);
        expect(astNode).to.equal(meta.rawAst);
    });

    it('Should return selector AST in simple class selector', () => {
        const { fs, meta, line, column } = processSourceAndLocation({
            files: {
                '/style.st.css': {
                    content: trimLiteral`
                    |.a {
                    |    color:red;
                    |}
                    |
                    |.b* {
                    |    color:red;
                    |}
                    |
                    |:vars {
                    |   x: y;
                    |}`
                }
            }
        });

        const astNode = astSymbolFromLocation('/style.st.css', line, column);

        expect(astNode).to.be.instanceOf(StylableClassSelector);
        expect(astNode.parent).to.equal(meta.rawAst);
        expect(astNode.selector).to.eql('.b');
        expect(astNode.nodes).to.have.length(1);
        expect(astNode.nodes[0]).to.be.instanceof(StylableDeclaration);
        expect(astNode.selector.position).to.eql(2);
    });

    it('Should return selector AST in simple class selector with states', () => {
        const { fs, meta, line, column } = processSourceAndLocation({
            files: {
                '/style.st.css': {
                    content: trimLiteral`
                    |.b {
                    |    -st-states: one,two;
                    |}
                    |
                    |.b:on*e:t {
                    |    color:red;
                    |}
                    |
                    |:vars {
                    |   x: y;
                    |}`
                }
            }
        });

        const astNode = astSymbolFromLocation('/style.st.css', line, column);

        expect(astNode).to.be.instanceOf(StylableClassSelector);
        expect(astNode.parent).to.equal(meta.rawAst);
        expect(astNode.selector).to.eql('.b');
        expect(astNode.selector.states).to.have.length(2);
        expect(astNode.selector.states[0]).to.eql('.one'); //valid state
        expect(astNode.selector.states[1]).to.eql('.t'); //invalid state
        expect(astNode.selector.position).to.eql(5);
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
