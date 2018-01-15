import { StylableMeta, SRule, valueMapping, ClassSymbol, CSSResolve, VarSymbol, ImportSymbol, StylableResolver, Stylable } from 'stylable';
import { evalValue } from 'stylable/dist/src/functions'
import { CursorPosition, SelectorInternalChunk, SelectorChunk } from "./utils/selector-analyzer";
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
import Provider, { extractTsSignature, extractJsModifierRetrunType, isDirective, getNamedValues, isInValue, getExistingNames, isMixin } from './provider';
import { TypeReferenceNode, Identifier } from 'typescript';
import { MinimalDocs } from './provider-factory';
const pvp = require('postcss-value-parser');
import { nativePathToFileUri } from './utils/uri-utils';
import { Declaration } from 'postcss';
import { ResolvedElement } from 'stylable/dist/src/stylable-transformer';
import { keys, findLast, last } from 'lodash';


export interface ProviderOptions {
    meta: StylableMeta,
    docs: MinimalDocs,
    styl: Stylable,
    src: string,
    resolvedElements: ResolvedElement[][],
    parentSelector: SRule | null,
    astAtCursor: PostCss.NodeBase,
    lineChunkAtCursor: string,
    lastSelectoid: string,
    fullLineText: string,
    position: ProviderPosition,
    isLineStart: boolean,
    resolved: CSSResolve[],
    currentSelector: string,
    target: CursorPosition
    isMediaQuery: boolean,
    fakes: PostCss.Rule[],
    pseudo: string | null,
    resolvedPseudo: CSSResolve[],
    customSelector: string,
    customSelectorType: string,
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

            const { names, lastName } = getExistingNames(options.fullLineText, options.position)
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

// Mixin completions
// Inside ruleset, which is not :import or :vars
// Only inside simple selector
// RHS of -st-mixin
// There is  a JS/TS import
export const CodeMixinCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (options.meta.imports.some(imp => imp.fromRelative.endsWith('.ts') || imp.fromRelative.endsWith('.js')) &&
            !options.fullLineText.trim().startsWith(valueMapping.from) &&
            options.parentSelector && options.lineChunkAtCursor.startsWith(valueMapping.mixin + ':')
        ) {
            if (options.fullLineText.lastIndexOf('(') > options.fullLineText.lastIndexOf(')')) { return [] }

            const { names, lastName } = getExistingNames(options.fullLineText, options.position)
            return Object.keys(options.meta.mappedSymbols)
                .filter(ms => options.meta.mappedSymbols[ms]._kind === 'import')
                .filter(ms => ms.startsWith(lastName))
                .filter(ms => names.length === 0 || !names.includes(ms))
                .filter(ms => isMixin(ms, options.meta, options.docs))
                .map(ms => createCodeMixinCompletion(ms, lastName, options.position, options.meta));
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
        if (options.meta.imports.some(imp => imp.fromRelative.endsWith('.ts') || imp.fromRelative.endsWith('.js')) &&
            !options.fullLineText.trim().startsWith(valueMapping.from) &&
            options.parentSelector && options.fullLineText.includes(':') && options.fullLineText.indexOf(':') < options.position.character &&
            !options.lineChunkAtCursor.startsWith(valueMapping.mixin + ':')
        ) {

            const { names, lastName } = getExistingNames(options.fullLineText, options.position)
            return Object.keys(options.meta.mappedSymbols)
                .filter(ms => (options.meta.mappedSymbols[ms]._kind === 'import'))
                .filter(ms => ms.startsWith(lastName))
                .filter(ms => names.length === 0 || !names.includes(ms))
                .filter(ms => !isMixin(ms, options.meta, options.docs))
                .map(ms => createCodeMixinCompletion(ms, lastName, options.position, options.meta));
        } else {
            return [];
        }
    },
    text: ['']
}

