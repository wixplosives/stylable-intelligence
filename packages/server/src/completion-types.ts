import {ProviderRange} from './completion-providers';
import {valueMapping} from 'stylable'

export class Completion {
    constructor(public label: string, public detail: string = "", public sortText: string = 'd', public insertText: string | snippet = label,
        public range?: ProviderRange, public additionalCompletions: boolean = false) {
    }
}

export class snippet {
    constructor(public source: string) { }
}

//syntactic
export function defaultDirective(rng: ProviderRange) {
    return new Completion('-st-default:', 'Default object export name', 'a', new snippet('-st-default: $1;'), rng);
}

export function extendsDirective(rng: ProviderRange) {
    return new Completion(valueMapping.extends + ':', 'Extend an external component', 'a', new snippet('-st-extends: $1;'), rng, true);
}

export function fromDirective(rng: ProviderRange) {
    return new Completion('-st-from:', 'Path to library', 'a', new snippet('-st-from: "$1";'), rng);
}

export function importsDirective(rng: ProviderRange) {
    return new Completion(':import', 'Import an external library', 'a', new snippet(':import {\n\t-st-from: "$1";\n}$0'), rng);
}

export function mixinDirective(rng: ProviderRange) {
    return new Completion('-st-mixin:', 'Apply mixins on the class', 'a', new snippet('-st-mixin: $1;'), rng);
}

export function namedDirective(rng: ProviderRange) {
    return new Completion('-st-named:', 'Named object export name', 'a', new snippet('-st-named: $1;'), rng);
}

export function namespaceDirective(rng: ProviderRange) {
    return new Completion('@namespace', 'Declare a namespace for the file', 'a', new snippet('@namespace "$1";\n$0'), rng);
}

export function rootClass(rng: ProviderRange) {
    return new Completion('.root', 'The root class', 'b', undefined, rng);
}

export function statesDirective(rng: ProviderRange) {
    return new Completion('-st-states:', 'Define the CSS states available for this class', 'a', new snippet('-st-states: $1;'),rng);
}

export function themeDirective(rng: ProviderRange) {
    return new Completion('-st-theme:', 'Declare a theme', 'a', new snippet('-st-theme: true;\n$0'),rng);
}

export function variantDirective(rng: ProviderRange) {
    return new Completion('-st-variant:', '', 'a', new snippet('-st-variant: true;'),rng);
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
