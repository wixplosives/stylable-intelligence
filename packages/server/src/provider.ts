//must remain independent from vscode
import { MinimalDocs } from './provider-factory';
import * as PostCss from 'postcss';
const pvp = require('postcss-value-parser');
const psp = require('postcss-selector-parser');
import { StylableMeta, process as stylableProcess, safeParse, SRule, Stylable, CSSResolve, ImportSymbol, valueMapping, StylableTransformer, Diagnostics, expandCustomSelectors as RemoveWhenWorks, expandCustomSelectors } from 'stylable';
import { isSelector, pathFromPosition, isDeclaration } from './utils/postcss-ast-utils';
import {
    createRange,
    ExtendCompletionProvider,
    GlobalCompletionProvider,
    ImportInternalDirectivesProvider,
    CssMixinCompletionProvider,
    NamedCompletionProvider,
    ProviderOptions,
    ProviderPosition,
    ProviderRange,
    PseudoElementCompletionProvider,
    RulesetInternalDirectivesProvider,
    SelectorCompletionProvider,
    StateCompletionProvider,
    TopLevelDirectiveProvider,
    ValueCompletionProvider,
    ValueDirectiveProvider,
    CodeMixinCompletionProvider,
    FormatterCompletionProvider,
    CompletionProvider
} from './completion-providers';
import { Completion, } from './completion-types';
import { parseSelector, SelectorChunk, } from './utils/selector-analyzer';
import { Declaration } from 'postcss';
import * as path from 'path';
import { Position, SignatureHelp, SignatureInformation, ParameterInformation } from 'vscode-languageserver';
import * as ts from 'typescript';
import { SignatureDeclaration, ParameterDeclaration, TypeReferenceNode, QualifiedName, Identifier, LiteralTypeNode } from 'typescript';
import { nativePathToFileUri } from './utils/uri-utils';
import { resolve } from 'url';
import * as _ from 'lodash';


export default class Provider {
    constructor(public styl: Stylable) { }

    public providers = [
        RulesetInternalDirectivesProvider,
        ImportInternalDirectivesProvider,
        TopLevelDirectiveProvider,
        ValueDirectiveProvider,
        GlobalCompletionProvider,
        SelectorCompletionProvider,
        ExtendCompletionProvider,
        CssMixinCompletionProvider,
        CodeMixinCompletionProvider,
        FormatterCompletionProvider,
        NamedCompletionProvider,
        StateCompletionProvider,
        PseudoElementCompletionProvider,
        ValueCompletionProvider,
    ]

    public provideCompletionItemsFromSrc(src: string, pos: Position, fileName: string, docs: MinimalDocs): Thenable<Completion[]> {
        let res = fixAndProcess(src, pos, fileName);
        return this.provideCompletionItemsFromAst(src, res.currentLine, res.cursorLineIndex, pos, res.processed.meta!, res.processed.fakes, docs);
    }

    public provideCompletionItemsFromAst(
        src: string,
        lineText: string,
        cursorPosInLine: number,
        position: ProviderPosition,
        meta: StylableMeta,
        fakes: PostCss.Rule[],
        docs: MinimalDocs,
    ): Thenable<Completion[]> {
        const completions: Completion[] = [];
        try {
            let options = this.createProviderOptions(src, position, meta, fakes, lineText, cursorPosInLine, docs);
            this.providers.forEach(p => {
                options.isLineStart = p.text.some((s: string) => s.indexOf(lineText.trim()) === 0);
                completions.push(...p.provide(options));
            });
        } catch (e) { }
        return Promise.resolve(this.dedupe(completions));
    }

