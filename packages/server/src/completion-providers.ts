import { StylableMeta, SRule, valueMapping } from 'stylable';
import { ClassSymbol, CSSResolve } from 'stylable/dist/src';
import { CursorPosition, SelectorChunk, SelectorInternalChunk } from "./utils/selector-analyzer";
import {
    defaultDirective, extendsDirective, fromDirective, importsDirective, mixinDirective, namedDirective, namespaceDirective, rootClass, statesDirective, themeDirective, variantDirective, varsDirective,
    classCompletion, extendCompletion, namedCompletion, pseudoElementCompletion, stateCompletion,
    Completion
} from './completion-types'
import { isContainer, isDeclaration } from './utils/postcss-ast-utils';
import * as PostCss from 'postcss';


export interface ProviderOptions {
    meta: StylableMeta,
    lastRule: SRule | null,
    trimmedLine: string,
    postDirectiveSpaces: number,
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


//Providers
//Syntactic
export class DefaultDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule && !options.isMediaQuery &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [defaultDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.default]
}

export class ExtendsDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.insideSimpleSelector && options.isLineStart && options.lastRule && !options.isMediaQuery &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [extendsDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.extends]
}

export class FromDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule && !options.isMediaQuery &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [fromDirective(new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.from]
}

export class ImportDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && options.isLineStart && !options.isMediaQuery) {
            return [importsDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [':import']
}

export class MixinDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isLineStart && !options.isImport && options.lastRule &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [mixinDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.mixin]
}

export class NamedDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [namedDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.named]
}

export class NamespaceDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let position = options.position
        if (options.isTopLevel && options.isLineStart && !options.isMediaQuery) {
            return [namespaceDirective(new ProviderRange(new ProviderPosition(position.line, Math.max(0, position.character - options.trimmedLine.length)), position))];
        } else {
            return [];
        }
    }
    text: string[] = ['@namespace']
}

export class RootClassProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && options.isLineStart) {
            return [rootClass(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = ['.root']
}

export class StatesDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.insideSimpleSelector && options.isLineStart && options.lastRule && !options.isMediaQuery &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [statesDirective((new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position)))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.states]
}

export class ThemeDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [themeDirective((new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position)))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.theme]
}

export class VariantDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let lastRule = options.lastRule
        if (options.insideSimpleSelector && options.isLineStart && lastRule && !options.isMediaQuery &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [variantDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.variant]
}

export class VarsDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let position = options.position
        if (options.isTopLevel && options.isLineStart && !options.isMediaQuery) {
            return [varsDirective(new ProviderRange(new ProviderPosition(position.line, Math.max(0, position.character - options.trimmedLine.length)), <ProviderPosition>position))];
        } else {
            return [];
        }
    }
    text: string[] = [':vars']
}



//Semantic
export class ClassCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !options.trimmedLine.endsWith(':')) {
            let comps: string[] = [];
            comps.push(...Object.keys(options.meta.classes).filter(k => k !== 'root' && options.fakes.findIndex(f => f.selector === '.' + k) === -1))
            options.meta.imports.forEach(i => comps.push(...Object.keys(i.named)))
            return comps.map(c => classCompletion(c, new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position)), false, );
        } else
            return [];
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
            let spaces = value.search(/\S|$/);
            let str = value.slice(spaces);
            let comps: string[] = Object.keys(options.resolvedImport.mappedSymbols).filter(ms => options.resolvedImport!.mappedSymbols[ms]._kind === 'class' && ms !== 'root');
            return comps.map(c => namedCompletion(c, new ProviderRange(
                new ProviderPosition(options.position.line, options.position.character - str.length - options.postDirectiveSpaces),
                new ProviderPosition(options.position.line, Number.MAX_VALUE))));
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


export class PseudoElementCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !!options.resolved && options.meta.imports.length > 0) {
            let pseudos = options.resolvedPseudo.length > 0
                ? options.resolvedPseudo.reduce(
                    (acc: string[][], t, ind) => acc.concat(
                        collectElements(t, options, ind)
                    ), [])
                : options.resolved.reduce(
                    (acc: string[][], t, ind) => acc.concat(
                        collectElements(t, options, ind)
                    ), []);
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
            let states = options.resolvedPseudo.length > 0
                ? options.resolvedPseudo.reduce(
                    (acc: string[][], t) => acc.concat(Object.keys((t.symbol as any)['-st-states'] || []).map(s => [s, t.meta.source])), [])
                : options.resolved.reduce(
                    (acc: string[][], t) => acc.concat(Object.keys((t.symbol as any)['-st-states'] || []).map(s => [s, t.meta.source])), [])
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

export class TypeCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !options.trimmedLine.endsWith(':')) {
            let comps: string[] = [];
            options.meta.imports.forEach(i => comps.push(i.defaultExport))
            return comps.map(c => classCompletion(c,
                new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position),
                true));
        } else
            return [];
    }
    text: string[] = [''];
}
