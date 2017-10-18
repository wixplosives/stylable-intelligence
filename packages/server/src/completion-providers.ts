import { StylableMeta, SRule, valueMapping, ClassSymbol, CSSResolve } from 'stylable';
import { CursorPosition, SelectorInternalChunk } from "./utils/selector-analyzer";
import {
    classCompletion,
    Completion,
    extendCompletion,
    importDirectives,
    importInternalDirective,
    namedCompletion,
    pseudoElementCompletion,
    rulesetDirectives,
    rulesetInternalDirective,
    stateCompletion,
    topLevelDirective,
    topLevelDirectives,
    valueCompletion,
    valueDirective,
} from './completion-types';
import { isContainer, isDeclaration } from './utils/postcss-ast-utils';
import * as PostCss from 'postcss';


export interface ProviderOptions {
    meta: StylableMeta,
    lastRule: SRule | null,
    trimmedLine: string,
    wholeLine: string,
    postDirectiveSpaces: number,
    postValueSpaces: number,
    position: ProviderPosition,
    isTopLevel: boolean,
    isLineStart: boolean,
    isImport: boolean,
    isDirective: boolean,
    resolvedImport: StylableMeta | null
    insideSimpleSelector: boolean,
    resolved: CSSResolve[],
    currentSelector: string,
    target: CursorPosition
    isMediaQuery: boolean,
    hasNamespace: boolean
    fakes: PostCss.Rule[],
    pseudo: string | null,
    resolvedPseudo: CSSResolve[],
    customSelector: string,
    customSelectorType: string,
    isInValue: boolean,
    importVars: any[],
}

export interface CompletionProvider {
    provide(options: ProviderOptions): Completion[]
    text: string[];
}

export class ProviderPosition {
    constructor(public line: number, public character: number) { }
}

export class ProviderRange {
    constructor(public start: ProviderPosition, public end: ProviderPosition) { }
}

export function createRange(startLine: number, startPos: number, endline: number, endPos: number) {
    return new ProviderRange(new ProviderPosition(startLine, startPos), new ProviderPosition(endline, endPos));
}

const cssPseudoClasses = [
    'active',
    'any',
    'checked',
    'default',
    'dir()',
    'disabled',
    'empty',
    'enabled',
    'first',
    'first-child',
    'first-of-type',
    'fullscreen',
    'focus',
    'hover',
    'indeterminate',
    'in-range',
    'invalid',
    'lang()',
    'last-child',
    'last-of-type',
    'left',
    'link',
    'not()',
    'nth-child()',
    'nth-last-child()',
    'nth-last-of-type()',
    'nth-of-type()',
    'only-child',
    'only-of-type',
    'optional',
    'out-of-range',
    'read-only',
    'read-write',
    'required',
    'right',
    'root',
    'scope',
    'target',
    'valid',
    'visited',
];

// const cssPseudoElements = [
//     '::after',
//     '::before',
//     '::cue',
//     '::first-letter',
//     '::first-line',
//     '::selection',
// ]

//Providers
//Syntactic

function createDirectiveRange(options: ProviderOptions): ProviderRange {
    return new ProviderRange(
        new ProviderPosition(
            options.position.line,
            Math.max(0, options.position.character -
                (topLevelDirectives.customSelector.startsWith(options.wholeLine)
                    ? options.wholeLine.length
                    : options.trimmedLine.length))),
        options.position
    );
}

const importDeclarations: (keyof typeof importDirectives)[] = ['default', 'named', 'from', 'theme']
const simpleRulesetDeclarations: (keyof typeof rulesetDirectives)[] = ['extends', 'states', 'variant', 'mixin']
const topLevelDeclarations: (keyof typeof topLevelDirectives)[] = ['root', 'namespace', 'vars', 'import', 'customSelector']

