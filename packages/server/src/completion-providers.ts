import { StylableMeta, SRule, valueMapping, ClassSymbol, CSSResolve, VarSymbol, ImportSymbol } from 'stylable';
import { CursorPosition, SelectorInternalChunk } from "./utils/selector-analyzer";
import {
    classCompletion,
    Completion,
    extendCompletion,
    globalCompletion,
    importDirectives,
    importInternalDirective,
    cssMixinCompletion,
    namedCompletion,
    pseudoElementCompletion,
    rulesetDirectives,
    rulesetInternalDirective,
    stateCompletion,
    topLevelDirective,
    topLevelDirectives,
    valueCompletion,
    valueDirective,
    codeMixinCompletion,
} from './completion-types';
import { isContainer, isDeclaration } from './utils/postcss-ast-utils';
import * as PostCss from 'postcss';
import * as path from 'path';
import Provider, { extractTsSignature, extractJsModifierRetrunType } from './provider';
import { TypeReferenceNode, Identifier } from 'typescript';
import { MinimalDocs } from '../dist/src/provider-factory';



export interface ProviderOptions {
    meta: StylableMeta,
    docs: MinimalDocs,
    lastRule: SRule | null,
    trimmedLine: string,
    wholeLine: string,
    postDirectiveSpaces: number,
    postValueSpaces: number,
    position: ProviderPosition,
    isTopLevel: boolean,
    isLineStart: boolean,
    isImport: boolean,
    isNamedValueLine: boolean,
    namedValues: string[],
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

export class ProviderLocation {
    constructor(public uri: string, public range: ProviderRange) { }
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

export function createRange(startLine: number, startPos: number, endline: number, endPos: number) {
    return new ProviderRange(new ProviderPosition(startLine, startPos), new ProviderPosition(endline, endPos));
}

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




//Providers
//Syntactic

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

export class GlobalCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !options.trimmedLine.endsWith('::')) {
            if (options.isLineStart) {
                return [globalCompletion(
                    new ProviderRange(
                        new ProviderPosition(
                            options.position.line,
                            options.position.character - options.trimmedLine.length
                        ),
                        options.position
                    )
                )];
            } else {
                let offset = 0;
                if (options.wholeLine.lastIndexOf(':') !== -1) {
                    if (this.text[0].startsWith(options.trimmedLine.slice(options.trimmedLine.lastIndexOf(':')))) {
                        offset = options.trimmedLine.slice(options.trimmedLine.lastIndexOf(':')).length;
                    }
                }


                return [globalCompletion(
                    new ProviderRange(
                        new ProviderPosition(
                            options.position.line,
                            options.position.character - offset
                        ),
                        options.position
                    )
                )];
            }
        } else {
            return [];
        }
    }
    text: string[] = [':global()']
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
            let moreComps = options.meta.imports
                .filter(imp => imp.fromRelative.endsWith('st.css'))
                .reduce((acc: Completion[], imp) => {
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
            let comps: string[][] = [[]];
            comps.push(...Object.keys(options.meta.classes).filter(s => s.startsWith(str)).map(s => [s, 'Local file']))
            options.meta.imports.forEach(i => { if (i.defaultExport && i.defaultExport.startsWith(str)) { comps.push([i.defaultExport, i.fromRelative]) } })
            options.meta.imports.forEach(i => comps.push(...Object.keys(i.named).filter(s => s.startsWith(str)).map(s => [s, i.fromRelative])))
            return comps.slice(1).map(c => extendCompletion(
                c[0],
                c[1],
                new ProviderRange(
                    new ProviderPosition(options.position.line, options.position.character - str.length),
                    options.position
                ),
            ));
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

export class CssMixinCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.trimmedLine.startsWith(valueMapping.mixin + ':')) {
            let valueStart = options.wholeLine.indexOf(':') + 1;
            let value = options.wholeLine.slice(valueStart);
            let names = value.split(',').map(x => x.trim()).filter(x => x !== '');
            let lastName = /,\s*$/.test(options.wholeLine)
                ? ''
                : names.reverse()[0] || '';

            return Object.keys(options.meta.mappedSymbols)
                .filter(ms => ((options.meta.mappedSymbols[ms]._kind === 'import' && (options.meta.mappedSymbols[ms] as ImportSymbol).import.fromRelative.endsWith('st.css')) || options.meta.mappedSymbols[ms]._kind === 'class'))
                .filter(ms => ms.startsWith(lastName))
                .filter(ms => names.indexOf(ms) === -1)
                .map(ms => {
                    return cssMixinCompletion(
                        ms,
                        new ProviderRange(
                            new ProviderPosition(options.position.line, options.position.character - lastName.length),
                            options.position
                        ),
                        options.meta.mappedSymbols[ms]._kind === 'import' ? (options.meta.mappedSymbols[ms] as ImportSymbol).import.fromRelative : 'Local file'
                    )
                });
        } else {
            return [];
        }

    }
    text: string[] = [''];
}

