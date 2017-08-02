"use strict";
//must remain independent from vscode
Object.defineProperty(exports, "__esModule", { value: true });
const PostCss = require("postcss");
const stylable_1 = require("stylable");
const PostCssNested = require('postcss-nested');
const PostCssSafe = require('postcss-safe-parser');
const get_definitions_1 = require("./utils/get-definitions");
const postcss_ast_utils_1 = require("./utils/postcss-ast-utils");
const selector_analyzer_1 = require("./utils/selector-analyzer");
const processor = PostCss([PostCssNested]);
class Completion {
    constructor(label, detail = "", sortText = 'd', insertText, range, additionalCompletions = false) {
        this.label = label;
        this.detail = detail;
        this.sortText = sortText;
        this.insertText = insertText;
        this.range = range;
        this.additionalCompletions = additionalCompletions;
    }
}
exports.Completion = Completion;
class snippet {
    constructor(source) {
        this.source = source;
    }
}
exports.snippet = snippet;
function singleLineRange(line, start, end) {
    return {
        start: {
            line: line,
            character: start
        },
        end: {
            line: line,
            character: end
        }
    };
}
// Completions
const rootClass = new Completion('.root', 'The root class', 'b');
const importsDirective = new Completion(':import', 'Import an external library', 'a', new snippet(':import {\n\t-st-from: "$1";\n}'));
const extendsDirective = new Completion('-st-extends:', 'Extend an external component', 'a', new snippet('-st-extends: $1;'), undefined, true);
const statesDirective = new Completion('-st-states:', 'Define the CSS states available for this class', 'a', new snippet('-st-states: $1;'));
const mixinDirective = new Completion('-st-mixin:', 'Apply mixins on the class', 'a', new snippet('-st-mixin: $1;'));
const variantDirective = new Completion('-st-variant:', '', 'a', new snippet('-st-variant: true;'));
const fromDirective = new Completion('-st-from:', 'Path to library', 'a', new snippet('-st-from: "$1";'));
const namedDirective = new Completion('-st-named:', 'Named object export name', 'a', new snippet('-st-named: $1;'));
const defaultDirective = new Completion('-st-default:', 'Default object export name', 'a', new snippet('-st-default: $1;'));
function classCompletion(className) {
    return new Completion('.' + className, 'mine', 'b');
}
function extendCompletion(symbolName, range) {
    return new Completion(symbolName, 'yours', 'a', new snippet(' ' + symbolName + ';\n'), range);
}
function stateCompletion(stateName, from, pos) {
    return new Completion(':' + stateName, 'from: ' + from, 'a', new snippet(':' + stateName), singleLineRange(pos.line, pos.character - 1, pos.character));
}
function addExistingClasses(stylesheet, completions) {
    if (stylesheet == undefined)
        return;
    Object.keys(stylesheet.classes).forEach((className) => {
        if (className === 'root') {
            return;
        }
        completions.push(classCompletion(className));
    });
}
function isIllegalLine(line) {
    return !!/^\s*[-\.:]\s*$/.test(line);
}
function isSimple(selector) {
    if (selector.match(/[:> ]/)) {
        return false;
    }
    if (selector.indexOf('.') !== 0) {
        return false;
    }
    ;
    if (selector.lastIndexOf('.') !== 0) {
        return false;
    }
    return true;
}
const lineEndsRegexp = /({|}|;)/;
function isSpacy(char) {
    return char === '' || char === ' ' || char === '\t' || char === '\n';
}
class Provider {
    getClassDefinition(stylesheet, symbol, resolver) {
        const symbols = resolver.resolveSymbols(stylesheet);
    }
    provideCompletionItemsFromSrc(src, position, filePath, resolver) {
        let cursorLineIndex = position.character;
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
                        splitLine[i] = '\n';
                        lines.splice(position.line, 1, splitLine.join(''));
                        fixedSrc = lines.join('\n');
                    }
                    break;
                }
                else {
                    cursorLineIndex -= splitLine[i].length + 1;
                }
            }
        }
        else if (isIllegalLine(currentLine)) {
            lines.splice(position.line, 1, "");
            fixedSrc = lines.join('\n');
        }
        let ast;
        try {
            const res = processor.process(fixedSrc, {
                parser: PostCssSafe
            });
            ast = res.root;
        }
        catch (error) {
            return Promise.resolve([]);
        }
        let stylesheet = undefined;
        try {
            stylesheet = stylable_1.fromCSS(fixedSrc, undefined, filePath);
        }
        catch (error) {
            console.error('stylable transpiling failed');
        }
        return resolver.resolveDependencies(stylesheet)
            .then(() => {
            return this.provideCompletionItemsFromAst(src, position, filePath, resolver, ast, stylesheet, currentLine, cursorLineIndex);
        });
    }
    provideCompletionItemsFromAst(src, position, filePath, resolver, ast, stylesheet, currentLine, cursorLineIndex) {
        const completions = [];
        const trimmedLine = currentLine.trim();
        const position1Based = {
            line: position.line + 1,
            character: position.character
        };
        const path = postcss_ast_utils_1.pathFromPosition(ast, position1Based);
        const posInSrc = postcss_ast_utils_1.getPositionInSrc(src, position);
        const lastChar = src.charAt(posInSrc);
        const lastPart = path[path.length - 1];
        const prevPart = path[path.length - 2];
        const lastSelector = prevPart && postcss_ast_utils_1.isSelector(prevPart) ? prevPart :
            lastPart && postcss_ast_utils_1.isSelector(lastPart) ? lastPart : null;
        if (lastSelector) {
            if (lastChar === '-' || isSpacy(lastChar) || lastChar == "{") {
                if (lastSelector.selector === ':import') {
                    completions.push(...getNewCompletions({
                        "-st-from": fromDirective,
                        "-st-default": defaultDirective,
                        "-st-named": namedDirective
                    }, lastSelector));
                }
                else {
                    const declarationBlockDirectives = {
                        '-st-mixin': mixinDirective
                    };
                    if (isSimple(lastSelector.selector)) {
                        declarationBlockDirectives["-st-extends"] = extendsDirective;
                        declarationBlockDirectives["-st-variant"] = variantDirective;
                        declarationBlockDirectives["-st-states"] = statesDirective;
                    }
                    completions.push(...getNewCompletions(declarationBlockDirectives, lastSelector));
                }
            }
            else if (stylesheet && lastChar == ":" && trimmedLine.split(':').length === 2) {
                if (trimmedLine.indexOf('-st-extends:') === 0) {
                    stylesheet.imports.forEach((importJson) => {
                        if (importJson.from.lastIndexOf('.css') === importJson.from.length - 4 && importJson.defaultExport) {
                            completions.push(extendCompletion(importJson.defaultExport));
                        }
                    });
                }
                else if (trimmedLine.indexOf('-st-from:') === 0) {
                    debugger;
                }
            }
        }
        if (trimmedLine.length < 2) {
            if (lastChar === ':' || isSpacy(lastChar)) {
                completions.push(importsDirective);
            }
            if (lastChar === '.' || isSpacy(lastChar)) {
                completions.push(rootClass);
                addExistingClasses(stylesheet, completions);
            }
        }
        else if (lastChar === ':' && stylesheet !== undefined) {
            const selectorRes = selector_analyzer_1.parseSelector(currentLine, cursorLineIndex); //position.character);
            const focusChunk = selectorRes.target.focusChunk;
            if (!Array.isArray(focusChunk) && selector_analyzer_1.isSelectorChunk(focusChunk)) {
                focusChunk.classes.forEach((className) => {
                    const clsDef = get_definitions_1.getDefinition(stylesheet, className, resolver);
                    if (get_definitions_1.isClassDefinition(clsDef)) {
                        clsDef.states.forEach((stateDef) => {
                            if (focusChunk.states.indexOf(stateDef.name) !== -1) {
                                return;
                            }
                            const from = 'from: ' + stateDef.from;
                            completions.push(stateCompletion(stateDef.name, stateDef.from, position));
                        });
                    }
                });
            }
        }
        return Promise.resolve(completions);
    }
}
exports.default = Provider;
function getSelectorFromPosition(src, index) {
}
function getNewCompletions(completionMap, ruleset) {
    ruleset.nodes.forEach(node => {
        let dec = node;
        if (completionMap[dec.prop]) {
            delete completionMap[dec.prop];
        }
    });
    return Object.keys(completionMap).map(name => completionMap[name]);
}
//# sourceMappingURL=provider.js.map