import { StylableMeta, SRule, valueMapping, ClassSymbol, CSSResolve, VarSymbol, ImportSymbol, StylableResolver, Stylable } from 'stylable';
import { evalValue } from 'stylable/dist/src/functions'
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
import { isContainer, isDeclaration, isComment, isVars } from './utils/postcss-ast-utils';
import * as PostCss from 'postcss';
import * as path from 'path';
import Provider, { extractTsSignature, extractJsModifierRetrunType, isDirective } from './provider';
import { TypeReferenceNode, Identifier } from 'typescript';
import { MinimalDocs } from './provider-factory';
const pvp = require('postcss-value-parser');
import { nativePathToFileUri } from './utils/uri-utils';
import { Declaration } from 'postcss';


export interface ProviderOptions {
    meta: StylableMeta,
    docs: MinimalDocs,
    styl: Stylable,
    parentSelector: SRule | null,
    astAtCursor: PostCss.NodeBase,
    lineChunkAtCursor: string,
    fullLineText: string,
    position: ProviderPosition,
    isLineStart: boolean,
    isNamedValueLine: boolean,
    namedValues: string[],
    resolved: CSSResolve[],
    currentSelector: string,
    target: CursorPosition
    isMediaQuery: boolean,
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
                (topLevelDirectives.customSelector.startsWith(options.fullLineText)
                    ? options.fullLineText.length
                    : options.lineChunkAtCursor.length))),
        options.position
    );
}

const importDeclarations: (keyof typeof importDirectives)[] = ['default', 'named', 'from', 'theme']
const simpleRulesetDeclarations: (keyof typeof rulesetDirectives)[] = ['extends', 'states', 'variant', 'mixin']
const topLevelDeclarations: (keyof typeof topLevelDirectives)[] = ['root', 'namespace', 'vars', 'import', 'customSelector']




//Providers
//Syntactic

// Inside :import ruleset, which is not inside media query
// If directive doesn't already exist
export const ImportInternalDirectivesProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (options.parentSelector && options.parentSelector.selector === ':import' && !options.isMediaQuery && options.isLineStart) {
            const res: Completion[] = [];
            importDeclarations.forEach(type => {
                if (options.parentSelector!.nodes!.every(n => isDeclaration(n) && importDirectives[type] !== n.prop || isComment(n))) {
                    res.push(importInternalDirective(type, createDirectiveRange(options)))
                }
            })
            return res;
        } else {
            return [];
        }
    },
    text: importDeclarations.map(name => importDirectives[name])
}

// Inside ruleset, which is not :import or :vars
// Only inside simple selector, except -st-mixin
// If directive doesn't already exist
export const RulesetInternalDirectivesProvider: CompletionProvider & { isSimpleSelector: (sel: string) => boolean } = {
    provide(options: ProviderOptions): Completion[] {
        let res: Completion[] = [];
        if (options.isLineStart && options.parentSelector && !(options.parentSelector.selector === ':import' || options.parentSelector.selector === ':vars')) {
            if (options.parentSelector.nodes!.every(n => (isDeclaration(n) && rulesetDirectives.mixin !== n.prop) || isComment(n))) {
                res.push(rulesetInternalDirective('mixin', createDirectiveRange(options)))
            }
            if (this.isSimpleSelector(options.parentSelector.selector) && !options.isMediaQuery) {
                simpleRulesetDeclarations.filter(d => d !== 'mixin').forEach(type => {
                    if (options.parentSelector!.nodes!.every(n => (isDeclaration(n) && rulesetDirectives[type] !== n.prop) || isComment(n))) {
                        res.push(rulesetInternalDirective(type, createDirectiveRange(options)))
                    }
                })
            }
            return res;
        } else {
            return [];
        }
    },
    text: simpleRulesetDeclarations.map(name => rulesetDirectives[name]),
    isSimpleSelector(sel: string) {
        return !!/^\s*\.?[\w-]*$/.test(sel) //Only a single class or element
    }
}

// Only top level
// :vars, @namespace may not repeat
export const TopLevelDirectiveProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (!options.parentSelector && options.isLineStart) {
            if (!options.isMediaQuery) {
                return topLevelDeclarations
                    .filter(d => !/@namespace/.test((options.meta.ast.source.input as any).css) || (d !== 'namespace'))
                    .filter(d => topLevelDirectives[d].startsWith(options.lineChunkAtCursor) || topLevelDirectives[d].startsWith(options.fullLineText))
                    .map(d => topLevelDirective(d, createDirectiveRange(options)));
            } else {
                return [topLevelDirective('root', createDirectiveRange(options))]
            }
        } else {
            return [];
        }
    },
    text: topLevelDeclarations.map(name => topLevelDirectives[name])
}