export class ImportInternalDirectivesProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule && !options.isMediaQuery && isContainer(options.lastRule)) {
            const res: Completion[] = [];
            importDeclarations.forEach(type => {
                if (options.lastRule!.nodes!.every(n => isDeclaration(n) && importDirectives[type] !== n.prop)) {
                    res.push(importInternalDirective(type, createDirectiveRange(options)))
                }
            })
            return res;
        } else {
            return [];
        }
    }
    text = importDeclarations.map(name => importDirectives[name]);
}


export class RulesetInternalDirectivesProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let res: Completion[] = [];
        if (!options.isImport && options.isLineStart && options.lastRule && (isContainer(options.lastRule))) {
            if (options.lastRule.nodes!.every(n => isDeclaration(n) && rulesetDirectives.mixin !== n.prop)) {
                res.push(rulesetInternalDirective('mixin', createDirectiveRange(options)));
            }
            if (options.insideSimpleSelector && !options.isMediaQuery) {
                simpleRulesetDeclarations.filter(d => d !== 'mixin').forEach(type => {
                    if (options.lastRule!.nodes!.every(n => isDeclaration(n) && rulesetDirectives[type] !== n.prop)) {
                        res.push(rulesetInternalDirective(type, createDirectiveRange(options)))
                    }
                })
            }
            return res;
        } else {
            return [];
        }
    }
    text = simpleRulesetDeclarations.map(name => rulesetDirectives[name]);
}

export class TopLevelDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && options.isLineStart) {
            if (!options.isMediaQuery) {
                return topLevelDeclarations
                    .filter(d => options.hasNamespace ? (d !== 'namespace') : true)
                    .filter(d => topLevelDirectives[d].startsWith(options.trimmedLine) || topLevelDirectives[d].startsWith(options.wholeLine))
                    .map(d => topLevelDirective(d, createDirectiveRange(options)));
            } else {
                return [topLevelDirective('root', createDirectiveRange(options))]
            }
        } else {
            return [];
        }
    }
    text = topLevelDeclarations.map(name => topLevelDirectives[name]);
}

export class ValueDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (!options.isTopLevel && !options.isDirective && !this.isInsideValueDirective(options.wholeLine, options.position.character)
            && options.wholeLine.indexOf(':') !== -1 && this.text.some(t => {
                return t.startsWith(options.wholeLine.slice(options.wholeLine.indexOf(':') + 1).trim()) || t.startsWith(options.wholeLine.slice(options.wholeLine.lastIndexOf(',') + 1).trim())
            })) {
            return [valueDirective(new ProviderRange(
                new ProviderPosition(
                    options.position.line,
                    options.wholeLine.includes(',')
                        ? options.wholeLine.lastIndexOf(',') + 1
                        : options.wholeLine.indexOf(':') + 1),
                options.position
            ))]
        } else {
            return [];
        }
    }
    text: string[] = ['value()']

    isInsideValueDirective(wholeLine: string, pos: number) {
        if (!/value\(/.test(wholeLine)) { return false }
        let line = wholeLine.slice(0, pos).slice(wholeLine.lastIndexOf('value('));
        let stack = 0;
        for (let i = 0; i <= line.length; i++) {
            if (line[i] === '(') {
                stack += 1
            } else if (line[i] === ')') {
                stack -= 1
            }
        }
        return stack > 0;
    }


}



//Semantic