    private createProviderOptions(
        src: string,
        position: ProviderPosition,
        meta: StylableMeta,
        fakeRules: PostCss.Rule[],
        fullLineText: string,
        cursorPosInLine: number,
        docs: MinimalDocs): ProviderOptions {

        const transformer = new StylableTransformer({
            diagnostics: new Diagnostics(),
            fileProcessor: this.styl.fileProcessor,
            requireModule: () => { throw new Error('Not implemented, why are we here') }
        })

        const path = pathFromPosition(meta.rawAst, { line: position.line + 1, character: position.character });
        const astAtCursor: PostCss.NodeBase = path[path.length - 1];
        const parentAst: PostCss.NodeBase | undefined = (astAtCursor as PostCss.Declaration).parent ? (astAtCursor as PostCss.Declaration).parent : undefined;
        const lastSelectorPart: SRule | null = parentAst && isSelector(parentAst) && fakeRules.findIndex((f) => { return f.selector === parentAst.selector }) === -1
            ? <SRule>parentAst
            : astAtCursor && isSelector(astAtCursor) && fakeRules.findIndex((f) => { return f.selector === astAtCursor.selector }) === -1
                ? <SRule>astAtCursor
                : null;

        const { lineChunkAtCursor, fixedCharIndex } = getChunkAtCursor(fullLineText, cursorPosInLine);
        const ps = parseSelector(lineChunkAtCursor, fixedCharIndex);
        const chunkStrings: string[] = ps.selector.reduce((acc, s) => { return acc.concat(s.text) }, ([] as string[]));
        const currentSelector = (ps.selector[0] as SelectorChunk).classes[0] || (ps.selector[0] as SelectorChunk).customSelectors[0] || chunkStrings[0];
        const expandedLine: string = expandCustomSelectors(PostCss.rule({ selector: lineChunkAtCursor }), meta.customSelectors).split(' ').pop()!;// TODO: replace with selector parser
        const resolvedElements = transformer.resolveSelectorElements(meta, expandedLine);

        let resolved: CSSResolve[] = [];
        if (currentSelector && resolvedElements[0].length) {
            const clas = resolvedElements[0].find(e => e.type === 'class' || (e.type === 'element' && e.resolved.length > 1));  //TODO: better type parsing
            resolved = clas ? clas.resolved : [];
        }

        const lastPseudo = _.findLast(resolvedElements[0], e => e.type === 'pseudo-element' && e.resolved.length > 0)
        let pseudoElementId = lastPseudo ? lastPseudo.name : '';

        let customSelectorType = '';
        let customSelectorString = '';
        let expanded = '';
        if (lineChunkAtCursor.startsWith(':--')) {
            customSelectorString = lineChunkAtCursor.match(/^(:--\w*)/)![1];
            expanded = meta.customSelectors[customSelectorString];
        }

        if (lastPseudo &&
            !!lastPseudo.resolved[0].meta.customSelectors[':--' + pseudoElementId]
        ) {
            customSelectorString = ':--' + pseudoElementId;
            expanded = lastPseudo.resolved[0].meta.customSelectors[customSelectorString];
            pseudoElementId = '';
        }

        if (expanded) {
            customSelectorType = lastPseudo ? lastPseudo.resolved[0].symbol.name : resolvedElements[0][0].name
        }

        const { isNamedValueLine, namedValues } = getNamedValues(src, position.line);

        const importVars: any[] = [];
        meta.imports.forEach(imp => {
            try {
                this.styl.fileProcessor.process(imp.from).vars.forEach(v => importVars.push({ name: v.name, value: v.text, from: imp.fromRelative }))
            } catch (e) { }
        })


        return {
            meta: meta,
            docs: docs,
            styl: this.styl,
            parentSelector: lastSelectorPart,
            astAtCursor: astAtCursor,
            lineChunkAtCursor: lineChunkAtCursor,
            fullLineText: fullLineText,
            position: position,
            isLineStart: false,
            isNamedValueLine: isNamedValueLine,
            namedValues: namedValues,
            resolved: resolved,
            currentSelector: currentSelector,
            target: ps.target,
            isMediaQuery: isInMediaQuery(path),
            fakes: fakeRules,
            pseudo: pseudoElementId,
            resolvedPseudo: lastPseudo ? lastPseudo.resolved : [],
            customSelector: customSelectorString,
            customSelectorType: customSelectorType,
            isInValue: isInValue(fullLineText, position),
            importVars: importVars,
        }
    }