// Inside ruleset, which is not :import
// RHS of declaration
// Declaration is not -st-directive (except -st-mixin)
// Not inside another value()
export const ValueDirectiveProvider: CompletionProvider & { isInsideValueDirective: (wholeLine: string, pos: number) => boolean } = {
    provide(options: ProviderOptions): Completion[] {
        if (options.parentSelector && !isDirective(options.fullLineText) && !this.isInsideValueDirective(options.fullLineText, options.position.character)
            && options.fullLineText.indexOf(':') !== -1) {
            const parsed = pvp(options.fullLineText.slice(options.fullLineText.indexOf(':') + 1)).nodes;
            const node = parsed[parsed.length - 1];
            if (
                node.type === 'div' || node.type === 'space'
                || node.type === 'function' && !node.unclosed
                || node.type === 'word' && this.text.some(t => t.startsWith(node.value))
            ) {
                return [valueDirective(new ProviderRange(
                    new ProviderPosition(
                        options.position.line,
                        options.fullLineText.includes(',')
                            ? options.fullLineText.lastIndexOf(',') + 1
                            : options.fullLineText.indexOf(':') + 1),
                    options.position
                ))]
            } else {
                return [];
            }
        } else {
            return [];
        }
    },
    text: ['value()'],

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

// Selector level
export const GlobalCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (!options.parentSelector && !options.lineChunkAtCursor.endsWith('::')) {
            if (options.isLineStart) {
                return [globalCompletion(
                    new ProviderRange(
                        new ProviderPosition(
                            options.position.line,
                            options.position.character - options.lineChunkAtCursor.length
                        ),
                        options.position
                    )
                )];
            } else {
                let offset = 0;
                if (options.fullLineText.lastIndexOf(':') !== -1) {
                    if (this.text[0].startsWith(options.lineChunkAtCursor.slice(options.lineChunkAtCursor.lastIndexOf(':')))) {
                        offset = options.lineChunkAtCursor.slice(options.lineChunkAtCursor.lastIndexOf(':')).length;
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
    },
    text: [':global()']
}

//Semantic

// Selector level
// Not after :, unless entire chunk is :
export const SelectorCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (!options.parentSelector && (options.lineChunkAtCursor === ':' || !options.lineChunkAtCursor.endsWith(':'))) {
            let comps: Completion[] = [];
            comps.push(...Object.keys(options.meta.classes)
                .filter(c => c !== 'root' && options.fakes.findIndex(f => f.selector === '.' + c) === -1)
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
            return moreComps.filter(c => c.label.startsWith(options.lineChunkAtCursor));
        } else {
            return [];
        }
    },
    text: ['']
}

// Inside ruleset of simple selector, not :import or :vars
// RHS of -st-extends
export const ExtendCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (options.lineChunkAtCursor.startsWith(valueMapping.extends)) {
            let value = options.lineChunkAtCursor.slice((valueMapping.extends + ':').length);
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
    },
    text: ['']
}

// Inside ruleset, which is not :import or :vars
// RHS of -st-extends
export const CssMixinCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (options.lineChunkAtCursor.startsWith(valueMapping.mixin + ':')) {
            let valueStart = options.fullLineText.indexOf(':') + 1;
            let value = options.fullLineText.slice(valueStart);
            let names = value.split(',').map(x => x.trim()).filter(x => x !== '');
            let lastName = /,\s*$/.test(options.fullLineText)
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

    },
    text: ['']
}

// Inside ruleset, which is not :import or :vars
// Only inside simple selector
// RHS of -st-mixin
// There is  a JS/TS import
export const CodeMixinCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (options.meta.imports.some(imp => imp.fromRelative.endsWith('.ts') || imp.fromRelative.endsWith('.js')) && options.lineChunkAtCursor.startsWith(valueMapping.mixin + ':')) {
            if (options.fullLineText.lastIndexOf('(') > options.fullLineText.lastIndexOf(')')) { return [] }


            let valueStart = options.fullLineText.indexOf(':') + 1;
            let value = options.fullLineText.slice(valueStart, options.position.character);

            let parsed = pvp(value.trim());

            let names: string[] = parsed.nodes.filter((n: any) => n.type === 'function').map((n: any) => n.value);
            const rev = parsed.nodes.reverse();

            let lastName: string = (parsed.nodes.length > 0 && rev[0].type === 'word') ? rev[0].value : '';

            return Object.keys(options.meta.mappedSymbols)
                .filter(ms => options.meta.mappedSymbols[ms]._kind === 'import')
                .filter(ms => ms.startsWith(lastName))
                .filter(ms => names.length === 0 || names.indexOf(ms) === -1)
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
                        if (extractJsModifierRetrunType(ms, 0, options.docs.get(nativePathToFileUri((options.meta.mappedSymbols[ms] as ImportSymbol).import.from)).getText()) === 'stCssFrag') {
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
    },
    text: ['']
}


