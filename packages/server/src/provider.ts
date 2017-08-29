import { CSSResolve } from 'stylable/dist/src';
//must remain independent from vscode

import * as PostCss from 'postcss';
import { StylableMeta, process, safeParse, valueMapping, SRule, StylableResolver} from 'stylable';
import { getPositionInSrc, isContainer, isDeclaration, isSelector, pathFromPosition } from './utils/postcss-ast-utils';
import {MinimalDocs} from './minimal-docs'

import {
    parseSelector,
    SelectorChunk
} from './utils/selector-analyzer';


export class ProviderPosition {
    constructor(public line: number, public character: number) { }
}

export class ProviderRange {
    constructor(public start: ProviderPosition, public end: ProviderPosition) { }
}

export class Completion {
    constructor(public label: string, public detail: string = "", public sortText: string = 'd', public insertText: string | snippet = label,
        public range?: ProviderRange, public additionalCompletions: boolean = false) {

    }
}

export class snippet {
    constructor(public source: string) { }
}


function singleLineRange(line: number, start: number, end: number): ProviderRange {
    return {
        start: {
            line: line,
            character: start
        },
        end: {
            line: line,
            character: end
        }
    }
}


// Completions
// CompItemKinds for icons:
//  .<class> - Class
// value(<var>) -> Variable
// -st-named -> (var -> Variable, cls -> Class)
// :<state> -> Enum
// :vars -> Keyword
// :import -> Keyword
// -st-* directive -> Keyword
//
const rootClass = new Completion('.root', 'The root class', 'b');
function importsDirective(rng: ProviderRange) {
    return new Completion(':import', 'Import an external library', 'a', new snippet(':import {\n\t-st-from: "$1";\n}$0'), rng);
}
function varsDirective(rng: ProviderRange) {
    return new Completion(':vars', 'Declare variables', 'a', new snippet(':vars {\n\t$1\n}$0'), rng);
}
const extendsDirective = new Completion(valueMapping.extends + ':', 'Extend an external component', 'a', new snippet('-st-extends: $1;'), undefined, true);
const statesDirective = new Completion('-st-states:', 'Define the CSS states available for this class', 'a', new snippet('-st-states: $1;'));
const mixinDirective = new Completion('-st-mixin:', 'Apply mixins on the class', 'a', new snippet('-st-mixin: $1;'));
const variantDirective = new Completion('-st-variant:', '', 'a', new snippet('-st-variant: true;'));
const fromDirective = new Completion('-st-from:', 'Path to library', 'a', new snippet('-st-from: "$1";'));
const namedDirective = new Completion('-st-named:', 'Named object export name', 'a', new snippet('-st-named: $1;'));
const defaultDirective = new Completion('-st-default:', 'Default object export name', 'a', new snippet('-st-default: $1;'));
function classCompletion(className: string, isDefaultImport?: boolean) {
    return new Completion((isDefaultImport ? '' : '.') + className, 'mine', 'b')
}
// function extendCompletion(symbolName: string, range?: ProviderRange) {
//     return new Completion(symbolName, 'yours', 'a', new snippet(' ' + symbolName + ';\n'), range)
// }
function stateCompletion(stateName: string, from: string, pos: ProviderPosition) {
    return new Completion(':' + stateName, 'from: ' + from, 'a', new snippet(':' + stateName), singleLineRange(pos.line, pos.character - 1, pos.character));
}
// function fileNameCompletion(name: string) {
//     return new Completion(name, '', 'a', './' + name);
// }
// end completions


export interface CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[]
    text: string[];
}
//TODO: add isVars to signature.


export class RootClassProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isTopLevel && isLineStart) {
            return [rootClass];
        } else {
            return [];
        }
    }
    text: string[] = ['.root']
}

export class ImportDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isTopLevel && isLineStart) {
            return [importsDirective(new ProviderRange(new ProviderPosition(position.line, Math.max(0, position.character - 1)), position))];
        } else {
            return [];
        }
    }
    text: string[] = [':import']
}

export class VarsDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isTopLevel && isLineStart) {
            return [varsDirective(new ProviderRange(new ProviderPosition(position.line, Math.max(0, position.character - 1)), position))];
        } else {
            return [];
        }
    }
    text: string[] = [':vars']
}

export class ExtendsDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (insideSimpleSelector && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [extendsDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.extends]
}

export class StatesDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (insideSimpleSelector && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [statesDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.states]
}

export class MixinDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isLineStart && !isImport && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [mixinDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.mixin]
}

export class VariantDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (insideSimpleSelector && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [variantDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.variant]
}

export class FromDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isImport && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [fromDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.from]
}

export class NamedDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isImport && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [namedDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.named]
}

export class DefaultDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isImport && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [defaultDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.default]
}

// Top level
// Extra files
export class ClassCompletionProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isTopLevel && lastChar!==':') {
            return Object.keys(meta.classes).filter(c => c !== 'root').map(c => classCompletion(c, false))
        } else
            return [];
    }
    text: string[] = [''];
}

// In -st-extends
// Extra files
export class ExtendCompletionProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        return [];
    }
    text: string[] = [''];
}

export class StateCompletionProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isTopLevel && !!currentSelector) {
            let states = currentSelector.reduce((acc: string[][], t) => acc.concat(Object.keys((t.symbol as any)['-st-states'] || []).map(s => [s, t.meta.source])), []);
            return states.reduce((acc: Completion[], st) => { acc.push(stateCompletion(st[0], st[1], position)); return acc; }, [])
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

// In -st-from
// File list
export class FilenameCompletionProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        return [];
    }
    text: string[] = [''];
}


