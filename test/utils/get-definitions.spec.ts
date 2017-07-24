import StylableDotCompletionProvider,{Completion,snippet,ExtendedResolver,ClassDefinition,StateDefinition} from '../../src/provider';
import {Resolver,Stylesheet} from 'stylable'
import * as _ from 'lodash';
import { workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider ,TextDocument,Position,CancellationToken,CompletionItem,CompletionItemKind, Range} from 'vscode';
import { expect } from "chai";
import {TestResolver} from '../../test-kit/test-resolver';

const startPos = { line:0, character:0};
const provider = new StylableDotCompletionProvider();

function definitions(src:string,extrafiles:{[path:string]:string} = {},checkSingleLine:boolean = false):Thenable<ClassDefinition>{
    const singleLineSrc = src.split('\n').join('');
    let normalCompletions:Completion[];

    const resolver = new TestResolver({});
    resolver.addExtraFiles(extrafiles);
    return Promise.resolve({
        states:[{
            name:'zag',
            from:'',
            export:''
        }]
    })

}


describe('getDefinition',function(){
    describe('getClassDefinition',function(){
        it('should return available states for class, including recursive imports',function(){
            return definitions(
                `
                :import{
                    -sb-from: "./comp2.css";
                    -sb-default: Comp;
                }
                .gaga{
                    -sb-type: Comp;
                    -sb-states: normalstate;
                }
                .gaga:|
                `,
                {
                    'comp1.css':`
                            .root{
                                -sb-states:recursestate;
                            }
                    `,
                    'comp2.css':`
                        :import{
                            -sb-from: "./comp1.css";
                            -sb-default: Zag;
                        }
                        .root{
                            -sb-type:Zag;
                            -sb-states:importedstate;
                        }
                    `
                }).then((actual:ClassDefinition)=>{
                const expected:StateDefinition[] = [{
                    name:'normalstate',
                    from:'',
                    export:''
                },{
                    name:'importedstate',
                    from:'projectRoot/comp2.css',
                    export:'root'
                },{
                    name:'recursestate',
                    from:'projectRoot/comp1.css',
                    export:'root'
                }]
                expect(actual.states).to.eq(expected)
            });
        });
    })


})
