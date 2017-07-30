import StylableDotCompletionProvider,{Completion,snippet,ExtendedResolver} from '../../src/provider';
import {Resolver,Stylesheet, fromCSS} from 'stylable'
import * as _ from 'lodash';
import {ClassDefinition,StateDefinition,getDefinition,isClassDefinition,isStateDefinition,SymbolDefinition} from '../../src/utils/get-definitions';
import { workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider ,TextDocument,Position,CancellationToken,CompletionItem,CompletionItemKind, Range} from 'vscode';
import { expect } from "chai";
import {TestResolver} from '../../test-kit/test-resolver';

const startPos = { line:0, character:0};
const provider = new StylableDotCompletionProvider();

function definitions(symbolName:string,src:string,extrafiles:{[path:string]:string} = {},checkSingleLine:boolean = false):Thenable<SymbolDefinition | null>{
    const singleLineSrc = src.split('\n').join('');
    let normalCompletions:Completion[];

    const resolver = new TestResolver({});
    resolver.addExtraFiles(extrafiles);

    const styleSheet:Stylesheet = fromCSS(src,undefined,'projectRoot/main.css');
    return Promise.resolve(getDefinition(styleSheet,symbolName,resolver));

}



function matchDefinition<D extends Partial<SymbolDefinition>>(actualDefinition:SymbolDefinition,expectedDefinition:D,prefix:string=''){
    expect(actualDefinition.type,prefix+'definition type: '+actualDefinition.export).to.equal(expectedDefinition.type);
    expectedDefinition.export && expect(actualDefinition.export,prefix+'definition export: '+actualDefinition.export).to.equal(expectedDefinition.export);
    if(isClassDefinition(actualDefinition) && isClassDefinition(expectedDefinition)){
        expectedDefinition.states.forEach((expectedState)=>{
            const foundState:SymbolDefinition | undefined = actualDefinition.states.find((actualState)=>actualState.name===expectedState.name);
            expect(foundState,prefix+'missing state: '+expectedState.name).to.include({
                name:expectedState.name
            });
            if(foundState){
                matchDefinition(foundState,expectedState);
            }
        });

        expect(actualDefinition.states.length,prefix+'found extra states: '+actualDefinition.export).to.equal(expectedDefinition.states.length);
    }
}


describe('getDefinition',function(){
    describe('getClassDefinition',function(){
        it('should return available states for class, including recursive imports',function(){
            return definitions(
                "gaga",
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
                }).then((actual:ClassDefinition)=>{
                matchDefinition(actual,{
                    type:'class',
                    export:'gaga',
                    states:[{
                        name:'normalstate',
                        from:'',
                        export:'gaga',
                        type:'state'
                    },{
                        name:'importedstate',
                        from:'projectRoot/comp2.css',
                        export:'root',
                        type:'state'
                    },{
                        name:'recursestate',
                        from:'projectRoot/comp1.css',
                        export:'root',
                        type:'state'
                    }]})

            });
        });
    })


})