export class CodeMixinCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.meta.imports.some(imp => imp.fromRelative.endsWith('.ts') || imp.fromRelative.endsWith('.js')) && options.trimmedLine.startsWith(valueMapping.mixin + ':')) {
            if (options.wholeLine.lastIndexOf('(') > options.wholeLine.lastIndexOf(')')) { return [] }


            let valueStart = options.wholeLine.indexOf(':') + 1;
            let value = options.wholeLine.slice(valueStart);
            let regs = value.trim().match(/((\w+)(\([\w"' ,]*\),))+/g);
            let names: string[] = [];
            if (regs) { names = regs.map(r => r.slice(0, r.indexOf('('))) }
            if (value.indexOf(',') !== -1) {
                names.push(value.slice(value.lastIndexOf(',') + 1).trim());
            } else {
                names.push(value.trim())
            }

            let lastName = /,\s*$/.test(options.wholeLine)
                ? ''
                : (names || []).reverse()[0] || '';

            return Object.keys(options.meta.mappedSymbols)
                .filter(ms => options.meta.mappedSymbols[ms]._kind === 'import')
                .filter(ms => ms.startsWith(lastName))
                .filter(ms => !names || names.indexOf(ms) === -1)
                .filter(ms => {
                    if ((options.meta.mappedSymbols[ms] as ImportSymbol).import.fromRelative.endsWith('.ts')) {
                        let sig = extractTsSignature((options.meta.mappedSymbols[ms] as ImportSymbol).import.from, ms, (options.meta.mappedSymbols[ms] as ImportSymbol).type === 'default')
                        if (!sig) { return false; }
                        let rtype = sig.declaration.type
                            ? ((sig.declaration.type as TypeReferenceNode).typeName as Identifier).getText()
                            : "";
                        if (/(\w+.)?stCssFrag/.test(rtype.trim())) { return true; }
                        return false;
                    }
                    if ((options.meta.mappedSymbols[ms] as ImportSymbol).import.fromRelative.endsWith('.js')) {
                        if (extractJsModifierRetrunType(ms, 0, options.docs.get('file://' + (options.meta.mappedSymbols[ms] as ImportSymbol).import.from).getText()) === 'stCssFrag')
                        {
                            return true;
                        }
                    }
                    return false;
                })
                .map(ms => {
                    return codeMixinCompletion(
                        ms,
                        new ProviderRange(
                            new ProviderPosition(options.position.line, options.position.character - lastName.length),
                            options.position
                        ),
                        (options.meta.mappedSymbols[ms] as ImportSymbol).import.fromRelative
                    )
                });
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

export class FormatterCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (!options.isTopLevel && options.wholeLine.includes(':') && options.wholeLine.indexOf(':') < options.position.character
            && !options.trimmedLine.startsWith(valueMapping.mixin + ':')
            && options.meta.imports.some(imp => imp.fromRelative.endsWith('.ts') || imp.fromRelative.endsWith('.js'))) {
            let valueStart = options.wholeLine.indexOf(':') + 1;
            let value = options.wholeLine.slice(valueStart);
            let regs = value.trim().match(/((\w+)(\([\w"' ,]*\),))+/g);
            let names: string[] = [];
            if (regs) { names = regs.map(r => r.slice(0, r.indexOf('('))) }
            if (value.indexOf(',') !== -1) {
                names.push(value.slice(value.lastIndexOf(',') + 1).trim());
            } else {
                names.push(value.trim())
            }

            let lastName = /,\s*$/.test(options.wholeLine)
                ? ''
                : (names || []).reverse()[0] || '';

            return Object.keys(options.meta.mappedSymbols)
                .filter(ms => (options.meta.mappedSymbols[ms]._kind === 'import'))
                .filter(ms => ms.startsWith(lastName))
                .filter(ms => !names || names.indexOf(ms) === -1)
                .filter(ms => {
                    if ((options.meta.mappedSymbols[ms] as ImportSymbol).import.fromRelative.endsWith('.ts')) {
                        let sig = extractTsSignature((options.meta.mappedSymbols[ms] as ImportSymbol).import.from, ms, (options.meta.mappedSymbols[ms] as ImportSymbol).type === 'default')
                        if (!sig) { return false; }
                        let rtype = sig.declaration.type
                            ? ((sig.declaration.type as TypeReferenceNode).typeName as Identifier).getText()
                            : "";
                        if (/(\w+.)?stCssFrag/.test(rtype.trim())) { return false; }
                        return true;
                    }
                    if ((options.meta.mappedSymbols[ms] as ImportSymbol).import.fromRelative.endsWith('.js')) {
                        if (extractJsModifierRetrunType(ms, 0, options.docs.get('file://' + (options.meta.mappedSymbols[ms] as ImportSymbol).import.from).getText()) !== 'stCssFrag')
                        {
                            return true;
                        }
                    }
                    return false;
                })
                .map(ms => {
                    return codeMixinCompletion(
                        ms,
                        new ProviderRange(
                            new ProviderPosition(options.position.line, options.position.character - lastName.length),
                            options.position
                        ),
                        (options.meta.mappedSymbols[ms] as ImportSymbol).import.fromRelative
                    )
                });

        } else {
            return [];
        }
    }
    text: string[] = [''];
}

export class NamedCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isNamedValueLine && options.resolvedImport) {

            let valueStart = options.wholeLine.indexOf(':') + 1;
            let value = options.wholeLine.slice(valueStart);
            let names = value.split(',').map(x => x.trim()).filter(x => x !== '');
            let lastName = /,\s*$/.test(options.wholeLine)
                ? ''
                : names.reverse()[0] || '';

            let comps: string[][] = [[]];
            comps.push(
                ...Object.keys(options.resolvedImport.mappedSymbols)
                    .filter(ms => (options.resolvedImport!.mappedSymbols[ms]._kind === 'class' || options.resolvedImport!.mappedSymbols[ms]._kind === 'var') && ms !== 'root')
                    .filter(ms => ms.slice(0, -1).startsWith(lastName))
                    .filter(ms => ms === '' || options.namedValues.every(name => name !== ms))
                    .map(ms => [
                        ms,
                        path.relative(options.meta.source, options.resolvedImport!.source).slice(1).replace('\\', '/'),
                        options.resolvedImport!.mappedSymbols[ms]._kind === 'var' ? (options.resolvedImport!.mappedSymbols[ms] as VarSymbol).value : 'Stylable class'
                    ])
            )


            return comps.slice(1).map(c => namedCompletion(
                c[0],
                new ProviderRange(
                    new ProviderPosition(options.position.line, options.position.character - lastName.length),
                    new ProviderPosition(options.position.line, options.position.character)
                ),
                c[1],
                c[2]
            ));
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

export class PseudoElementCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && options.resolved.length > 0) {
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
                if (v.name.startsWith(inner) && !options.wholeLine.slice(0, options.wholeLine.indexOf(':')).includes(v.name)) {
                    comps.push(valueCompletion(v.name, 'Local variable', v.value, new ProviderRange(
                        new ProviderPosition(options.position.line, options.position.character - inner.length),
                        options.position,
                    )))
                }
            })
            options.importVars.forEach(v => {
                if (v.name.startsWith(inner) && options.meta.imports.some(imp => Object.keys(imp.named).some(key => key === v.name))) {
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
    // if (ind === 0) { return [] };
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
        .map(s => [s, arr.find(r => r.symbol.name === (options.pseudo ? options.pseudo : options.currentSelector) && (options.currentSelector !== 'root' || !options.customSelectorType))
            ? arr.find(r => r.symbol.name === (options.pseudo ? options.pseudo : options.currentSelector))!.meta.imports[0].fromRelative
            : arr.find(r => r.symbol.name === options.customSelectorType)
                ? arr.find(r => r.symbol.name === options.customSelectorType)!.meta.imports.length > 0
                    ? arr.find(r => r.symbol.name === options.customSelectorType)!.meta.imports.find(i => i.defaultExport === options.customSelectorType)!.fromRelative
                    : 'Local file'
                : 'Local file']

        )
}

function collectStates(t: CSSResolve, options: ProviderOptions, ind: number, arr: CSSResolve[]) {
    let lastState = '';
    if (/[^:]:(\w+):?$/.test(options.trimmedLine)) {
        lastState = options.trimmedLine.match(/[^:]:(\w+):?$/)![1];
    } else if (/::(\w+):?$/.test(options.trimmedLine)) {
        let lastPseudo = options.trimmedLine.match(/::(\w+):?$/)![1];
        if (lastPseudo !== options.pseudo && lastPseudo !== options.customSelector.slice(3)) {
            lastState = lastPseudo;
        }
    }

    let existing = arr.reduce((acc: string[], cur) => {
        if ((cur.symbol as ClassSymbol)[valueMapping.states]) {
            Object.keys((cur.symbol as any)[valueMapping.states]).forEach(s => acc.push(s))
        }
        return acc;
    }, [])
    let candidates = Object.keys((t.symbol as any)['-st-states'] || {});

    return candidates
        .filter(s => {
            if (Array.isArray(options.target.focusChunk)
                ? options.target.focusChunk.some(c => c.states.some(state => state === s))
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
        .map(s => {
            return [s, path.relative(options.meta.source, t.meta.source).slice(1).replace('\\', '/') || 'Local file']
        })
}

function collectSelectorParts(value: CSSResolve[], defaultVal: CSSResolve[], reducer: (acc: string[][], t: CSSResolve, ind: number, arr: CSSResolve[]) => string[][]): string[][] {
    return value.length > 0
        ? value.reduce(reducer, [])
        : defaultVal.reduce(reducer, []);
}