export class SelectorCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && (options.trimmedLine === ':' || !options.trimmedLine.endsWith(':'))) {
            let comps: Completion[] = [];
            comps.push(...Object.keys(options.meta.classes)
                .filter(k => k !== 'root' && options.fakes.findIndex(f => f.selector === '.' + k) === -1)
                .map(c => classCompletion(c, (createDirectiveRange(options)))));
            comps.push(...Object.keys(options.meta.customSelectors)
                .map(c => classCompletion(c, (createDirectiveRange(options)), true)));
            let moreComps = options.meta.imports.reduce((acc: Completion[], imp) => {
                if (acc.every(comp => comp.label !== imp.defaultExport)) { acc.push(classCompletion(imp.defaultExport, createDirectiveRange(options), true)) };
                Object.keys(imp.named).forEach(exp => {
                    if (acc.every(comp => comp.label.replace('.', '') !== imp.named[exp])) {
                        acc.push(classCompletion(imp.named[exp], (createDirectiveRange(options))))
                    }
                });
                return acc;
            }, comps)
            return moreComps.filter(c => c.label.startsWith(options.trimmedLine));
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

export class ExtendCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.trimmedLine.startsWith(valueMapping.extends)) {
            let value = options.trimmedLine.slice((valueMapping.extends + ':').length);
            let spaces = value.search(/\S|$/);
            let str = value.slice(spaces);
            let comps: string[] = [];
            comps.push(...Object.keys(options.meta.classes).filter(s => s.startsWith(str)))
            options.meta.imports.forEach(i => { if (i.defaultExport && i.defaultExport.startsWith(str)) { comps.push(i.defaultExport) } })
            options.meta.imports.forEach(i => comps.push(...Object.keys(i.named).filter(s => s.startsWith(str))))
            return comps.map(c => extendCompletion(c, new ProviderRange(
                new ProviderPosition(options.position.line, options.position.character - str.length - options.postDirectiveSpaces),
                new ProviderPosition(options.position.line, Number.MAX_VALUE))));
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

export class NamedCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.trimmedLine.startsWith(valueMapping.named) && options.resolvedImport) {

            let valueStart = options.wholeLine.indexOf(':') + 1;
            let newPos = options.position.character - valueStart;
            let value = options.wholeLine.slice(valueStart);
            let names = value.split(',').map(x => x.trim());
            let multival: boolean = false;

            let comps: string[] = Object.keys(options.resolvedImport.mappedSymbols)
                .filter(ms => options.resolvedImport!.mappedSymbols[ms]._kind === 'class' && ms !== 'root')
                .filter(ms => {
                    if (names.some(name => name === ms)) { multival = true };
                    return names.every(name => name !== ms);
                });


            let next = value.slice(newPos, newPos + value.slice(newPos).indexOf(',')).trim();
            let prev = value.slice(value.slice(0, newPos).lastIndexOf(' '), newPos).trim()

            let isAfterColon: boolean = !value.slice(0, newPos).trim();
            let beforeValue: boolean = Object.keys(options.resolvedImport.mappedSymbols).some(ms => ms === next)
            let afterInitialString: boolean = !!prev && Object.keys(options.resolvedImport.mappedSymbols).some(ms => ms.startsWith(prev))
            // let betweenValues: boolean
            // let afterLastValue: boolean
            isAfterColon; beforeValue; afterInitialString;



            let lastName = names.reverse()[0];


            return comps.map(c => namedCompletion(
                c,
                new ProviderRange(
                    new ProviderPosition(options.position.line,
                        options.position.character
                        - (multival ? 0 : (lastName.length + options.postDirectiveSpaces))
                        - (value.endsWith(',') ? 1 : 0)
                        - (options.resolvedImport!.mappedSymbols[lastName] ? 0 : options.postValueSpaces)
                    ),
                    new ProviderPosition(options.position.line, Number.MAX_VALUE)
                ),
                multival
            ));
        } else {
            return [];
        }
    }
    text: string[] = [''];
}


export class PseudoElementCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && options.resolved.length > 0 && options.meta.imports.length > 0) {
            let pseudos = collectSelectorParts(
                options.resolvedPseudo,
                options.resolved,
                (acc: string[][], t, ind, arr) => acc.concat(collectElements(t, options, ind, arr))
            )

            if (pseudos.length === 0) {
                return [];
            }
            let offset = 0;

