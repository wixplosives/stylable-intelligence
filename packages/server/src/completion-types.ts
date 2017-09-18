import { ProviderRange } from './completion-providers';
import { valueMapping } from 'stylable'

export class Completion {
    constructor(public label: string, public detail: string = "", public sortText: string = 'd', public insertText: string | snippet = label,
        public range?: ProviderRange, public additionalCompletions: boolean = false) {
    }
}

export class snippet {
    constructor(public source: string) { }
}

//syntactic

export function extendsDirective(rng: ProviderRange) {
    return new Completion(valueMapping.extends + ':', 'Extend an external component', 'a', new snippet('-st-extends: $1;'), rng, true);
}

export function importsDirective(rng: ProviderRange) {
    return new Completion(':import', 'Import an external library', 'a', new snippet(':import {\n\t-st-from: "$1";\n}$0'), rng);
}

export type ValMap = typeof valueMapping;
export function importInternalDirective(type: keyof ValMap, rng: ProviderRange) {
    switch (valueMapping[type]) {
        case valueMapping.default: return new Completion(valueMapping.default + ':', 'Default export name', 'a', new snippet(valueMapping.default + ': $1;'), rng);
        case valueMapping.from: return new Completion(valueMapping.from + ':', 'Path to library', 'a', new snippet(valueMapping.from + ': "$1";'), rng);
        case valueMapping.named: return new Completion(valueMapping.named + ':', 'Named export name', 'a', new snippet(valueMapping.named + ': $1;'), rng);
        case valueMapping.theme: return new Completion(valueMapping.theme + ':', 'Declare a theme', 'a', new snippet(valueMapping.theme + ': true;\n$0'), rng);
        default: return null;
    }
}

export function mixinDirective(rng: ProviderRange) {
    return new Completion('-st-mixin:', 'Apply mixins on the class', 'a', new snippet('-st-mixin: $1;'), rng);
}

export function namespaceDirective(rng: ProviderRange) {
    return new Completion('@namespace', 'Declare a namespace for the file', 'a', new snippet('@namespace "$1";\n$0'), rng);
}

export function rootClass(rng: ProviderRange) {
    return new Completion('.root', 'The root class', 'b', undefined, rng);
}

export function statesDirective(rng: ProviderRange) {
    return new Completion('-st-states:', 'Define the CSS states available for this class', 'a', new snippet('-st-states: $1;'), rng);
}

export function variantDirective(rng: ProviderRange) {
    return new Completion('-st-variant:', '', 'a', new snippet('-st-variant: true;'), rng);
}

export function varsDirective(rng: ProviderRange) {
    return new Completion(':vars', 'Declare variables', 'a', new snippet(':vars {\n\t$1\n}$0'), rng);
}


//semantic
export function classCompletion(className: string, rng: ProviderRange, removeDot: boolean = false) {
    return new Completion((removeDot ? '' : '.') + className, 'Stylable class or tag', 'b', undefined, rng)
}

export function extendCompletion(symbolName: string, rng: ProviderRange) {
    return new Completion(symbolName, 'Stylable class or tag', 'a', new snippet(' ' + symbolName + ';\n'), rng)
}

export function namedCompletion(symbolName: string, rng: ProviderRange) {
    return new Completion(symbolName, 'Stylable class or tag', 'a', new snippet(' ' + symbolName), rng)
}

export function pseudoElementCompletion(elementName: string, from: string, rng: ProviderRange) {
    return new Completion('::' + elementName, 'from: ' + from, 'b', '::' + elementName, rng)
}

export function stateCompletion(stateName: string, from: string, rng: ProviderRange) {
    return new Completion(':' + stateName, 'from: ' + from, 'a', new snippet(':' + stateName), rng);
}
