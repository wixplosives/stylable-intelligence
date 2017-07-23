import StylableDotCompletionProvider,{Completion,snippet} from '../src/provider'

import { workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider ,TextDocument,Position,CancellationToken,CompletionItem,CompletionItemKind, Range} from 'vscode';
import { expect } from "chai";

function assertCompletions(actualCompletions:Completion[],expectedCompletions:Partial<Completion>[]){
    expectedCompletions.forEach(expected => {
        const actual = actualCompletions.find((comp)=>comp.label===expected.label);
        expect(actual,'completion not found: '+expected.label+' ').to.not.be.equal(undefined);
        if(actual){
             for(var field in expected){
                let actualVal:any = (actual as any)[field];
                if(actualVal instanceof snippet){
                    actualVal = actualVal.source;
                }
                const expectedVal:any = (expected as any)[field];
                expect(actualVal,actual.label+ ":"+field).to.equal(expectedVal);
            }
        }
    });
}

function assertNoCompletions(actualCompletions:Completion[],nonCompletions:Partial<Completion>[]){
    nonCompletions.forEach(notAllowed => {
        const actual = actualCompletions.find((comp)=>comp.label===notAllowed.label);
        expect(actual,'unallowed completion found: '+notAllowed.label+' ').to.be.equal(undefined);

    });
}

const startPos = { line:0, character:0};
function completions(src:string,extrafiles:{[path:string]:string} = {}){
    const provider = new StylableDotCompletionProvider();
    const caretPos = src.indexOf('|');

    const linesTillCaret = src.substr(0,caretPos).split('\n');
    const character = linesTillCaret[linesTillCaret.length-1].length;

    src = src.replace('|',"");

    return provider.provideCompletionItemsFromSrc(src,{
        line:linesTillCaret.length-1,
        character
    })
}

