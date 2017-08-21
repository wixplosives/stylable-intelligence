//must remain independent from vscode

import * as PostCss from 'postcss';
import { StylableMeta, process, safeParse, valueMapping, SRule } from 'stylable';
import { VsCodeResolver } from './adapters/vscode-resolver';
import { getPositionInSrc, isSelector, pathFromPosition } from "./utils/postcss-ast-utils";
import {
    parseSelector,
    isSelectorChunk
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
// function varsDirective(rng: ProviderRange) {
//     return new Completion(':vars', 'Declare variables', 'a', new snippet(':vars {\n\t$1\n}$0'), rng);
// }
const extendsDirective = new Completion(valueMapping.extends + ':', 'Extend an external component', 'a', new snippet('-st-extends: $1;'), undefined, true);
const statesDirective = new Completion('-st-states:', 'Define the CSS states available for this class', 'a', new snippet('-st-states: $1;'));
const mixinDirective = new Completion('-st-mixin:', 'Apply mixins on the class', 'a', new snippet('-st-mixin: $1;'));
const variantDirective = new Completion('-st-variant:', '', 'a', new snippet('-st-variant: true;'));
const fromDirective = new Completion('-st-from:', 'Path to library', 'a', new snippet('-st-from: "$1";'));
const namedDirective = new Completion('-st-named:', 'Named object export name', 'a', new snippet('-st-named: $1;'));
const defaultDirective = new Completion('-st-default:', 'Default object export name', 'a', new snippet('-st-default: $1;'));
function classCompletion(className: string) {
    return new Completion('.' + className, 'mine', 'b')
}
function extendCompletion(symbolName: string, range?: ProviderRange) {
    return new Completion(symbolName, 'yours', 'a', new snippet(' ' + symbolName + ';\n'), range)
}
function stateCompletion(stateName: string, from: string, pos: ProviderPosition) {
    return new Completion(':' + stateName, 'from: ' + from, 'a', new snippet(':' + stateName), singleLineRange(pos.line, pos.character - 1, pos.character));
}
// end completions


type CompletionMap = { [s: string]: Completion };


function addExistingClasses(meta: StylableMeta | undefined, completions: Completion[]) {
    if (meta == undefined)
        return;
    Object.keys(meta.classes).forEach((className: string) => {
        if (className === 'root') {
            return;
        }

        completions.push(classCompletion(className));
    });
}

function isIllegalLine(line: string): boolean {
    return !!/^\s*[-\.:]*\s*$/.test(line)
}


const lineEndsRegexp = /({|}|;)/;


function isSpacy(char: string) {
    return char === '' || char === ' ' || char === '\t' || char === '\n';
}

export default class Provider {
    constructor(private resolver: VsCodeResolver) {

    }
    public getClassDefinition(meta: StylableMeta, symbol: string) {
        // const symbols = resolver.resolveSymbols(stylesheet);

    }

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
        console.log('Current line I: ', currentLine);
        if (currentLine.match(lineEndsRegexp)) {
            let currentLocation = 0;
            let splitLine = currentLine.split(lineEndsRegexp);
            for (var i = 0; i < splitLine.length; i += 2) {
                currentLocation += splitLine[i].length + 1;
                if (currentLocation >= position.character) {
                    currentLine = splitLine[i];
                    console.log('Current line II: ', currentLine);
                    if (isIllegalLine(currentLine)) {
                        splitLine[i] = '\n'
                        lines.splice(position.line, 1, splitLine.join(''));
                        fixedSrc = lines.join('\n');
                    }
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


        console.log('Made fixedSrc');
        console.log(fixedSrc);


        let meta: StylableMeta;
        try {
            meta = process(safeParse(fixedSrc));
        } catch (error) {
            console.log(error);
            return Promise.resolve([]);
        }
        console.log('PostCSS successful');

        // console.log('Transpiling Stylesheet');
        // try {
        //     stylesheet = fromCSS(fixedSrc, undefined, filePath);
        //     console.log('Transpiling Stylesheet success');
        // } catch (error) {
        //     console.log('Transpiling Stylesheet fail');
        //     console.error('stylable transpiling failed');
        // }

        console.log('Calling resolveDependencies');
        // debugger;
        console.log('Calling AST completions with: ')
        console.log('position: ', JSON.stringify(position, null, '\t'))
        console.log('currentLine: ', JSON.stringify(currentLine, null, '\t'))
        console.log('cursorLineIndex: ', JSON.stringify(cursorLineIndex, null, '\t'), '\n')
        return this.provideCompletionItemsFromAst(src, position, filePath, meta, currentLine, cursorLineIndex);


        // return resolver.resolveDependencies(meta)
        //     .then<Completion[]>(() => {
        //         console.log('Calling AST completions with: ')
        //         console.log('position: ', JSON.stringify(position, null, '\t'))
        //         console.log('currentLine: ', JSON.stringify(currentLine, null, '\t'))
        //         console.log('cursorLineIndex: ', JSON.stringify(cursorLineIndex, null, '\t'), '\n')
        //         return this.provideCompletionItemsFromAst(src, position, filePath, resolver, meta, currentLine, cursorLineIndex)
        //     });

    }
    public provideCompletionItemsFromAst(
        src: string,
        position: ProviderPosition,
        filePath: string,
        meta: StylableMeta,
        currentLine: string,
        cursorLineIndex: number
    ): Thenable<Completion[]> {
        console.log('Starting provideCompletionItemsFromAst')
        const completions: Completion[] = [];
        const trimmedLine = currentLine.trim();

        const position1Based: ProviderPosition = {
            line: position.line + 1,
            character: position.character
        }

        const path = pathFromPosition(meta.ast, position1Based);

        const posInSrc = getPositionInSrc(src, position);
        const lastChar = src.charAt(posInSrc);
        const lastPart: PostCss.NodeBase = path[path.length - 1];
        const prevPart: PostCss.NodeBase = path[path.length - 2];

        const lastSelector = prevPart && isSelector(prevPart) ? prevPart : lastPart && isSelector(lastPart) ? lastPart : null
        debugger;
        if (lastSelector) {
            var lastRule = <SRule>lastSelector;

            if (lastChar === '-' || isSpacy(lastChar) || lastChar == "{") {
                if (lastRule.selector === ':import') {
                    completions.push(...getNewCompletions({
                        "-st-from": fromDirective,
                        "-st-default": defaultDirective,
                        "-st-named": namedDirective
                    }, lastRule));
                } else {

                    const declarationBlockDirectives: CompletionMap = {
                        '-st-mixin': mixinDirective
                    };
                    if (lastRule.isSimpleSelector) {
                        declarationBlockDirectives["-st-extends"] = extendsDirective;
                        declarationBlockDirectives["-st-variant"] = variantDirective;
                        declarationBlockDirectives["-st-states"] = statesDirective;
                    }
                    completions.push(...getNewCompletions(declarationBlockDirectives, lastRule));
                }
            } else if (meta && lastChar == ":" && trimmedLine.split(':').length === 2) {
                if (trimmedLine.indexOf('-st-extends:') === 0) {
                    meta.imports.forEach((importJson) => {
                        if (importJson.from.lastIndexOf('.css') === importJson.from.length - 4 && importJson.defaultExport) {
                            completions.push(extendCompletion(importJson.defaultExport));
                        }
                    });
                } else if (trimmedLine.indexOf('-st-from:') === 0) {
                    // debugger;
                }

            }
        }
        if (trimmedLine.length < 2) {

            if ((lastChar === ':' || isSpacy(lastChar)) && (<PostCss.Root>lastPart).type === 'root') {
                completions.push(importsDirective(new ProviderRange(new ProviderPosition(position.line, Math.max(0, position.character - 1)), position)));
            }
            if (lastChar === '.' || isSpacy(lastChar)) {
                completions.push(rootClass);
                addExistingClasses(meta, completions);
            }
        } else if (lastChar === ':' && meta !== undefined) {

            const selectorRes = parseSelector(currentLine, cursorLineIndex);//position.character);
            const focusChunk = selectorRes.target.focusChunk;

            if (!Array.isArray(focusChunk) && isSelectorChunk(focusChunk)) {// || isSelectorInternalChunk(focusChunk)
                focusChunk.classes.forEach((className) => {
                    console.log('className: ', className)

                    // const clsDef = getDefinition(meta, className, this.resolver)
                    // if (isClassDefinition(clsDef)) {
                    //     clsDef.states.forEach((stateDef) => {
                    //         if (focusChunk.states.indexOf(stateDef.name) !== -1) { return }
                    //         // const from = 'from: ' + stateDef.from;
                    //         completions.push(stateCompletion(stateDef.name, stateDef.from, position))
                    //     })
                    // }

                    const extendResolution = this.resolver.resolveExtends(meta, className);


                    const states: any[] = [];
                    extendResolution.forEach((s) => {
                        if (s.symbol._kind === 'class') {
                            states.push(...s.symbol[valueMapping.states].map((name: string) => ({ name, from: s.meta.source })));
                        }
                    });

                    states.forEach((stateDef) => {
                        if (focusChunk.states.indexOf(stateDef.name) !== -1) { return }
                        completions.push(stateCompletion(stateDef.name, stateDef.from, position))
                    });

                })
            }
        }

        return Promise.resolve(completions);
    }
}

// function getSelectorFromPosition(src: string, index: number) {}

function getNewCompletions(completionMap: CompletionMap, ruleset: PostCss.Rule): Completion[] {
    ruleset.nodes!.forEach(node => {
        let dec = node as PostCss.Declaration;
        if (completionMap[dec.prop]) {
            delete completionMap[dec.prop]
        }
    });
    return Object.keys(completionMap).map(name => completionMap[name]);
}