// Inside :import
// RHS of -st-named
// import exists
export const NamedCompletionProvider: CompletionProvider & { resolveImport: (options: ProviderOptions) => StylableMeta | null } = {
    provide(options: ProviderOptions): Completion[] {

        const { isNamedValueLine, namedValues } = getNamedValues(options.src, options.position.line);
        if (isNamedValueLine) {
            const resolvedImport: StylableMeta | null = this.resolveImport(options);
            if (resolvedImport) {
                const { names, lastName } = getExistingNames(options.fullLineText, options.position)
                let comps: string[][] = [[]];
                comps.push(
                    ...Object.keys(resolvedImport.mappedSymbols)
                        .filter(ms => (resolvedImport.mappedSymbols[ms]._kind === 'class' || resolvedImport.mappedSymbols[ms]._kind === 'var') && ms !== 'root')
                        .filter(ms => ms.slice(0, -1).startsWith(lastName))
                        .filter(ms => !namedValues.includes(ms))
                        .map(ms => [
                            ms,
                            path.relative(options.meta.source, resolvedImport.source).slice(1).replace('\\', '/'),
                            resolvedImport.mappedSymbols[ms]._kind === 'var' ? (resolvedImport.mappedSymbols[ms] as VarSymbol).text : 'Stylable class'
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
            }
        }
        return [];
    },
    resolveImport(options: ProviderOptions): StylableMeta | null {
        let resolvedImport: StylableMeta | null = null;

        let importName: string = '';
        if (options.parentSelector && options.parentSelector.selector === ':import' && (options.astAtCursor as PostCss.Rule).nodes && (options.astAtCursor as PostCss.Rule).nodes!.length) {
            importName = ((options.astAtCursor as PostCss.Rule).nodes!.find(n => (n as PostCss.Declaration).prop === valueMapping.from) as PostCss.Declaration).value.replace(/'|"/g, '');
        }
        if (importName && importName.endsWith('.st.css')) try {
            resolvedImport = options.styl.fileProcessor.process(options.meta.imports.find(i => i.fromRelative === importName)!.from);
        } catch (e) { }
        return resolvedImport;
    },
    text: ['']
}

export const PseudoElementCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        let comps: any[] = [];
        if (!options.parentSelector && options.resolved.length > 0) {

            const lastNode = options.resolvedElements[0][options.resolvedElements[0].length - 1];
            const states = lastNode.resolved.reduce((acc, cur) => {
                acc = acc.concat(keys((cur.symbol as ClassSymbol)[valueMapping.states]))
                return acc;
            }, cssPseudoClasses)

            const filter = lastNode.resolved.length
                ? states.includes(options.lastSelectoid.replace(':', ''))
                    ? ''
                    : options.lastSelectoid.replace(':', '')
                : lastNode.name;

            const scope = filter
                ? options.resolvedElements[0][options.resolvedElements[0].length - 2]
                : lastNode;

            const colons = options.lineChunkAtCursor.match(/:*$/)![0].length;

            scope.resolved.forEach(res => {
                if (!(res.symbol as ClassSymbol)[valueMapping.root]) { return }

                comps = comps.concat(keys(res.meta.classes)
                    .concat(keys(res.meta.customSelectors).map(s => s.slice(':--'.length)))
                    .filter(e => e.startsWith(filter) && e !== 'root')
                    .map(c => {
                        let relPath = path.relative(path.dirname(options.meta.source), res.meta.source)
                        if (!relPath.startsWith('.')) { relPath = './' + relPath }

                        return filter
                            ? pseudoElementCompletion(c, relPath, new ProviderRange(
                                new ProviderPosition(options.position.line, options.position.character - filter.length - 2),
                                new ProviderPosition(options.position.line, options.position.character),
                            ))
                            : pseudoElementCompletion(c, relPath, new ProviderRange(
                                new ProviderPosition(options.position.line, options.position.character - colons),
                                new ProviderPosition(options.position.line, options.position.character),
                            ))
                    }))
            })
        }
        return comps;
    },
    text: ['']
}

export const StateCompletionProvider: CompletionProvider = {
    provide(options: ProviderOptions): Completion[] {
        if (!options.parentSelector && !options.lineChunkAtCursor.endsWith('::')) {


            const lastNode = options.resolvedElements[0][options.resolvedElements[0].length - 1];
            const chunk = Array.isArray(options.target.focusChunk) ? last(options.target.focusChunk) : options.target.focusChunk
            const chunkyStates = (chunk && (chunk as SelectorChunk).states) ? (chunk as SelectorChunk).states : [];
            const allStates = lastNode.resolved.reduce((acc, cur) => {
                acc.push(...keys((cur.symbol as ClassSymbol)[valueMapping.states]))
                return acc;
            }, [] as string[])

            const newStates = lastNode.resolved.reduce((acc, cur) => {
                let relPath = path.relative(path.dirname(options.meta.source), cur.meta.source)
                if (!relPath.startsWith('.')) { relPath = './' + relPath }
                keys((cur.symbol as ClassSymbol)[valueMapping.states]).forEach(k => {
                    if (
                        !acc[k] &&
                        (
                            k.slice(0, -1).startsWith(options.lastSelectoid.replace(':', '')) || //selectoid is a substring of current state
                            allStates.includes(options.lastSelectoid.replace(':', '')) //selectoid is a valid state TODO: selectoid is both
                        ) &&
                        (chunkyStates.every(cs => cs !== k))
                    ) { acc[k] = options.meta.source === cur.meta.source ? 'Local file' : relPath }
                })
                return acc;
            }, {} as { [k: string]: string });

            let states = keys(newStates).map(k => [k, newStates[k]]);
            if (states.length === 0) { return [] };

            // let lastState = '';
            // if (/[^:]:(\w+):?$/.test(options.lineChunkAtCursor)) {
            //     lastState = options.lineChunkAtCursor.match(/[^:]:(\w+):?$/)![1];
            // }
            // let realState = options.resolvedPseudo.length > 0
            //     ? options.resolvedPseudo.some(r => Object.keys((r.symbol as any)[valueMapping.states] || {}).includes(lastState))
            //     : options.resolved.some(r => Object.keys((r.symbol as any)[valueMapping.states] || {}).includes(lastState))

            const lastState = options.lastSelectoid.replace(':', '');
            const realState = allStates.includes(lastState);
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
        if (isInValue(options.fullLineText, options.position)) {
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

            const importVars: any[] = [];
            options.meta.imports.forEach(imp => {
                try {
                    options.styl.fileProcessor.process(imp.from).vars.forEach(v => importVars.push({ name: v.name, value: v.text, from: imp.fromRelative }))
                } catch (e) { }
            })

            importVars.forEach(v => {
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

function createCodeMixinCompletion(name: string, lastName: string, position: ProviderPosition, meta: StylableMeta) {
    return codeMixinCompletion(
        name,
        new ProviderRange(
            new ProviderPosition(position.line, position.character - lastName.length),
            position
        ),
        (meta.mappedSymbols[name] as ImportSymbol).import.fromRelative
    )
}