            if (options.trimmedLine.match(/:+/g)) {
                let trimmedPart = options.trimmedLine.replace(/:+$/, '').split(':').reverse()[0]
                if (trimmedPart.startsWith('--')) { trimmedPart = ':' + trimmedPart }
                if (options.resolved.length > 0 && options.resolved
                    .some(res => (
                        Object.keys((res as any).symbol[valueMapping.states] || {}).some((k: string) => k === trimmedPart)) ||
                        Object.keys((res as any).meta.customSelectors || {}).some((k: string) => k === trimmedPart))
                ) {
                    offset = options.trimmedLine.endsWith(':')
                        ? options.trimmedLine.endsWith('::') ? 2 : 1
                        : 0;
                } else if (options.resolvedPseudo.length > 0 && options.resolvedPseudo
                    .some(res => (
                        Object.keys((res as any).symbol[valueMapping.states] || {})
                            .some((k: string) => k === trimmedPart)))
                ) {
                    offset = options.trimmedLine.endsWith(':')
                        ? options.trimmedLine.endsWith('::') ? 2 : 1
                        : 0;
                } else if (cssPseudoClasses.indexOf(trimmedPart) !== -1) {
                    offset = options.trimmedLine.endsWith(':')
                        ? options.trimmedLine.endsWith('::') ? 2 : 1
                        : 0;
                } else if (options.trimmedLine.match(/:{1,2}\w*$/)) {
                    if (options.trimmedLine.endsWith(':')) {
                        offset = options.trimmedLine.match(/:+$/)![0].length;
                    } else {
                        if (trimmedPart === options.pseudo || trimmedPart === options.customSelector.slice(3)) {
                            offset = 0;
                        } else {
                            offset = 2 + options.trimmedLine.split('::').reverse()[0].length;
                        }
                    }
                } else {
                    offset = options.trimmedLine.length - (options.trimmedLine.indexOf(options.pseudo!) + options.pseudo!.length)
                }
            }
            return pseudos.reduce((acc: Completion[], p) => {
                acc.push(pseudoElementCompletion(p[0], p[1], (new ProviderRange(
                    new ProviderPosition(options.position.line,
                        Math.max(0, options.position.character - offset)
                    ), options.position)
                )));
                return acc;
            }, [])
        } else {
            return [];
        }
    }
    text: string[] = [''];
}


export class StateCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !options.trimmedLine.endsWith('::')) {
            let states = collectSelectorParts(
                options.resolvedPseudo,
                options.resolved,
                (acc: string[][], t, ind, arr) => acc.concat(collectStates(t, options, ind, arr))
            )
            if (states.length === 0) {
                return [];
            }

            let lastState = '';
            if (/[^:]:(\w+):?$/.test(options.trimmedLine)) {
                lastState = options.trimmedLine.match(/[^:]:(\w+):?$/)![1];
            }
            let realState = options.resolvedPseudo.length > 0
                ? options.resolvedPseudo.some(r => Object.keys((r.symbol as any)[valueMapping.states] || {}).indexOf(lastState) !== -1)
                : options.resolved.some(r => Object.keys((r.symbol as any)[valueMapping.states] || {}).indexOf(lastState) !== -1)

            return states.reduce((acc: Completion[], st) => {
                acc.push(stateCompletion(st[0], st[1], (new ProviderRange(
                    new ProviderPosition(
                        options.position.line,
                        lastState
                            ? realState
                                ? options.position.character - (options.trimmedLine.endsWith(':') ? 1 : 0)
                                : options.position.character - (lastState.length + 1) - (options.trimmedLine.endsWith(':') ? 1 : 0)
                            : options.position.character - (options.trimmedLine.endsWith(':') ? 1 : 0)
                    ),
                    options.position)
                )));
                return acc;
            }, [])
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

export class ValueCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isInValue) {
            let inner = options.wholeLine.slice(0, options.wholeLine.indexOf(')', options.position.character) + 1).slice(options.wholeLine.slice(0, options.wholeLine.indexOf(')', options.position.character) + 1).lastIndexOf('(')).replace('(', '').replace(')', '').trim();

