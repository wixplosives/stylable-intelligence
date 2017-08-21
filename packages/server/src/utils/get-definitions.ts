import { StylableMeta } from 'stylable';

export interface SymbolDefinition {
    export: string;
    type: string;
}


export interface StateDefinition extends SymbolDefinition {
    name: string;
    from: string;
    export: string;
    type: 'state';
}


export interface ClassDefinition extends SymbolDefinition {
    states: StateDefinition[];
    type: 'class';
}

export function isDefinition(definition: any): definition is SymbolDefinition {
    return definition && !!definition.type
}


export function isClassDefinition(definition: any): definition is ClassDefinition {
    return definition && definition.type === 'class'
}

export function isStateDefinition(definition: any): definition is StateDefinition {
    return definition && definition.type === 'state'
}

export function getDefinition(meta: StylableMeta, symbolName: string, resolver: Resolver): SymbolDefinition | null {
    if (meta.classes[symbolName]) {
        return getClassDefinition(meta, symbolName, resolver);
    }
    return null;
}

function getClassDefinition(meta: StylableMeta, symbolName: string, resolver: Resolver): ClassDefinition {
    debugger;
    console.log('symbolname', symbolName)
    console.log('stylesheet', JSON.stringify(meta))
    let states: StateDefinition[] = [];
    if (meta.classes[symbolName]["-st-states"]) {
        meta.classes[symbolName]["-st-states"]!.map((state) => {
            states.push({
                name: state,
                export: symbolName,
                from: meta.source,
                type: 'state'
            })
        })
    }
    const type: string | undefined = meta.classes[symbolName]["-st-extends"] ? meta.classes[symbolName]["-st-extends"]!.name : undefined
    console.log('type', type)
    if (type) {
        console.log(JSON.stringify(meta))
        const symbols = resolver.resolveSymbols(meta);
        console.log('symbols', JSON.stringify(symbols))
        if (symbols[type]) {
            console.log('calling internal')
            const internalClassDef = getClassDefinition(symbols[type], 'root', resolver);
            states = states.concat(internalClassDef.states);
        }
    }
    return {
        export: symbolName,
        type: "class",
        states
    }
}