// Inside ruleset, which is not :import
// RHS of any rule
export const FormatterCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (options.parentSelector && options.fullLineText.includes(':') && options.fullLineText.indexOf(':') < options.position.character
            && !options.lineChunkAtCursor.startsWith(valueMapping.mixin + ':') && !options.fullLineText.trim().startsWith(valueMapping.from)
            && options.meta.imports.some(imp => imp.fromRelative.endsWith('.ts') || imp.fromRelative.endsWith('.js'))) {
            let valueStart = options.fullLineText.indexOf(':') + 1;
            let value = options.fullLineText.slice(valueStart);

            let parsed = pvp(value.trim());

            let names: string[] = parsed.nodes.filter((n: any) => n.type === 'function').map((n: any) => n.value);
            const rev = parsed.nodes.reverse();

            let lastName: string = (parsed.nodes.length > 0 && rev[0].type === 'word') ? rev[0].value : '';

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
                        if (extractJsModifierRetrunType(ms, 0, options.docs.get(nativePathToFileUri((options.meta.mappedSymbols[ms] as ImportSymbol).import.from)).getText()) !== 'stCssFrag') {
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
    },
    text: ['']
}

// Inside :import
// RHS of -st-named
// import exists
export const NamedCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (options.isNamedValueLine) {

            let importName: string = '';
            if (options.parentSelector && options.parentSelector.selector === ':import' && (options.astAtCursor as PostCss.Rule).nodes && (options.astAtCursor as PostCss.Rule).nodes!.length) {
                importName = ((options.astAtCursor as PostCss.Rule).nodes!.find(n => (n as PostCss.Declaration).prop === valueMapping.from) as PostCss.Declaration).value.replace(/'|"/g, '');
            }

            let resolvedImport: StylableMeta | null = null;
            if (importName && importName.endsWith('.st.css')) try {
                resolvedImport = options.styl.fileProcessor.process(options.meta.imports.find(i => i.fromRelative === importName)!.from);
            } catch (e) {
                resolvedImport = null;
            }


            if (resolvedImport) {

                let valueStart = options.fullLineText.indexOf(':') + 1;
                let value = options.fullLineText.slice(valueStart);
                let names = value.split(',').map(x => x.trim()).filter(x => x !== '');
                let lastName = /,\s*$/.test(options.fullLineText)
                    ? ''
                    : names.reverse()[0] || '';

                let comps: string[][] = [[]];
                comps.push(
                    ...Object.keys(resolvedImport.mappedSymbols)
                        .filter(ms => (resolvedImport!.mappedSymbols[ms]._kind === 'class' || resolvedImport!.mappedSymbols[ms]._kind === 'var') && ms !== 'root')
                        .filter(ms => ms.slice(0, -1).startsWith(lastName))
                        .filter(ms => ms === '' || options.namedValues.every(name => name !== ms))
                        .map(ms => [
                            ms,
                            path.relative(options.meta.source, resolvedImport!.source).slice(1).replace('\\', '/'),
                            resolvedImport!.mappedSymbols[ms]._kind === 'var' ? (resolvedImport!.mappedSymbols[ms] as VarSymbol).text : 'Stylable class'
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
        } else {
            return [];
        }
    },
    text: ['']
}

export const PseudoElementCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (!options.parentSelector && options.resolved.length > 0) {
            let pseudos = collectSelectorParts(
                options.resolvedPseudo,
                options.resolved,
                (acc: string[][], t, ind, arr) => acc.concat(collectElements(t, options, ind, arr))
            )

            if (pseudos.length === 0) {
                return [];
            }
            let offset = 0;

            if (options.lineChunkAtCursor.match(/:+/g)) {
                let trimmedPart = options.lineChunkAtCursor.replace(/:+$/, '').split(':').reverse()[0]
                if (trimmedPart.startsWith('--')) { trimmedPart = ':' + trimmedPart }
                if (options.resolved.length > 0 && options.resolved
                    .some(res => (
                        Object.keys((res as any).symbol[valueMapping.states] || {}).some((k: string) => k === trimmedPart)) ||
                        Object.keys((res as any).meta.customSelectors || {}).some((k: string) => k === trimmedPart))
                ) {
                    offset = options.lineChunkAtCursor.endsWith(':')
                        ? options.lineChunkAtCursor.endsWith('::') ? 2 : 1
                        : 0;
                } else if (options.resolvedPseudo.length > 0 && options.resolvedPseudo
                    .some(res => (
                        Object.keys((res as any).symbol[valueMapping.states] || {})
                            .some((k: string) => k === trimmedPart)))
                ) {
                    offset = options.lineChunkAtCursor.endsWith(':')
                        ? options.lineChunkAtCursor.endsWith('::') ? 2 : 1
                        : 0;
                } else if (cssPseudoClasses.indexOf(trimmedPart) !== -1) {
                    offset = options.lineChunkAtCursor.endsWith(':')
                        ? options.lineChunkAtCursor.endsWith('::') ? 2 : 1
                        : 0;
                } else if (options.lineChunkAtCursor.match(/:{1,2}\w*$/)) {
                    if (options.lineChunkAtCursor.endsWith(':')) {
                        offset = options.lineChunkAtCursor.match(/:+$/)![0].length;
                    } else {
                        if (trimmedPart === options.pseudo || trimmedPart === options.customSelector.slice(3)) {
                            offset = 0;
                        } else {
                            offset = 2 + options.lineChunkAtCursor.split('::').reverse()[0].length;
                        }
                    }
                } else {
                    offset = options.lineChunkAtCursor.length - (options.lineChunkAtCursor.indexOf(options.pseudo!) + options.pseudo!.length)
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
    },
    text: ['']
}

export const StateCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (!options.parentSelector && !options.lineChunkAtCursor.endsWith('::')) {
            let states = collectSelectorParts(
                options.resolvedPseudo,
                options.resolved,
                (acc: string[][], t, ind, arr) => acc.concat(collectStates(t, options, ind, arr))
            )
            if (states.length === 0) {
                return [];
            }

            let lastState = '';
            if (/[^:]:(\w+):?$/.test(options.lineChunkAtCursor)) {
                lastState = options.lineChunkAtCursor.match(/[^:]:(\w+):?$/)![1];
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
                                ? options.position.character - (options.lineChunkAtCursor.endsWith(':') ? 1 : 0)
                                : options.position.character - (lastState.length + 1) - (options.lineChunkAtCursor.endsWith(':') ? 1 : 0)
                            : options.position.character - (options.lineChunkAtCursor.endsWith(':') ? 1 : 0)
                    ),
                    options.position)
                )));
                return acc;
            }, [])
        } else {
            return [];
        }
    },
    text: ['']
}