    private dedupe(completions: Completion[]): Completion[] {
        let uniqs = new Map<string, Completion>();
        completions.forEach(comp => {
            if (!uniqs.has(comp.label)) {
                uniqs.set(comp.label, comp);
            }
        });
        let res: Completion[] = [];
        uniqs.forEach(v => res.push(v));
        return res;
    }

    public getDefinitionLocation(src: string, position: ProviderPosition, filePath: string, docs: MinimalDocs): Thenable<ProviderLocation[]> {
        if (!filePath.endsWith('.st.css')) { return Promise.resolve([]) }

        let res = fixAndProcess(src, position, filePath);
        let meta = res.processed.meta;
        if (!meta) return Promise.resolve([]);
        const parsed: any[] = pvp(res.currentLine).nodes;

        function findNode(nodes: any[], index: number): any {
            return nodes
                .filter(n => n.sourceIndex <= index)
                .reduce((m, n) => { return (m.sourceIndex > n.sourceIndex) ? m : n }, { sourceIndex: -1 })
        }

        let val = findNode(parsed, position.character);
        while (val.nodes && val.nodes.length > 0) {
            if (findNode(val.nodes, position.character).sourceIndex >= 0) {
                val = findNode(val.nodes, position.character)
            } else {
                break;
            }
        }

        let word = val.value;

        let defs: ProviderLocation[] = [];

        if (Object.keys(meta.mappedSymbols).find(sym => sym === word.replace('.', ''))) {
            const symb = meta.mappedSymbols[word.replace('.', '')];
            switch (symb._kind) {
                case 'class': {
                    defs.push(
                        new ProviderLocation(meta.source, this.findWord(word, src, position))
                    );
                    break;
                }
                case 'var': {
                    defs.push(
                        new ProviderLocation(meta.source, this.findWord(word, src, position))
                    );
                    break;
                }
                case 'import': {
                    const filePath: string = path.join(path.dirname(meta.source), (symb as ImportSymbol).import.fromRelative);

                    defs.push(
                        new ProviderLocation(
                            filePath,
                            this.findWord(word, docs.get(nativePathToFileUri(filePath)).getText(), position)
                        )
                    );
                    break;
                }
            }
        } else if (Object.keys(meta.customSelectors).find(sym => sym === ':--' + word)) {
            defs.push(
                new ProviderLocation(meta.source, this.findWord(':--' + word, src, position))
            );
        }

        return Promise.resolve(defs.filter(def => !this.inDef(position, def)));
    }

    inDef(position: ProviderPosition, def: ProviderLocation): boolean {
        return (position.line > def.range.start.line || (position.line === def.range.start.line && position.character >= def.range.start.character))
            && (position.line < def.range.end.line || (position.line === def.range.end.line && position.character <= def.range.end.character))
    }

    findWord(word: string, src: string, position: Position): ProviderRange {
        let split = src.split('\n');
        let lineIndex = split.findIndex(l => {
            return (l.trim().startsWith(word) || l.trim().startsWith('.' + word))
                && (l.trim().replace('.', '').slice(word.length).trim().startsWith('{') || l.trim().replace('.', '').slice(word.length).trim().startsWith(':'));
        })
        if (lineIndex === -1 || lineIndex === position.line) { lineIndex = split.findIndex(l => l.trim().indexOf(word) !== -1) }
        if (lineIndex === -1 || lineIndex === position.line) { return createRange(0, 0, 0, 0) };
        let line = split[lineIndex];
        return createRange(
            lineIndex, line.indexOf(word), lineIndex, line.indexOf(word) + word.length
        )
    }

