// import { importDefaultDirectiveCompletion, importDirectiveCompletion } from '../test-kit/asserters';
import { StylableMeta, SRule, valueMapping, ClassSymbol, CSSResolve } from 'stylable';
import { CursorPosition, SelectorChunk, SelectorInternalChunk } from "./utils/selector-analyzer";
import {
    classCompletion, extendCompletion, namedCompletion, pseudoElementCompletion, stateCompletion, importInternalDirective,
    Completion, importDirectives, rulesetDirectives, rulesetInternalDirective, topLevelDirective, topLevelDirectives
} from './completion-types'
import { isContainer, isDeclaration } from './utils/postcss-ast-utils';
import * as PostCss from 'postcss';


export interface ProviderOptions {
    meta: StylableMeta,
    lastRule: SRule | null,
    trimmedLine: string,
    postDirectiveSpaces: number,
    postValueSpaces: number,
    position: ProviderPosition,
    isTopLevel: boolean,
    isLineStart: boolean,
    isImport: boolean,
    resolvedImport: StylableMeta | null
    insideSimpleSelector: boolean,
    resolved: CSSResolve[],
    currentSelector: string,
    target: CursorPosition
    isMediaQuery: boolean,
    fakes: PostCss.Rule[],
    pseudo: string | null,
    resolvedPseudo: CSSResolve[],
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

function createDirectiveRange(options: ProviderOptions): ProviderRange {
    return new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position);
}

//Providers
//Syntactic

const importDeclarations: (keyof typeof importDirectives)[] = ['default', 'named', 'from', 'theme']
const simpleRulesetDeclarations: (keyof typeof rulesetDirectives)[] = ['extends', 'states', 'variant']
const topLevelDeclarations: (keyof typeof topLevelDirectives)[] = ['root', 'namespace', 'vars', 'import']

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
                simpleRulesetDeclarations.forEach(type => {
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
                    .filter(d => topLevelDirectives[d].startsWith(options.trimmedLine))
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


//Semantic

export class SelectorCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !options.trimmedLine.endsWith(':')) {
            let comps: Completion[] = [];
            comps.push(...Object.keys(options.meta.classes)
                .filter(k => k !== 'root' && options.fakes.findIndex(f => f.selector === '.' + k) === -1) //not root, not local broken class
                .map(c => classCompletion(c, (createDirectiveRange(options)))));
            return options.meta.imports.reduce((acc: Completion[], imp) => {
                acc.push(classCompletion(imp.defaultExport, createDirectiveRange(options), true));
                Object.keys(imp.named).forEach(exp => acc.push(classCompletion(imp.named[exp], (createDirectiveRange(options)))));
                return acc;
            }, comps)

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
            let value = options.trimmedLine.slice((valueMapping.named + ':').length);


            // let spaces = value.search(/\S|$/);
            // let str = value.slice(spaces);

            let names = value.split(',').map(x => x.trim());
            let lastName = names.reverse()[0];
            let multival: boolean = false;

            let comps: string[] = Object.keys(options.resolvedImport.mappedSymbols)
                .filter(ms => options.resolvedImport!.mappedSymbols[ms]._kind === 'class' && ms !== 'root')
                .filter(ms => {
                    if (names.some(name => name === ms)) { multival = true };
                    return names.every(name => name !== ms);
                });
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
                (acc: string[][], t, ind) => acc.concat(collectElements(t, options, ind))
            )

            let offset = 0;
            if (options.trimmedLine.match(/:+/g)) {
                if (options.resolved.length > 0
                    && (options.resolved.find(r => r.symbol.name === options.currentSelector) as any).symbol[valueMapping.states]
                    && (Object.keys((options.resolved.find(r => r.symbol.name === options.currentSelector) as any).symbol[valueMapping.states]) || [])
                        .some(k => k === options.trimmedLine.split(':').reverse()[0])) {
                    offset = 0;
                } else if (options.resolvedPseudo.length === 0) {
                    offset = (options.trimmedLine.split(':').reverse()[0].length + options.trimmedLine.match(/:/g)!.length)
                } else {
                    offset = options.trimmedLine.length - (options.trimmedLine.indexOf(options.resolvedPseudo[0].symbol.name) + options.resolvedPseudo[0].symbol.name.length)
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
            let states = collectSelectorParts(options.resolvedPseudo, options.resolved,
                (acc: string[][], t) => acc.concat(Object.keys((t.symbol as any)['-st-states'] || []).map(s => [s, t.meta.source])
                ))
            return states.reduce((acc: Completion[], st) => {
                if (Array.isArray(options.target.focusChunk)
                    ? options.target.focusChunk.every(c => c.states.indexOf(st[0]) === -1)
                    : (options.target.focusChunk as SelectorChunk).states.indexOf(st[0]) === -1
                ) {
                    acc.push(stateCompletion(st[0], st[1], (new ProviderRange(
                        new ProviderPosition(options.position.line, Math.max(0, options.position.character - (options.trimmedLine.endsWith(':') ? 1 : 0))), options.position)
                    )));
                }
                return acc;
            }, [])
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

function collectElements(t: CSSResolve, options: ProviderOptions, ind: number) {
    if (ind === 0) { return [] };
    if (!t.symbol) { return [] };
    if (!(t.symbol as ClassSymbol)[valueMapping.root]) { return [] };
    return Object.keys((t.meta.classes) || [])
        .filter(s => s !== 'root' && s !== options.currentSelector)
        .filter(s => {
            if (Object.keys((options.resolved.find(r => r.symbol.name === options.currentSelector) as any).symbol[valueMapping.states] || [])
                .some(k => k === options.trimmedLine.split(':').reverse()[0])) {
                return true;
            }
            if (/:/.test(options.trimmedLine) &&
                (!options.pseudo || (options.pseudo && !options.trimmedLine.endsWith(':') && !options.trimmedLine.endsWith(options.pseudo)))
            ) {
                return s.startsWith(options.trimmedLine.split(':').reverse()[0]);
            } else {
                return true;
            }
        })
        .filter(s => {
            return Array.isArray(options.target.focusChunk)
                ? options.target.focusChunk.every((c: SelectorInternalChunk) => { return !c.name || c.name !== s })
                : !(options.target.focusChunk as SelectorInternalChunk).name || (options.target.focusChunk as SelectorInternalChunk).name !== s;
        })
        .map(s => [s, options.resolved.find(r => r.symbol.name === options.currentSelector)!.meta.imports[0].fromRelative])
}

function collectSelectorParts(value: CSSResolve[], defaultVal: CSSResolve[], reducer: (acc: string[][], t: CSSResolve, ind: number) => string[][]): string[][] {
    return value.length > 0
        ? value.reduce(reducer, [])
        : defaultVal.reduce(reducer, []);
}