export const ValueCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (options.isInValue) {
            let inner = options.fullLineText.slice(0, options.fullLineText.indexOf(')', options.position.character) + 1).slice(options.fullLineText.slice(0, options.fullLineText.indexOf(')', options.position.character) + 1).lastIndexOf('(')).replace('(', '').replace(')', '').trim();



            let comps: Completion[] = [];
            options.meta.vars.forEach(v => {
                if (v.name.startsWith(inner) && !options.fullLineText.slice(0, options.fullLineText.indexOf(':')).includes(v.name)) {
                    const value = evalValue(options.styl.resolver, v.text, options.meta, v.node)
                    comps.push(valueCompletion(v.name, 'Local variable', value, new ProviderRange(
                        new ProviderPosition(options.position.line, options.position.character - inner.length),
                        options.position,
                    )))
                }
            })
            options.importVars.forEach(v => {
                if (v.name.startsWith(inner) && options.meta.imports.some(imp => Object.keys(imp.named).some(key => key === v.name))) {
                    const value = evalValue(options.styl.resolver, v.value, options.meta, v.node)
                    comps.push(valueCompletion(v.name, v.from, value, new ProviderRange(
                        new ProviderPosition(options.position.line, options.position.character - inner.length),
                        options.position,
                    )))
                }
            })
            return comps;
        } else {
            return [];
        }
    },
    text: ['']
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
                        .some((k: string) => k === options.lineChunkAtCursor.split(':').reverse()[0])))
            ) {
                return true;
            }
            if (/[^^]:/.test(options.lineChunkAtCursor) &&
                ((!options.pseudo && !options.customSelector) ||
                    (
                        options.pseudo &&
                        !options.lineChunkAtCursor.endsWith(':') &&
                        !options.lineChunkAtCursor.endsWith(options.pseudo)
                    ) || (
                        options.customSelector &&
                        !options.lineChunkAtCursor.endsWith(':') &&
                        !options.lineChunkAtCursor.endsWith(options.customSelector.slice(3))
                    )
                )
            ) {
                return s.startsWith(options.lineChunkAtCursor.split(':').reverse()[0]) || cssPseudoClasses.indexOf(options.lineChunkAtCursor.split(':').reverse()[0]) !== -1;
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
    if (/[^:]:(\w+):?$/.test(options.lineChunkAtCursor)) {
        lastState = options.lineChunkAtCursor.match(/[^:]:(\w+):?$/)![1];
    } else if (/::(\w+):?$/.test(options.lineChunkAtCursor)) {
        let lastPseudo = options.lineChunkAtCursor.match(/::(\w+):?$/)![1];
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