    getSignatureHelp(src: string, pos: Position, filePath: string, documents: MinimalDocs, paramInfo: typeof ParameterInformation): SignatureHelp | null {
        if (!filePath.endsWith('.st.css')) { return null }
        let res = fixAndProcess(src, pos, filePath);
        let meta = res.processed.meta;
        if (!meta) return null;

        let split = src.split('\n');
        let line = split[pos.line];
        let value: string = '';


        if (line.slice(0, pos.character).trim().startsWith(valueMapping.mixin)) {
            value = line.slice(0, pos.character).trim().slice(valueMapping.mixin.length + 1).trim();
        } else if (line.slice(0, pos.character).trim().includes(':')) {
            value = line.slice(0, pos.character).trim().slice(line.slice(0, pos.character).trim().indexOf(':') + 1).trim();
        }
        let parsed = pvp(value);
        let mixin = '';

        const rev = parsed.nodes.reverse()[0];
        if (rev.type === 'function' && !!rev.unclosed) {
            mixin = rev.value;
        } else { return null };
        let activeParam = parsed.nodes.reverse()[0].nodes.reduce((acc: number, cur: any) => { return (cur.type === 'div' ? acc + 1 : acc) }, 0);
        if (mixin === 'value') { return null }

        if ((meta.mappedSymbols[mixin]! as ImportSymbol).import.from.endsWith('.ts')) {
            return this.getSignatureForTsModifier(mixin, activeParam, (meta.mappedSymbols[mixin]! as ImportSymbol).import.from, (meta.mappedSymbols[mixin]! as ImportSymbol).type === 'default', paramInfo);
        } else if ((meta.mappedSymbols[mixin]! as ImportSymbol).import.from.endsWith('.js')) {
            if (documents.keys().indexOf('file://' + (meta.mappedSymbols[mixin]! as ImportSymbol).import.from.slice(0, -3) + '.d.ts') !== -1) {
                return this.getSignatureForTsModifier(mixin, activeParam, (meta.mappedSymbols[mixin]! as ImportSymbol).import.from.slice(0, -3) + '.d.ts', (meta.mappedSymbols[mixin]! as ImportSymbol).type === 'default', paramInfo);
            } else {
                console.log((meta.mappedSymbols[mixin]! as ImportSymbol).import.from);
                return this.getSignatureForJsModifier(
                    mixin,
                    activeParam,
                    documents.get(
                        ((meta.mappedSymbols[mixin]! as ImportSymbol).import.from.startsWith('/')
                            ? 'file://'
                            : '')
                        + (meta.mappedSymbols[mixin]! as ImportSymbol).import.from
                    ).getText(), paramInfo);
            }
        } else {
            return null;
        }
    }

    getSignatureForTsModifier(mixin: string, activeParam: number, filePath: string, isDefault: boolean, paramInfo: typeof ParameterInformation): SignatureHelp | null {
        let sig: ts.Signature | undefined = extractTsSignature(filePath, mixin, isDefault)
        let ptypes = sig!.parameters.map(p => {
            return p.name + ":" + ((p.valueDeclaration as ParameterDeclaration).type as TypeReferenceNode).getFullText()
        });
        let rtype = sig!.declaration.type
            ? ((sig!.declaration.type as TypeReferenceNode).typeName as Identifier).getFullText()
            : "";

        let parameters: ParameterInformation[] = sig!.parameters.map(pt => {
            let label = pt.name + ":" + ((pt.valueDeclaration as ParameterDeclaration).type as TypeReferenceNode).getFullText();
            return paramInfo.create(label)
        });

        let sigInfo: SignatureInformation = {
            label: mixin + '(' + ptypes.join(', ') + '): ' + rtype,
            parameters
        }

        return {
            activeParameter: activeParam,
            activeSignature: 0,
            signatures: [sigInfo]
        } as SignatureHelp
    }

