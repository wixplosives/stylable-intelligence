import StylableDotCompletionProvider,{Completion,snippet,ExtendedResolver,ClassDefinition,StateDefinition,SymbolDefinition} from '../../src/provider';
import {Resolver,Stylesheet} from 'stylable';
import * as _ from 'lodash';

export function getDefinition(stylesheet:Stylesheet,symbolName:string):SymbolDefinition | null{

    if(stylesheet.typedClasses[symbolName]){
        return getClassDefinition(stylesheet,symbolName);
    }
    return null;
}

function getClassDefinition(stylesheet:Stylesheet,symbolName:string):ClassDefinition{
    const states: StateDefinition[] = [];
    if(stylesheet.typedClasses[symbolName]["-sb-states"]){
        stylesheet.typedClasses[symbolName]["-sb-states"]!.map((state)=>{
            states.push({
                name:state,
                export:'',
                from:''
            })
        })
    }

    return  {
        export:symbolName,
        states
    }
}