const importCompletion:Partial<Completion> = {label:':import',sortText:'a',insertText:'import {\n\t-sb-from: "$1";\n}'};
const rootCompletion:Partial<Completion> = {label:'.root',sortText:'b'};
const statesDirectiveCompletion:Partial<Completion> = {label:'-sb-states:',sortText:'a',insertText:'-sb-states:$1;'};
const extendsDirectiveCompletion:Partial<Completion> = {label:'-sb-extends:',sortText:'a',insertText:'-sb-extends:$1;'};
const mixinDirectiveCompletion:Partial<Completion> = {label:'-sb-mixin:',sortText:'a',insertText:'-sb-mixin:$1;'};
const variantDirectiveCompletion:Partial<Completion> = {label:'-sb-variant:',sortText:'a',insertText:'-sb-variant:true;'};
const importFromDirectiveCompletion:Partial<Completion> = {label:'-sb-from:',sortText:'a',insertText:'-sb-from:"$1";'};
const importDefaultDirectiveCompletion:Partial<Completion> = {label:'-sb-default:',sortText:'a',insertText:'-sb-default:$1;'};
const importNamedDirectiveCompletion:Partial<Completion> = {label:'-sb-named:',sortText:'a',insertText:'-sb-named:$1;'};
const classCompletion:(className:string)=>Partial<Completion> = (className:string)=>{return{label:'.'+className,sortText:'b'}}
const stateCompletion:(stateName:string)=>Partial<Completion> = (stateName:string)=>{return{label:stateName,sortText:'a'}}
const extendsCompletion:(typeName:string)=>Partial<Completion> = (typeName:string)=>{return{label:typeName,sortText:'a'}}
describe('completion unit test',function(){
    describe('root level',function(){
        it('should complete import directive, root and existing classes at top level',function(){
            return completions(`
            .gaga{
                color:red;
            }
            |
            .baga{

            }
            `).then((res:Completion[])=>{
                assertCompletions(res,
                    [
                        importCompletion,
                        rootCompletion,
                        classCompletion('gaga')
                    ]
                );
                assertNoCompletions(res,[
                     statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ]);
            });
        });
        it('should complete root and existing classes at top level after "."',function(){
            return completions(
            `.|
            .gaga{
                color:red;
            }
            `).then((res:Completion[])=>{
                assertCompletions(res,[
                    rootCompletion,
                    classCompletion('gaga')
                ]);
                assertNoCompletions(res,[
                    importCompletion,
                    statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ])
            });
        });
        it('should complete :import at top level after ":"',function(){
            return completions(
            `:|
            .gaga{
                color:red;
            }
            `).then((res:Completion[])=>{

                assertCompletions(res,[
                    importCompletion

                ]);
                 assertNoCompletions(res,[
                    rootCompletion,
                    classCompletion('gaga'),
                    statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ]);
            });
        });
    });
    describe('directives',function(){
        it('should complete -sb-states, -sb-extends, -sb-mixin, -sb-variant inside simple rules',function(){
            return completions(
            `
            .gaga{
                |
            }
            `).then((res:Completion[])=>{

                assertCompletions(res,[
                    statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ]);

            });
        });
        it('should complete -sb-states, -sb-extends, -sb-mixin, -sb-variant inside simple rules after dash',function(){
            return completions(
            `
            .gaga{
                -|
                color:red;
            }

            `).then((res:Completion[])=>{

                assertCompletions(res,[
                    statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ]);

            });
        });
        it('should not complete -sb-states, -sb-extends, -sb-mixin, -sb-variant inside simple rules when exists',function(){
            return completions(
            `
            .gaga{
                -sb-states: a, b;
                -sb-extends: Comp;
                -sb-mixin: MixA;
                -sb-variant: BigButton;
                -|
            }

            `).then((res:Completion[])=>{

                assertNoCompletions(res,[
                    statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ]);

            });
        });
        describe('should not complete -sb-states, -sb-extends, -sb-variant inside complex rules',function(){
            [
                `
            .gaga:hover{
                |
            }
            `,
            `
            .gaga.baga{
                |
            }
            `,
            `
            .gaga div{
                |
            }
            `,
            `
            .gaga > div{
                |
            }
            `,
            `
            div.baga{
                |
            }
            `,
            `
            @media(max-width:200){
                div.baga{
                    |
                }
            }
            `
            ].map((src)=>{

                it('complex rule '+src.slice(0,src.indexOf('{')),function(){
                    return completions(src).then((res:Completion[])=>{
                        assertCompletions(res,[
                            mixinDirectiveCompletion
                        ])
                        assertNoCompletions(res,[
                            statesDirectiveCompletion,
                            extendsDirectiveCompletion,
                            variantDirectiveCompletion
                        ]);

                    });
                })
            });


        });
        describe('imports',function(){
            it('should complete -sb-from, -sb-default, -sb-named inside import statements',function(){
                return completions(
                `
                :import{
                    -|
                }

                `).then((res:Completion[])=>{

                    assertCompletions(res,[
                        importFromDirectiveCompletion,
                        importDefaultDirectiveCompletion,
                        importNamedDirectiveCompletion
                    ]);
                    assertNoCompletions(res,[
                        statesDirectiveCompletion,
                        extendsDirectiveCompletion,
                        variantDirectiveCompletion,
                        mixinDirectiveCompletion
                    ]);
                });
            });

            it('should not complete -sb-from, -sb-default, -sb-named inside import statements when exists',function(){
                return completions(
                `
                :import{
                    -sb-from: "./x";
                    -sb-default: X;
                    -sb-named: a, b;
                    -|
                }
                `).then((res:Completion[])=>{

                    assertNoCompletions(res,[
                        importFromDirectiveCompletion,
                        importDefaultDirectiveCompletion,
                        importNamedDirectiveCompletion,
                        statesDirectiveCompletion,
                        extendsDirectiveCompletion,
                        variantDirectiveCompletion,
                        mixinDirectiveCompletion
                    ]);
                });
            });
        });
    });
    describe('states',function(){
        it('should complete available states after :',function(){
                return completions(
                `
                .gaga{
                    -sb-states:hello;
                }
                .gaga:|
                `).then((res:Completion[])=>{
                     assertCompletions(res,[
                        stateCompletion('hello')
                    ]);
                    assertNoCompletions(res,[
                        importCompletion
                    ]);
                });
            });
        it('should complete available states after : in complex selectors',function(){
                return completions(
                `
                .gaga{
                    -sb-states:hello;
                }
                .zagzag{
                    -sb-states:goodbye;
                }
                .baga{
                    -sb-states:cheerio;
                }
                .zagzag button.gaga:hover:| .baga
                `).then((res:Completion[])=>{
                     assertCompletions(res,[
                        stateCompletion('hello')
                    ]);
                    assertNoCompletions(res,[
                        importCompletion,
                        stateCompletion('goodbye'),
                        stateCompletion('cheerio')
                    ]);
            });
        });
        it('should not complete available states after : in complex selectors if existing',function(){
                return completions(
                `
                .gaga{
                    -sb-states:hello;
                }
                .zagzag button.gaga:hello:| .baga
                `).then((res:Completion[])=>{
                    assertNoCompletions(res,[
                        importCompletion,
                        stateCompletion('hello')

                    ]);
            });
        });
    });

     describe('multiple files',function(){
        it('allow extending component css file',function(){
                return completions(
                `
                :import{
                    -sb-from:"./comp.css";
                    -sb-default:Comp;
                }
                .gaga{
                    -sb-extends:|
                }
                `,{
                    'comp.css':``
                }).then((res:Completion[])=>{
                     assertCompletions(res,[
                        extendsCompletion('Comp')
                    ]);
                    assertNoCompletions(res,[
                        importCompletion,
                        mixinDirectiveCompletion
                 ]);
             });
         });

         it('allow extending component css file (with existing ;)',function(){
                return completions(
                `
                :import{
                    -sb-from:"./comp.css";
                    -sb-default:Comp;
                }
                .gaga{
                    -sb-extends:| ;
                }
                `,{
                    'comp.css':``
                }).then((res:Completion[])=>{
                     assertCompletions(res,[
                        extendsCompletion('Comp')
                    ]);
                    assertNoCompletions(res,[
                        importCompletion,
                        mixinDirectiveCompletion
                 ]);
             });
         });

         it('should not complete when broken',function(){
                return completions(
                `
                :import{
                    -sb-from:"./comp.css";
                    -sb-default:Comp;
                }
                .gaga{
                    -sb-extends::| ;
                }
                `,{
                    'comp.css':``
                }).then((res:Completion[])=>{
                    assertNoCompletions(res,[
                        extendsCompletion('Comp'),
                        importCompletion,
                        mixinDirectiveCompletion
                 ]);
             });
         });
    });
})
