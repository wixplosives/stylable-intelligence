import {Resolver,Stylesheet} from 'stylable';
import * as _ from 'lodash';

export interface SymbolDefinition{
    export:string;
    type:string;
}


export interface StateDefinition extends SymbolDefinition{
    name:string;
    from:string;
    export:string;
    type:'state';
}


export interface ClassDefinition extends SymbolDefinition{
    states:StateDefinition[];
    type:'class';
}

export function isDefinition(definition:any):definition is SymbolDefinition{
    return definition && !!definition.type
}


export function isClassDefinition(definition:any):definition is ClassDefinition{
    return definition && definition.type === 'class'
}

export function isStateDefinition(definition:any):definition is StateDefinition{
    return definition && definition.type === 'state'
}

export function getDefinition(stylesheet:Stylesheet,symbolName:string,resolver:Resolver):SymbolDefinition | null{

    if(stylesheet.typedClasses[symbolName]){
        return getClassDefinition(stylesheet,symbolName,resolver);
    }
    return null;
}

function getClassDefinition(stylesheet:Stylesheet,symbolName:string,resolver:Resolver):ClassDefinition{
    let states: StateDefinition[] = [];
    if(stylesheet.typedClasses[symbolName]["-st-states"]){
        stylesheet.typedClasses[symbolName]["-st-states"]!.map((state)=>{
            states.push({
                name:state,
                export:symbolName,
                from:stylesheet.source,
                type:'state'
            })
        })
    }
    const type:string | undefined = stylesheet.typedClasses[symbolName]["-st-extends"]
    if(type){
        const symbols = resolver.resolveSymbols(stylesheet);
        if(symbols[type]){
            const internalClassDef = getClassDefinition(symbols[type],'root',resolver);
            states = states.concat(internalClassDef.states);
        }
    }
    return  {
        export:symbolName,
        type:"class",
        states
    }
}