    getSignatureForJsModifier(mixin: string, activeParam: number, fileSrc: string, paramInfo: typeof ParameterInformation): SignatureHelp | null {

        let lines = fileSrc.split('\n');
        let mixinLine: number = lines.findIndex(l => l.trim().startsWith('exports.' + mixin));
        let docStartLine: number = lines.slice(0, mixinLine).lastIndexOf(lines.slice(0, mixinLine).reverse().find(l => l.trim().startsWith('/**'))!)
        let docLines = lines.slice(docStartLine, mixinLine)
        let formattedLines: string[] = [];

        docLines.forEach(l => {
            if (l.trim().startsWith('*/')) { return }
            if (l.trim().startsWith('/**') && !!l.trim().slice(3).trim()) { formattedLines.push(l.trim().slice(3).trim()) }
            if (l.trim().startsWith('*')) { formattedLines.push(l.trim().slice(1).trim()) }
        })

        const returnStart: number = formattedLines.findIndex(l => l.startsWith('@returns'));
        const returnEnd: number = formattedLines.slice(returnStart + 1).findIndex(l => l.startsWith('@')) === -1
            ? formattedLines.length - 1
            : formattedLines.slice(returnStart + 1).findIndex(l => l.startsWith('@')) + returnStart;

        const returnLines = formattedLines.slice(returnStart, returnEnd + 1);
        formattedLines.splice(returnStart, returnLines.length)
        const returnType = /@returns *{(\w+)}/.exec(returnLines[0])
            ? /@returns *{(\w+)}/.exec(returnLines[0])![1]
            : '';

        const summaryStart: number = formattedLines.findIndex(l => l.startsWith('@summary'));
        let summaryLines: string[] = [];
        if (summaryStart !== -1) {
            const summaryEnd: number = formattedLines.slice(summaryStart + 1).findIndex(l => l.startsWith('@')) === -1
                ? formattedLines.length - 1
                : formattedLines.slice(summaryStart + 1).findIndex(l => l.startsWith('@')) + summaryStart;

            summaryLines = formattedLines.slice(summaryStart, summaryEnd + 1);
            formattedLines.splice(summaryStart, summaryLines.length)
        }

        let params: [string, string, string][] = [];
        while (formattedLines.find(l => l.startsWith('@param'))) {
            const paramStart: number = formattedLines.findIndex(l => l.startsWith('@param'));
            const paramEnd: number = formattedLines.slice(paramStart + 1).findIndex(l => l.startsWith('@')) === -1
                ? formattedLines.length - 1
                : formattedLines.slice(paramStart + 1).findIndex(l => l.startsWith('@')) + paramStart;

            const paramLines = formattedLines.slice(paramStart, paramEnd + 1);
            formattedLines.splice(paramStart, paramLines.length);
            if (/@param *{([ \w<>,'"|]*)} *(\w*)(.*)/.exec(paramLines[0])) {
                params.push([
                    /@param *{([ \w<>,'"|]*)} *(\w*)(.*)/.exec(paramLines[0])![1],
                    /@param *{([ \w<>,'"|]*)} *(\w*)(.*)/.exec(paramLines[0])![2],
                    /@param *{([ \w<>,'"|]*)} *(\w*)(.*)/.exec(paramLines[0])![3],
                ])
            }
        }

        let descLines: string[] = [];
        if (formattedLines.find(l => l.startsWith('@description'))) {
            const descStart: number = formattedLines.findIndex(l => l.startsWith('@description'));
            const descEnd: number = formattedLines.slice(descStart + 1).findIndex(l => l.startsWith('@')) === -1
                ? formattedLines.length - 1
                : formattedLines.slice(descStart + 1).findIndex(l => l.startsWith('@')) + descStart;

            descLines = formattedLines.slice(descStart, descEnd + 1);
        } else if (formattedLines.findIndex(l => l.startsWith('@')) === -1) {
            descLines = formattedLines;
        } else {
            descLines = formattedLines.slice(0, formattedLines.findIndex(l => l.startsWith('@')) + 1)
        }
        if (descLines[0] && descLines[0].startsWith('@description')) { descLines[0] = descLines[0].slice(12).trim() }

        let parameters: ParameterInformation[] = params.map(p => paramInfo.create(p[1] + ': ' + p[0], p[2].trim()))

        let sigInfo: SignatureInformation = {
            label: mixin + '(' + parameters.map(p => p.label).join(', ') + '): ' + returnType,
            documentation: descLines.join('\n'),
            parameters
        }
        return {
            activeParameter: activeParam,
            activeSignature: 0,
            signatures: [sigInfo]
        } as SignatureHelp
    }


}


function isIllegalLine(line: string): boolean {
    return /^\s*[-\.:]+\s*$/.test(line)
}

const lineEndsRegexp = /({|}|;)/;

export function createMeta(src: string, path: string) {
    let meta: StylableMeta;
    let fakes: PostCss.Rule[] = [];
    try {
        let ast: PostCss.Root = safeParse(src, { from: createFrom(path) })
        ast.nodes && ast.nodes.forEach((node) => {
            if (node.type === 'decl') {
                let r = PostCss.rule({ selector: node.prop + ':' + node.value });
                r.source = node.source;
                node.replaceWith(r);
                fakes.push(r)
            }
        })
        if (ast.raws.after && ast.raws.after.trim()) {
            let r = PostCss.rule({ selector: ast.raws.after.trim() })
            ast.append(r);
            fakes.push(r);
        }

        meta = stylableProcess(ast);
    } catch (error) {
        return { meta: null, fakes: fakes };
    }
    return {
        meta: meta,
        fakes: fakes
    }
}

function createFrom(filePath: string): string | undefined {
    return filePath.indexOf('file://') === 0 ? decodeURIComponent(filePath.slice(7 + Number(process.platform === 'win32'))) : decodeURIComponent(filePath);
}

function fixAndProcess(src: string, position: ProviderPosition, filePath: string, ) {
    let cursorLineIndex: number = position.character;
    let lines = src.replace(/\r\n/g, '\n').split('\n');
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

    let processed = createMeta(fixedSrc, filePath);
    return {
        processed: processed,
        currentLine: currentLine,
        cursorLineIndex: cursorLineIndex,
    }
}

export class ProviderLocation {
    constructor(public uri: string, public range: ProviderRange) { }
}

export function extractTsSignature(filePath: string, mixin: string, isDefault: boolean): ts.Signature | undefined {
    const compilerOptions: ts.CompilerOptions = {
        "jsx": ts.JsxEmit.React,
        "lib": ['lib.es2015.d.ts', 'lib.dom.d.ts'],
        "module": ts.ModuleKind.CommonJS,
        "target": ts.ScriptTarget.ES5,
        "strict": false,
        "importHelpers": false,
        "noImplicitReturns": false,
        "strictNullChecks": false,
        "sourceMap": false,
        "outDir": "dist",
        "typeRoots": ["./node_modules/@types"]
    };
    let program = ts.createProgram([filePath], compilerOptions);
    let tc = program.getTypeChecker();
    let sf = program.getSourceFile(filePath);
    let mix = tc.getSymbolsInScope(sf, ts.SymbolFlags.Function).find(f => {
        if (isDefault) {
            return (f as any).exportSymbol && (f as any).exportSymbol.escapedName === 'default'
        } else {
            return (f as any).exportSymbol && (f as any).exportSymbol.escapedName === mixin
        }
    });
    if (!mix) { return undefined }
    return tc.getSignatureFromDeclaration(mix!.declarations![0] as SignatureDeclaration);
}

export function extractJsModifierRetrunType(mixin: string, activeParam: number, fileSrc: string): string {

    let lines = fileSrc.split('\n');
    let mixinLine: number = lines.findIndex(l => l.trim().startsWith('exports.' + mixin));
    let docStartLine: number = lines.slice(0, mixinLine).lastIndexOf(lines.slice(0, mixinLine).reverse().find(l => l.trim().startsWith('/**'))!)
    let docLines = lines.slice(docStartLine, mixinLine)
    let formattedLines: string[] = [];

    docLines.forEach(l => {
        if (l.trim().startsWith('*/')) { return }
        if (l.trim().startsWith('/**') && !!l.trim().slice(3).trim()) { formattedLines.push(l.trim().slice(3).trim()) }
        if (l.trim().startsWith('*')) { formattedLines.push(l.trim().slice(1).trim()) }
    })

    const returnStart: number = formattedLines.findIndex(l => l.startsWith('@returns'));
    const returnEnd: number = formattedLines.slice(returnStart + 1).findIndex(l => l.startsWith('@')) === -1
        ? formattedLines.length - 1
        : formattedLines.slice(returnStart + 1).findIndex(l => l.startsWith('@')) + returnStart;

    const returnLines = formattedLines.slice(returnStart, returnEnd + 1);
    formattedLines.splice(returnStart, returnLines.length)
    const returnType = /@returns *{(\w+)}/.exec(returnLines[0])
        ? /@returns *{(\w+)}/.exec(returnLines[0])![1]
        : '';
    return returnType;
}

function isInMediaQuery(path: PostCss.NodeBase[]) { return path.some(n => (n as PostCss.Container).type === 'atrule' && (n as PostCss.AtRule).name === 'media') };
export function isDirective(line: string) { return Object.keys(valueMapping).some(k => line.trim().startsWith((valueMapping as any)[k])) };
function isNamedDirective(line: string) { return line.indexOf(valueMapping.named) !== -1 };
function isInValue(lineText: string, position: ProviderPosition) {
    let isInValue: boolean = false;

    if (/value\(/.test(lineText)) {
        let line = lineText.slice(0, position.character);
        let stack = 0;
        for (let i = 0; i <= line.length; i++) {
            if (line[i] === '(') {
                stack += 1
            } else if (line[i] === ')') {
                stack -= 1
            }
        }
        if (stack > 0) { isInValue = true }
    }
    return isInValue;
}

function getChunkAtCursor(fullLineText: string, cursorPosInLine: number): { lineChunkAtCursor: string, fixedCharIndex: number } {
    let fixedCharIndex = cursorPosInLine;
    let lineChunkAtCursor = fullLineText;
    while (lineChunkAtCursor.lastIndexOf(' ') >= cursorPosInLine) {
        lineChunkAtCursor = lineChunkAtCursor.slice(0, lineChunkAtCursor.lastIndexOf(' '))
    }
    if (!isDirective(lineChunkAtCursor) && lineChunkAtCursor.lastIndexOf(' ') > -1 && lineChunkAtCursor.lastIndexOf(' ') < cursorPosInLine) {
        fixedCharIndex -= (lineChunkAtCursor.lastIndexOf(' ') + 1);
        lineChunkAtCursor = lineChunkAtCursor.slice(lineChunkAtCursor.lastIndexOf(' '));
    }
    return { lineChunkAtCursor: lineChunkAtCursor.trim(), fixedCharIndex };
}

function getNamedValues(src: string, lineIndex: number): { isNamedValueLine: boolean, namedValues: string[] } {
    let lines = src.split('\n');
    let isNamedValueLine = false;
    let namedValues: string[] = [];

    for (let i = lineIndex; i > 0; i--) {
        if (isDirective(lines[i]) && !isNamedDirective(lines[i])) {
            break;
        } else if (isNamedDirective(lines[i])) {
            isNamedValueLine = true;
            let valueStart = lines[i].indexOf(':') + 1;
            let value = lines[i].slice(valueStart);
            value.split(',').map(x => x.trim()).filter(x => x !== '').forEach(x => namedValues.push(x));
            break;
        } else {
            let valueStart = lines[i].indexOf(':') + 1;
            let value = lines[i].slice(valueStart);
            value.split(',').map(x => x.trim()).filter(x => x !== '').forEach(x => namedValues.push(x));
        }
    }

    return { isNamedValueLine, namedValues }
}
