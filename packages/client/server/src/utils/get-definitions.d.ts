import { Resolver, Stylesheet } from 'stylable';
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
export declare function isDefinition(definition: any): definition is SymbolDefinition;
export declare function isClassDefinition(definition: any): definition is ClassDefinition;
export declare function isStateDefinition(definition: any): definition is StateDefinition;
export declare function getDefinition(stylesheet: Stylesheet, symbolName: string, resolver: Resolver): SymbolDefinition | null;