            let comps: Completion[] = [];
            options.meta.vars.forEach(v => {
                if (v.name.startsWith(inner)) {
                    comps.push(valueCompletion(v.name, 'Local variable', v.value, new ProviderRange(
                        new ProviderPosition(options.position.line, options.position.character - inner.length),
                        options.position,
                    )))
                }
            })
            options.importVars.forEach(v => {
                if (v.name.startsWith(inner)) {
                    comps.push(valueCompletion(v.name, v.from, v.value, new ProviderRange(
                        new ProviderPosition(options.position.line, options.position.character - inner.length),
                        options.position,
                    )))
                }
            })
            return comps;
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

function collectElements(t: CSSResolve, options: ProviderOptions, ind: number, arr: CSSResolve[]) {
    if (ind === 0) { return [] };
    if (!t.symbol) { return [] };
    if (!(t.symbol as ClassSymbol)[valueMapping.root]) { return [] };
    return Object.keys((t.meta.classes) || [])
        .concat(Object.keys(t.meta.customSelectors).map(cs => cs.slice(3)) || [])
        .filter(s => s !== 'root')
        .filter(s => {
            if (arr
                .some(res => (
                    (Object.keys((res as any).symbol[valueMapping.states] || {}))
                        .some((k: string) => k === options.trimmedLine.split(':').reverse()[0])))
            ) {
                return true;
            }
            if (/[^^]:/.test(options.trimmedLine) &&
                ((!options.pseudo && !options.customSelector) ||
                    (
                        options.pseudo &&
                        !options.trimmedLine.endsWith(':') &&
                        !options.trimmedLine.endsWith(options.pseudo)
                    ) || (
                        options.customSelector &&
                        !options.trimmedLine.endsWith(':') &&
                        !options.trimmedLine.endsWith(options.customSelector.slice(3))
                    )
                )
            ) {
                return s.startsWith(options.trimmedLine.split(':').reverse()[0]) || cssPseudoClasses.indexOf(options.trimmedLine.split(':').reverse()[0]) !== -1;
            } else {
                return true;
            }
        })
        .filter(s => {
            return Array.isArray(options.target.focusChunk)
                ? options.target.focusChunk.every((c: SelectorInternalChunk) => { return !c.name || c.name !== s })
                : !(options.target.focusChunk as SelectorInternalChunk).name || (options.target.focusChunk as SelectorInternalChunk).name !== s;
        })
        .map(s => [s, arr.find(r => r.symbol.name === (options.pseudo ? options.pseudo : options.currentSelector) && (options.currentSelector !== 'root' || !options.customSelectorType))
            ? arr.find(r => r.symbol.name === (options.pseudo ? options.pseudo : options.currentSelector))!.meta.imports[0].fromRelative
            : arr.find(r => r.symbol.name === options.customSelectorType)!.meta.imports.find(i => i.defaultExport === options.customSelectorType)!.fromRelative])
}

function collectStates(t: CSSResolve, options: ProviderOptions, ind: number, arr: CSSResolve[]) {
    let lastState = '';
    if (/[^:]:(\w+):?$/.test(options.trimmedLine)) {
        lastState = options.trimmedLine.match(/[^:]:(\w+):?$/)![1];
    }

    let existing = arr.reduce((acc: string[], cur) => {
        if ((cur.symbol as any)[valueMapping.states]) {
            Object.keys((cur.symbol as any)[valueMapping.states]).forEach(s => acc.push(s))
        }
        return acc;
    }, [])
    let candidates = Object.keys((t.symbol as any)['-st-states'] || {});

    return candidates
        .filter(s => {
            if (Array.isArray(options.target.focusChunk)
                ? options.target.focusChunk.some((c: SelectorInternalChunk) => c.states.some(state => state === s))
                : (options.target.focusChunk as SelectorInternalChunk).states.some(state => state === s)) {
                return false;
            } else if (s.slice(0, -1).startsWith(lastState)) {
                return true;
            } else if (existing.some(c => (c === lastState) && (c !== s))) {
                return true;
            } else {
                return false;
            }
        })
        .map(s => [s, t.meta.source])
}

function collectSelectorParts(value: CSSResolve[], defaultVal: CSSResolve[], reducer: (acc: string[][], t: CSSResolve, ind: number, arr: CSSResolve[]) => string[][]): string[][] {
    return value.length > 0
        ? value.reduce(reducer, [])
        : defaultVal.reduce(reducer, []);
}