function isIllegalLine(line: string): boolean {
    return !!/^\s*[-\.:]*\s*$/.test(line)
}

const lineEndsRegexp = /({|}|;)/;

export default class Provider {
    constructor(private resolver: StylableResolver, private docs:MinimalDocs) {}

    providers = [
        new RootClassProvider(),
        new ImportDirectiveProvider(),
        new VarsDirectiveProvider(),
        new ExtendsDirectiveProvider(),
        new StatesDirectiveProvider(),
        new MixinDirectiveProvider(),
        new VariantDirectiveProvider(),
        new FromDirectiveProvider(),
        new NamedDirectiveProvider(),
        new DefaultDirectiveProvider(),
        new ClassCompletionProvider(),
        new ExtendCompletionProvider(),
        new StateCompletionProvider(),
        new FilenameCompletionProvider(),
    ]

    public provideCompletionItemsFromSrc(
        src: string,
        position: ProviderPosition,
        filePath: string,
    ): Thenable<Completion[]> {
        // debugger;
        let cursorLineIndex: number = position.character;
        let lines = src.split('\n');
        let currentLine = lines[position.line];
        let fixedSrc = src;
        if (currentLine.match(lineEndsRegexp)) {
            let currentLocation = 0;
            let splitLine = currentLine.split(lineEndsRegexp);
            for (var i = 0; i < splitLine.length; i += 2) {
                currentLocation += splitLine[i].length + 1;
                if (currentLocation >= position.character) {
                    currentLine = splitLine[i];
                    if (isIllegalLine(currentLine)) {
                        splitLine[i] = '\n'
                        lines.splice(position.line, 1, splitLine.join(''));
                        fixedSrc = lines.join('\n');
                    } //Bug here when working in single line mode - current line is wrong when between selectors
                    break;
                } else {
                    cursorLineIndex -= splitLine[i].length + 1
                }
            }

        }
        else if (isIllegalLine(currentLine)) {
            lines.splice(position.line, 1, "");
            fixedSrc = lines.join('\n');
        }

        let meta: StylableMeta;
        try {
            meta = process(safeParse(fixedSrc, { from: filePath.indexOf('file://') === 0 ? filePath.slice(7) : filePath }));
        } catch (error) {
            console.log(error);
            return Promise.resolve([]);
        }
        return this.provideCompletionItemsFromAst(src, position, filePath, meta, currentLine, cursorLineIndex);

    }
    public provideCompletionItemsFromAst(
        src: string,
        position: ProviderPosition,
        filePath: string,
        meta: StylableMeta,
        currentLine: string,
        cursorLineIndex: number
    ): Thenable<Completion[]> {
        const completions: Completion[] = [];
        const trimmedLine = currentLine.trim();

        const position1Based: ProviderPosition = {
            line: position.line + 1,
            character: position.character
        }

        const path = pathFromPosition(meta.rawAst, position1Based);

        const posInSrc = getPositionInSrc(src, position);
        const lastChar = src.charAt(posInSrc);
        const lastPart: PostCss.NodeBase = path[path.length - 1];
        const prevPart: PostCss.NodeBase = path[path.length - 2];

        const lastRule: SRule | null = prevPart && isSelector(prevPart) ? <SRule>prevPart : lastPart && isSelector(lastPart) ? <SRule>lastPart : null

        let ps = parseSelector(trimmedLine, cursorLineIndex);
        // let currentSelector = ps.target.focusChunk;
        let currentSelector = (ps.selector[ps.selector.length - 1] as SelectorChunk).classes[0]  //Gives last. Replace with one at cursor position.
        let tr = currentSelector ? this.resolver.resolveExtends(meta, currentSelector) : [];

        this.providers.forEach(p => completions.push(
            ...p.provide(
                meta,
                lastRule,
                lastChar,
                position,
                !lastRule,
                p.text.some(s => s.indexOf(trimmedLine) === 0),
                !!lastRule && lastRule.selector === ':import',
                !!lastRule && !!/^\s*\.?\w*$/.test(lastRule.selector),
                tr
            ))
        );
        this.docs;
        return Promise.resolve(completions);
    }


    addExistingClasses(meta: StylableMeta | undefined, completions: Completion[], addDefaultImport: boolean = false) {
        if (meta == undefined)
            return;
        Object.keys(meta.mappedSymbols) // Add imported classes.
            .filter((s) => { return meta.mappedSymbols[s]._kind === "import" })
            .filter((s) => {
                return this.resolver.deepResolve(meta.mappedSymbols[s])
                    && this.resolver.deepResolve(meta.mappedSymbols[s])!.symbol._kind === "class"
            }).forEach((className: string) => {
                if (addDefaultImport && (meta.mappedSymbols[className] as any).type === "default") {
                    completions.push(classCompletion(className, true));
                }
                if ((meta.mappedSymbols[className] as any).type === "named") {
                    completions.push(classCompletion(className));
                }
            });

        Object.keys(meta.mappedSymbols) // Add local classes.
            .filter((s) => { return meta.mappedSymbols[s]._kind === "class" })
            .filter(s => s !== "root")
            .forEach((className: string) => {
                completions.push(classCompletion(className));
            });
    }

}
