import { StylableMeta, SRule, valueMapping } from 'stylable';
import { CSSResolve } from 'stylable/dist/src';
import { CursorPosition, SelectorChunk } from "./utils/selector-analyzer";
import { defaultDirective, extendsDirective, fromDirective, importsDirective, mixinDirective, namedDirective, rootClass, statesDirective, variantDirective, varsDirective,
     classCompletion, extendCompletion, stateCompletion, Completion } from './completion-types'
import { isContainer, isDeclaration } from './utils/postcss-ast-utils';

export interface ProviderOptions {
    meta: StylableMeta,
    lastRule: SRule | null,
    trimmedLine: string,
    position: ProviderPosition,
    isTopLevel: boolean,
    isLineStart: boolean,
    isImport: boolean,
    insideSimpleSelector: boolean,
    resolved: CSSResolve[],
    currentSelector: string,
    target: CursorPosition
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


//Providers
//Syntactic
export class DefaultDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule &&
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
        if (options.insideSimpleSelector && options.isLineStart && options.lastRule &&
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
        if (options.isImport && options.isLineStart && options.lastRule &&
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
        let position = options.position
        if (options.isTopLevel && options.isLineStart) {
            return [importsDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, position.character - options.trimmedLine.length)), position))];
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
        let lastRule = options.lastRule
        if (options.isImport && options.isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [namedDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.named]
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
        let lastRule = options.lastRule
        if (options.insideSimpleSelector && options.isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [statesDirective((new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position)))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.states]
}

export class VariantDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let lastRule = options.lastRule
        if (options.insideSimpleSelector && options.isLineStart && lastRule &&
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
        if (options.isTopLevel && options.isLineStart) {
            return [varsDirective(new ProviderRange(new ProviderPosition(position.line, Math.max(0, position.character - options.trimmedLine.length)), position))];
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
            comps.push(...Object.keys(options.meta.classes))
            options.meta.imports.forEach(i => comps.push(...Object.keys(i.named)))
            return comps.map(c => classCompletion(c, new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position)), false, );
        } else
            return [];
    }
    text: string[] = [''];
}

export class ExtendCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.currentSelector === valueMapping.extends) {
            let comps: string[] = [];
            comps.push(...Object.keys(options.meta.classes))
            options.meta.imports.forEach(i => comps.push(i.defaultExport))
            options.meta.imports.forEach(i => comps.push(...Object.keys(i.named)))
            return comps.map(c => extendCompletion(c, new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position)));
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

export class StateCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !!options.resolved) {
            let states = options.resolved.reduce(
                (acc: string[][], t) => acc.concat(Object.keys((t.symbol as any)['-st-states'] || []).map(s => [s, t.meta.source])), []);
            return states.reduce((acc: Completion[], st) => {
                if ((options.target.focusChunk as SelectorChunk).states.indexOf(st[0]) == -1) {

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
