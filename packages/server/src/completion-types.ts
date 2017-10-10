import { ProviderRange } from './completion-providers';
import { valueMapping } from 'stylable'

export class Completion {
    constructor(public label: string, public detail: string = "", public sortText: string = 'd', public insertText: string | snippet = label,
        public range: ProviderRange, public additionalCompletions: boolean = false) {
    }
}

export class snippet {
    constructor(public source: string) { }
}

export const importDirectives = {
    from: valueMapping.from,
    default: valueMapping.default,
    named: valueMapping.named,
    theme: valueMapping.theme
}

export const rulesetDirectives = {
    extends: valueMapping.extends,
    mixin: valueMapping.mixin,
    states: valueMapping.states,
    variant: valueMapping.variant
}

export const topLevelDirectives = {
    root: '.root' as '.root',
    namespace: '@namespace' as '@namespace',
    // customSelector: '@customSelector :--' as '@customSelector :--',
    vars: ':vars' as ':vars',
    import: ':import' as ':import'
}

//syntactic

export function importInternalDirective(type: keyof typeof importDirectives, rng: ProviderRange) {
    switch (importDirectives[type]) {
        case valueMapping.default: return new Completion(valueMapping.default + ':', 'Default export name', 'a', new snippet(valueMapping.default + ': $1;'), rng);
        case valueMapping.from: return new Completion(valueMapping.from + ':', 'Path to library', 'a', new snippet(valueMapping.from + ': "$1";'), rng);
        case valueMapping.named: return new Completion(valueMapping.named + ':', 'Named export name', 'a', new snippet(valueMapping.named + ': $1;'), rng);
        case valueMapping.theme: return new Completion(valueMapping.theme + ':', 'Declare a theme', 'a', new snippet(valueMapping.theme + ': true;\n$0'), rng);
    }
}

export function rulesetInternalDirective(type: keyof typeof rulesetDirectives, rng: ProviderRange) {
    switch (rulesetDirectives[type]) {
        case valueMapping.extends: return new Completion(valueMapping.extends + ':', 'Extend an external component', 'a', new snippet('-st-extends: $1;'), rng, true);
        case valueMapping.mixin: return new Completion(valueMapping.mixin + ':', 'Apply mixins on the class', 'a', new snippet('-st-mixin: $1;'), rng);
        case valueMapping.states: return new Completion(valueMapping.states + ':', 'Define the CSS states available for this class', 'a', new snippet('-st-states: $1;'), rng);
        case valueMapping.variant: return new Completion(valueMapping.variant + ':', 'Is a variant', 'a', new snippet('-st-variant: true;'), rng);
    }
}

export function topLevelDirective(type: keyof typeof topLevelDirectives, rng: ProviderRange) {
    switch (topLevelDirectives[type]) {
        case topLevelDirectives.import: return new Completion(topLevelDirectives.import, 'Import an external library', 'a', new snippet(':import {\n\t-st-from: "$1";\n}$0'), rng);
        case topLevelDirectives.namespace: return new Completion(topLevelDirectives.namespace, 'Declare a namespace for the file', 'a', new snippet('@namespace "$1";\n$0'), rng);
        case topLevelDirectives.root: return new Completion(topLevelDirectives.root, 'The root class', 'b', undefined, rng);
        case topLevelDirectives.vars: return new Completion(topLevelDirectives.vars, 'Declare variables', 'a', new snippet(':vars {\n\t$1\n}$0'), rng);
    }
}

export function valueDirective(rng: ProviderRange) {
    return new Completion('value()', 'Use the value of a variable', 'a', new snippet(' value($1)$0'), rng);
}

//semantic
export function classCompletion(className: string, rng: ProviderRange, removeDot: boolean = false) {
    return new Completion((removeDot ? '' : '.') + className, 'Stylable class or tag', 'b', undefined, rng)
}

export function extendCompletion(symbolName: string, rng: ProviderRange) {
    return new Completion(symbolName, 'Stylable class or tag', 'a', new snippet(' ' + symbolName + ';\n'), rng)
}

export function namedCompletion(symbolName: string, rng: ProviderRange, comma?: boolean) {
    return new Completion(symbolName, 'Stylable class or tag', 'a', new snippet((comma ? ', ' : ' ') + symbolName), rng)
}

export function pseudoElementCompletion(elementName: string, from: string, rng: ProviderRange) {
    return new Completion('::' + elementName, 'from: ' + from, 'b', '::' + elementName, rng)
}

export function stateCompletion(stateName: string, from: string, rng: ProviderRange) {
    return new Completion(':' + stateName, 'from: ' + from, 'a', new snippet(':' + stateName), rng);
}
