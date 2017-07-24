import StylableDotCompletionProvider,{Completion,snippet,ExtendedResolver,ProviderPosition,ProviderRange} from '../src/provider'
import {Resolver,Stylesheet} from 'stylable'
import * as _ from 'lodash';
import { workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider ,TextDocument,Position,CancellationToken,CompletionItem,CompletionItemKind, Range} from 'vscode';
import { expect } from "chai";
import {TestResolver} from '../test-kit/test-resolver';


function assertCompletions(actualCompletions:Completion[],expectedCompletions:Partial<Completion>[],prefix:string=''){
    expectedCompletions.forEach(expected => {
        const actual = actualCompletions.find((comp)=>comp.label===expected.label);
        expect(actual,prefix+'completion not found: '+expected.label+' ').to.not.be.equal(undefined);
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

function assertNoCompletions(actualCompletions:Completion[],nonCompletions:Partial<Completion>[],prefix:string=''){
    nonCompletions.forEach(notAllowed => {
        const actual = actualCompletions.find((comp)=>comp.label===notAllowed.label);
        expect(actual,prefix+'unallowed completion found: '+notAllowed.label+' ').to.be.equal(undefined);

    });
}

const startPos = { line:0, character:0};
const provider = new StylableDotCompletionProvider();
interface assertable{
    assertCompletions:(expectedCompletions:Partial<Completion>[])=>void;
    assertNoCompletions:(nonCompletions:Partial<Completion>[])=>void
}
function completions(src:string,extrafiles:{[path:string]:string} = {},checkSingleLine:boolean = false):Thenable<assertable>{
    const singleLineSrc = src.split('\n').join('');
    let normalCompletions:Completion[];
    return completionsIntenal(src,extrafiles)
    .then((completions)=>{ normalCompletions = completions; })
    .then(()=>{return completionsIntenal(singleLineSrc,extrafiles)})
    .then((singleLineCompletions)=>{
        return {
            assertNoCompletions:(expectedNoCompletions:Partial<Completion>[])=>{
                assertNoCompletions(normalCompletions,expectedNoCompletions);
                checkSingleLine && assertNoCompletions(singleLineCompletions,expectedNoCompletions,'single line: ');
            },
            assertCompletions:(expectedNoCompletions:Partial<Completion>[])=>{
                assertCompletions(normalCompletions,expectedNoCompletions);
                checkSingleLine && assertCompletions(singleLineCompletions,expectedNoCompletions,'single line: ');
            }
        }

    })
}

function completionsIntenal(src:string,extrafiles:{[path:string]:string} = {}):Thenable<Completion[]>{
    const caretPos = src.indexOf('|');

    const linesTillCaret = src.substr(0,caretPos).split('\n');
    const character = linesTillCaret[linesTillCaret.length-1].length;

    src = src.replace('|',"");

    const resolver = new TestResolver({});
    resolver.addExtraFiles(extrafiles);

    return provider.provideCompletionItemsFromSrc(src,{
        line:linesTillCaret.length-1,
        character
    },'projectRoot/main.css',resolver)
}

const importCompletion:Partial<Completion> = {label:':import',sortText:'a',insertText:'import {\n\t-st-from: "$1";\n}'};
const rootCompletion:Partial<Completion> = {label:'.root',sortText:'b'};
const statesDirectiveCompletion:Partial<Completion> = {label:'-st-states:',sortText:'a',insertText:'-st-states:$1;'};
const extendsDirectiveCompletion:Partial<Completion> = {label:'-st-extends:',sortText:'a',insertText:'-st-extends:$1;'};
const mixinDirectiveCompletion:Partial<Completion> = {label:'-st-mixin:',sortText:'a',insertText:'-st-mixin:$1;'};
const variantDirectiveCompletion:Partial<Completion> = {label:'-st-variant:',sortText:'a',insertText:'-st-variant:true;'};
const importFromDirectiveCompletion:Partial<Completion> = {label:'-st-from:',sortText:'a',insertText:'-st-from:"$1";'};
const importDefaultDirectiveCompletion:Partial<Completion> = {label:'-st-default:',sortText:'a',insertText:'-st-default:$1;'};
const importNamedDirectiveCompletion:Partial<Completion> = {label:'-st-named:',sortText:'a',insertText:'-st-named:$1;'};
const classCompletion:(className:string)=>Partial<Completion> = (className)=>{return{label:'.'+className,sortText:'b'}}
const stateCompletion:(stateName:string, from?:string)=>Partial<Completion> = (stateName, from='projectRoot/main.css')=>{return{label:stateName,sortText:'a',detail:'from: '+from}}
const extendsCompletion:(typeName:string,range?:ProviderRange)=>Partial<Completion> = (typeName,range)=>{return{label:typeName,sortText:'a',insertText:' '+typeName+';\n',range}};
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
            `).then((asserter)=>{
                asserter.assertCompletions(
                    [
                        importCompletion,
                        rootCompletion,
                        classCompletion('gaga')
                    ]
                );
                asserter.assertNoCompletions([
                     statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ]);
            });
        });
        it('should complete root and existing classes at top level after "."',function(){
            return completions(
            `
            .|

            .gaga{
                color:red;
            }
            `).then((asserter)=>{
                asserter.assertCompletions([
                    rootCompletion,
                    classCompletion('gaga')
                ]);
                asserter.assertNoCompletions([
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
            `).then((asserter)=>{

                asserter.assertCompletions([
                    importCompletion

                ]);
                 asserter.assertNoCompletions([
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
        it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules',function(){
            return completions(
            `
            .gaga{
                |
            }
            `,{},true).then((asserter)=>{

                asserter.assertCompletions([
                    statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ]);

            });
        });

        it('should complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules after dash',function(){
            return completions(
            `
            .gaga{
                -|
                color:red;
            }

            `,{},true).then((asserter)=>{

                asserter.assertCompletions([
                    statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ]);

            });
        });
        it('should not complete -st-states, -st-extends, -st-mixin, -st-variant inside simple rules when exists',function(){
            return completions(
            `
            .gaga{
                -st-states: a, b;
                -st-extends: Comp;
                -st-mixin: MixA;
                -st-variant: BigButton;
                -|
            }

            `,{},true).then((asserter)=>{

                asserter.assertNoCompletions([
                    statesDirectiveCompletion,
                    extendsDirectiveCompletion,
                    mixinDirectiveCompletion,
                    variantDirectiveCompletion
                ]);

            });
        });
        describe('should not complete -st-states, -st-extends, -st-variant inside complex rules',function(){
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
                    return completions(src,{},true).then((asserter)=>{
                        asserter.assertCompletions([
                            mixinDirectiveCompletion
                        ])
                        asserter.assertNoCompletions([
                            statesDirectiveCompletion,
                            extendsDirectiveCompletion,
                            variantDirectiveCompletion
                        ]);

                    });
                })
            });


        });
        describe('imports',function(){
            it('should complete -st-from, -st-default, -st-named inside import statements',function(){
                return completions(
                `
                :import{
                    -|
                }

                `,{},true).then((asserter)=>{

                    asserter.assertCompletions([
                        importFromDirectiveCompletion,
                        importDefaultDirectiveCompletion,
                        importNamedDirectiveCompletion
                    ]);
                    asserter.assertNoCompletions([
                        statesDirectiveCompletion,
                        extendsDirectiveCompletion,
                        variantDirectiveCompletion,
                        mixinDirectiveCompletion
                    ]);
                });
            });

            it('should not complete -st-from, -st-default, -st-named inside import statements when exists',function(){
                return completions(
                `
                :import{
                    -st-from: "./x";
                    -st-default: X;
                    -st-named: a, b;
                    -|
                }
                `,{},true).then((asserter)=>{

                    asserter.assertNoCompletions([
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
                    -st-states:hello;
                }
                .gaga:|
                `,{},true).then((asserter)=>{
                    asserter.assertCompletions([
                        stateCompletion('hello')
                    ]);
                    asserter.assertNoCompletions([
                        importCompletion
                    ]);
                });
            });
        it('should not break for untyped classes',function(){
            return completions(
            `
            .gaga{
            }
            .gaga:|
            `,{},true).then((asserter)=>{

                asserter.assertNoCompletions([
                    importCompletion,
                    stateCompletion('hello')
                ]);
            });
        });
        it('should complete available states after : in complex selectors',function(){
                return completions(
                `
                .gaga{
                    -st-states:hello;
                }
                .zagzag{
                    -st-states:goodbye;
                }
                .baga{
                    -st-states:cheerio;
                }
                .zagzag button.gaga:hover:| .baga
                `,{},true).then((asserter)=>{
                    asserter.assertCompletions([
                        stateCompletion('hello')
                    ]);
                    asserter.assertNoCompletions([
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
                    -st-states:hello;
                }
                .zagzag button.gaga:hello:| .baga
                `,{},true).then((asserter)=>{
                    asserter.assertNoCompletions([
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
                    -st-from:"./comp.css";
                    -st-default:Comp;
                }
                .gaga{
                    -st-extends:|
                }
                `,{
                    'comp.css':``
                },true).then((asserter)=>{
                    asserter.assertCompletions([
                        extendsCompletion('Comp')
                    ]);
                    asserter.assertNoCompletions([
                        importCompletion,
                        mixinDirectiveCompletion
                 ]);
             });
         });

         it('allow extending component css file (with existing ;)',function(){
                return completions(
                `
                :import{
                    -st-from:"./comp.css";
                    -st-default:Comp;
                }
                .gaga{
                    -st-extends:| ;
                }
                `,{
                    'comp.css':``
                },true).then((asserter)=>{
                    const range = undefined;
                    /* TODO: add range, see that works in vscode */
                    // {
                    //     start:{
                    //         line:6,
                    //         character:13
                    //     },
                    //     end:{
                    //         line:6,
                    //         character:15
                    //     }
                    // }
                    asserter.assertCompletions([
                        extendsCompletion('Comp',range)
                    ]);
                    asserter.assertNoCompletions([
                        importCompletion,
                        mixinDirectiveCompletion
                 ]);
             });
         });

         it('complete states for localy imported component',function(){
                return completions(
                `
                :import{
                    -st-from: "./comp.css";
                    -st-default: Comp;

                }
                .gaga{
                    -st-extends: Comp;
                }
                .gaga:|
                `,
                {
                    'comp.css':`
                            .root{
                                -st-states:shmover;
                            }
                        `
                },true).then((asserter)=>{
                    asserter.assertCompletions([
                        stateCompletion('shmover','projectRoot/comp.css')
                    ]);
             });
         });

         it('complete states for localy imported component (including local states)',function(){
                return completions(
                `
                :import{
                    -st-from: "./comp.css";
                    -st-default: Comp;

                }
                .gaga{
                    -st-extends: Comp;
                    -st-states: hello;
                }
                .gaga:|
                `,
                {
                    'comp.css':`
                            .root{
                                -st-states:shmover;
                            }
                        `
                },true).then((asserter)=>{
                    asserter.assertCompletions([
                        stateCompletion('shmover','projectRoot/comp.css'),
                        stateCompletion('hello')
                    ]);
             });
         });


        it('complete states for localy imported component ( recursive )',function(){
                return completions(
                `
                :import{
                    -st-from: "./comp2.css";
                    -st-default: Comp;
                }
                .gaga{
                    -st-extends: Comp;
                    -st-states: normalstate;
                }
                .gaga:|
                `,
                {
                    'comp1.css':`
                            .root{
                                -st-states:recursestate;
                            }
                    `,
                    'comp2.css':`
                        :import{
                            -st-from: "./comp1.css";
                            -st-default: Zag;
                        }
                        .root{
                            -st-extends:Zag;
                            -st-states:importedstate;
                        }
                    `
                },true).then((asserter)=>{
                    asserter.assertCompletions([
                        stateCompletion('importedstate','projectRoot/comp2.css'),
                        stateCompletion('recursestate','projectRoot/comp1.css'),
                        stateCompletion('normalstate')
                    ]);
             });
         });
         xit('complete states for localy imported variant',function(){
                return completions(
                `
                :import{
                    -st-from: "./comp.css";
                    -st-named: zagzag;

                }
                .gaga{
                    -st-extends: zagzag;
                }
                .gaga:|
                `,
                {
                    'comp.css':`
                            .root{
                                -st-states:shmover;
                            }
                            .zagzag{
                                -st-variant:true;
                            }
                        `
                },true).then((asserter)=>{
                    asserter.assertCompletions([
                        stateCompletion('shmover','projectRoot/comp.css')
                    ]);
             });
         });


         it('should not break while typing',function(){
                return completions(
                `
                .|
                .gaga{
                    -st-states:hello;
                }
                .gaga:hello{

                }
                `,{
                    'comp.css':``
                },false).then((asserter)=>{
                    asserter.assertCompletions([
                        classCompletion('gaga')
                 ]);
             });
         });

         it('should not complete when broken',function(){
                return completions(
                `
                :import{
                    -st-from:"./comp.css";
                    -st-default:Comp;
                }
                .gaga{
                    -st-extends::| ;
                }
                `,{
                    'comp.css':``
                },true).then((asserter)=>{
                    asserter.assertNoCompletions([
                        extendsCompletion('Comp'),
                        importCompletion,
                        mixinDirectiveCompletion
                 ]);
             });
         });
    });
})
