//must remain independent from vscode
import { MinimalDocs } from './provider-factory';
import * as PostCss from 'postcss';
const pvp = require('postcss-value-parser');
const psp = require('postcss-selector-parser');
const cst = require('css-selector-tokenizer');
import { StylableMeta, process as stylableProcess, safeParse, SRule, Stylable, CSSResolve, ImportSymbol, valueMapping, StylableTransformer, Diagnostics, expandCustomSelectors as RemoveWhenWorks, expandCustomSelectors, StateParsedValue, ParsedValue } from 'stylable';
import { isSelector, pathFromPosition, isDeclaration, isRoot, isContainer } from './utils/postcss-ast-utils';
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
import { Declaration, NodeBase, ContainerBase } from 'postcss';
import * as path from 'path';
import { Position, SignatureHelp, SignatureInformation, ParameterInformation, ReferenceParams, Location } from 'vscode-languageserver';
import * as ts from 'typescript';
import { SignatureDeclaration, ParameterDeclaration, TypeReferenceNode, QualifiedName, Identifier, LiteralTypeNode } from 'typescript';
import { toVscodePath } from './utils/uri-utils';
import { resolve } from 'url';
import { keys, values, last } from 'lodash';
import { ExtendedFSReadSync, ExtendedTsLanguageService } from './types';
import { createLanguageServiceHost } from './utils/temp-language-service-host';
import { fromVscodePath } from './utils/uri-utils';
import { ClassSymbol } from 'stylable/dist/src/stylable-processor';
import { exec } from 'child_process';

import { systemValidators } from 'stylable/dist/src/state-validators'; // TODO: export these properly from stylable

export default class Provider {
    constructor(public styl: Stylable, public tsLangService: ExtendedTsLanguageService) { }

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

    public provideCompletionItemsFromSrc(src: string, pos: Position, fileName: string, fs: ExtendedFSReadSync): Thenable<Completion[]> {
        let res = fixAndProcess(src, pos, fileName);
        const completions: Completion[] = [];
        try {
            let options = this.createProviderOptions(src, pos, res.processed.meta!, res.processed.fakes, res.currentLine, res.cursorLineIndex, fs);
            this.providers.forEach(p => { completions.push(...p.provide(options)) });
        } catch (e) { }
        return Promise.resolve(this.dedupeComps(completions));
    }

    private createProviderOptions(
        src: string,
        position: ProviderPosition,
        meta: StylableMeta,
        fakeRules: PostCss.Rule[],
        fullLineText: string,
        cursorPosInLine: number,
        fs: ExtendedFSReadSync): ProviderOptions {

        const transformer = new StylableTransformer({
            diagnostics: new Diagnostics(),
            fileProcessor: this.styl.fileProcessor,
            requireModule: () => { throw new Error('Not implemented, why are we here') }
        })

        const path = pathFromPosition(meta.rawAst, { line: position.line + 1, character: position.character });
        const astAtCursor: PostCss.NodeBase = path[path.length - 1];
        const parentAst: PostCss.NodeBase | undefined = (astAtCursor as PostCss.Declaration).parent ? (astAtCursor as PostCss.Declaration).parent : undefined;
        const parentSelector: SRule | null = parentAst && isSelector(parentAst) && fakeRules.findIndex((f) => { return f.selector === parentAst.selector }) === -1
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

        return {
            meta: meta,
            fs: fs,
            styl: this.styl,
            src: src,
            tsLangService: this.tsLangService,
            resolvedElements: resolvedElements,
            parentSelector: parentSelector,
            astAtCursor: astAtCursor,
            lineChunkAtCursor: lineChunkAtCursor,
            lastSelectoid: ps.lastSelector,
            fullLineText: fullLineText,
            position: position,
            resolved: resolved,
            currentSelector: currentSelector,
            target: ps.target,
            isMediaQuery: isInMediaQuery(path),
            fakes: fakeRules,
        }
    }

    private dedupeComps(completions: Completion[]): Completion[] {
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

    public getDefinitionLocation(src: string, position: ProviderPosition, filePath: string, fs: ExtendedFSReadSync): Thenable<ProviderLocation[]> {

        if (!filePath.endsWith('.st.css')) { return Promise.resolve([]) }

        let res = fixAndProcess(src, position, filePath);
        let meta = res.processed.meta;
        if (!meta) { return Promise.resolve([]) };

        const parsed: any[] = pvp(res.currentLine).nodes;

        let val = findNode(parsed, position.character);
        while (val.nodes && val.nodes.length > 0) {
            if (findNode(val.nodes, position.character).sourceIndex >= 0) {
                val = findNode(val.nodes, position.character)
            } else {
                break;
            }
        }

        let word = val.value;

        const { lineChunkAtCursor, fixedCharIndex } = getChunkAtCursor(res.currentLine.slice(0, val.sourceIndex + val.value.length), position.character);
        const transformer = new StylableTransformer({
            diagnostics: new Diagnostics(),
            fileProcessor: this.styl.fileProcessor,
            requireModule: () => { throw new Error('Not implemented, why are we here') }
        })
        const expandedLine: string = expandCustomSelectors(PostCss.rule({ selector: lineChunkAtCursor }), meta.customSelectors).split(' ').pop()!;// TODO: replace with selector parser
        const resolvedElements = transformer.resolveSelectorElements(meta, expandedLine);

        let defs: ProviderLocation[] = [];

        const reso = resolvedElements[0][resolvedElements[0].length - 1].resolved.find(res => {
            return res.symbol.name === word.replace('.', '') || keys((res.symbol as ClassSymbol)[valueMapping.states]).some(k => k === word)
        })

        if (reso) { meta = reso.meta; }
        let temp: ClassSymbol | null = null;

        if (keys(meta.mappedSymbols).find(sym => sym === word.replace('.', ''))) {
            const symb = meta.mappedSymbols[word.replace('.', '')];
            switch (symb._kind) {
                case 'class': {
                    defs.push(
                        new ProviderLocation(meta.source, this.findWord(word, fs.get(meta.source).getText(), position))
                    );
                    break;
                }
                case 'var': {
                    defs.push(
                        new ProviderLocation(meta.source, this.findWord(word, fs.get(meta.source).getText(), position))
                    );
                    break;
                }
                case 'import': {
                    const filePath: string = path.join(path.dirname(meta.source), (symb as ImportSymbol).import.fromRelative);
                    const doc = fs.get(filePath);

                    if (doc.getText() !== '') {
                        defs.push(
                            new ProviderLocation(
                                filePath,
                                this.findWord(word, doc.getText(), position)
                            )
                        )
                    };
                    break;
                }
            }
        } else if (values(meta.mappedSymbols).some(k => {
            if (k._kind === 'class' && keys(k[valueMapping.states]).some(key => key === word)) {
                temp = k;
                return true
            } else { return false }
        })) {
            defs.push(
                new ProviderLocation(meta.source, this.findWord(temp!.name, fs.get(meta.source).getText(), position))
            )
        } else if (keys(meta.customSelectors).find(sym => sym === ':--' + word)) {
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
        let regex = '\\b' + '\\.?' + this.escapeRegExp(word.replace('.', '').replace(':--', '')) + '\\b';
        let lineIndex = split.findIndex(l => RegExp(regex).test(l));
        if (lineIndex === -1 || lineIndex === position.line) { lineIndex = split.findIndex(l => l.trim().indexOf(word) !== -1) }
        if (lineIndex === -1 || lineIndex === position.line) { return createRange(0, 0, 0, 0) };
        let line = split[lineIndex];

        const match = line.match(RegExp(regex))

        if (match) {
            return createRange(lineIndex, line.lastIndexOf(word), lineIndex, line.lastIndexOf(word) + word.length)
        } else {
            return createRange(0, 0, 0, 0)
        }
    }


    escapeRegExp(re: string) {
        return re.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    getSignatureHelp(src: string, pos: Position, filePath: string, fs: ExtendedFSReadSync, paramInfo: typeof ParameterInformation): SignatureHelp | null {

        if (!filePath.endsWith('.st.css')) { return null }
        const { processed: { meta } } = fixAndProcess(src, pos, filePath);
        if (!meta) return null;

        const split = src.split('\n');
        const line = split[pos.line];
        let value: string = '';


        const path = pathFromPosition(meta.rawAst, { line: pos.line + 1, character: pos.character + 1 });

        if (isRoot(last(path)!)) {
            return this.getSignatureForStateWithParamSelector(meta, pos, line)
        } else if (line.slice(0, pos.character).trim().startsWith(valueMapping.states)) {
            return this.getSignatureForStateWithParamDefinition(meta, pos, line);
        }

        //If last node is not root, we're in a declaration [TODO: or a mdeia query]
        if (line.slice(0, pos.character).trim().startsWith(valueMapping.mixin)) { //TODO: handle multiple lines as well
            value = line.slice(0, pos.character).trim().slice(valueMapping.mixin.length + 1).trim();
        } else if (line.slice(0, pos.character).trim().includes(':')) {
            value = line.slice(0, pos.character).trim().slice(line.slice(0, pos.character).trim().indexOf(':') + 1).trim();
        }
        const parsed = pvp(value);

        let mixin = '';
        const rev = parsed.nodes.reverse()[0];
        if (rev.type === 'function' && !!rev.unclosed) {
            mixin = rev.value;
        } else {
            return null
        };
        let activeParam = parsed.nodes.reverse()[0].nodes.reduce((acc: number, cur: any) => { return (cur.type === 'div' ? acc + 1 : acc) }, 0);
        if (mixin === 'value') { return null }

        if ((meta.mappedSymbols[mixin]! as ImportSymbol).import.from.endsWith('.ts')) {
            return this.getSignatureForTsModifier(mixin, activeParam, (meta.mappedSymbols[mixin]! as ImportSymbol).import.from, (meta.mappedSymbols[mixin]! as ImportSymbol).type === 'default', paramInfo);
        } else if ((meta.mappedSymbols[mixin]! as ImportSymbol).import.from.endsWith('.js')) {
            if (fs.getOpenedFiles().indexOf(toVscodePath((meta.mappedSymbols[mixin]! as ImportSymbol).import.from.slice(0, -3) + '.d.ts')) !== -1) {
                return this.getSignatureForTsModifier(mixin, activeParam, (meta.mappedSymbols[mixin]! as ImportSymbol).import.from.slice(0, -3) + '.d.ts', (meta.mappedSymbols[mixin]! as ImportSymbol).type === 'default', paramInfo);
            } else {
                return this.getSignatureForJsModifier(
                    mixin,
                    activeParam,
                    fs.get((meta.mappedSymbols[mixin]! as ImportSymbol).import.from).getText(),
                    paramInfo
                )
            }
        } else {
            return null;
        }
    }

    getSignatureForTsModifier(mixin: string, activeParam: number, filePath: string, isDefault: boolean, paramInfo: typeof ParameterInformation): SignatureHelp | null {
        let sig: ts.Signature | undefined = extractTsSignature(filePath, mixin, isDefault, this.tsLangService)

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

    getSignatureForStateWithParamSelector(meta: StylableMeta, pos: ProviderPosition, line: string): SignatureHelp | null {
        let word: string = '';
        const posChar = pos.character + 1;
        const parsed = cst.parse(line);
        if (parsed.nodes[0].type === 'selector') {
            let length = 0;
            parsed.nodes[0].nodes.forEach((node: any) => {
                length += node.name.length + 1;
                if (node.type === 'pseudo-class' && (posChar > length + 1) && (posChar <= length + 2 + node.content.length)) {
                    word = node.name;
                }
            })
        }

        let stateDef = null as StateParsedValue | null;

        if (word) {
            const transformer = new StylableTransformer({
                diagnostics: new Diagnostics(),
                fileProcessor: this.styl.fileProcessor,
                requireModule: () => { throw new Error('Not implemented, why are we here') }
            })
            let resolvedElements = transformer.resolveSelectorElements(meta, line);
            resolvedElements[0][0].resolved.forEach(el => {
                const symbolStates = (el.symbol as ClassSymbol)[valueMapping.states]
                if (symbolStates && typeof symbolStates[word] === 'object') {
                    stateDef = symbolStates[word];
                }
            })
            if (stateDef) {
                const parameters = resolveStateParams(stateDef);

                const sigInfo: SignatureInformation = {
                    label: `${word}(${parameters})`,
                    parameters: [{label: parameters}] as ParameterInformation[]
                }

                return {
                    activeParameter: 0,
                    activeSignature: 0,
                    signatures: [sigInfo]
                } as SignatureHelp
            }
        }
        return null;
    }

    getSignatureForStateWithParamDefinition(meta: StylableMeta, pos: ProviderPosition, line: string): SignatureHelp | null {
        const value = line.slice(0, pos.character).trim().slice(line.slice(0, pos.character).trim().indexOf(':') + 1);
        const valueStartChar = line.indexOf(':') + 1;
        const parsed = pvp(value);
        let needsTypeHinting: boolean = false;

        if (parsed.nodes.some((node: ParsedValue) => node.type === 'function')) {
            let length = valueStartChar;

            parsed.nodes.forEach((statePart: ParsedValue) => {
                length += statePart.value.length;

                if (statePart.type === 'function') {
                    length++;
                }

                const stateNodes = statePart.nodes;
                if (stateNodes && stateNodes.length === 0 && pos.character === length) {
                    needsTypeHinting = true;
                } else {
                    stateNodes && stateNodes.forEach((node: ParsedValue) => {
                        if (pos.character > length && (pos.character <= length + 1 + node.value.length)) {
                            if (node.type === 'function' || node.type === 'word') {
                                needsTypeHinting = true;
                            }
                        }
                    });
                }

            });
        } else {
            return null;
        }

        if (needsTypeHinting) {
            const stateTypes = Object.keys(systemValidators).join(' | ');

            const sigInfo: SignatureInformation = {
                label: `Supported state types: "${stateTypes}"`,
                parameters: [{label: stateTypes}] as ParameterInformation[]
            }

            return {
                activeParameter: 0,
                activeSignature: 0,
                signatures: [sigInfo]
            } as SignatureHelp

        }

        return null;
    }

    getRefs(params: ReferenceParams, fs: ExtendedFSReadSync) {

        const doc = fs.get(params.textDocument.uri).getText();
        const pos = { line: params.position.line + 1, character: params.position.character + 1 };
        const { meta } = createMeta(doc, params.textDocument.uri);
        const node = last(pathFromPosition(meta!.rawAst, pos))!;
        let inner: NodeBase | undefined;
        let word: string = '';
        let refs: Location[] = [];

        if (isRoot(node)) {
            inner = (node.nodes || []).find(n => {
                return (n.source.start!.line < pos.line || (n.source.start!.line === pos.line && n.source.start!.column <= pos.character))
                    &&
                    (n.source.end!.line > pos.line || (n.source.end!.line === pos.line && n.source.end!.column >= pos.character))
            })
            if (inner && isSelector(inner)) {
                const relPos = { line: pos.line - inner.source.start!.line + 1, character: pos.character - inner.source.start!.column + 1 }
                const proc = psp();
                const parsed: ContainerBase = proc.astSync(inner.selector);
                const wordNode = ((parsed).nodes![0] as ContainerBase).nodes!
                    .find(n => {
                        return (n.source.start!.line < relPos.line || (n.source.start!.line === relPos.line && n.source.start!.column <= pos.character))
                            &&
                            (n.source.end!.line > relPos.line || (n.source.end!.line === relPos.line && n.source.end!.column >= pos.character))
                    });
                if (wordNode) {
                    word = (wordNode as Declaration).value;
                }
            }
        } else if (isContainer(node)) {
            inner = (node.nodes || []).find(n => {
                return isDeclaration(n) &&
                    (n.prop === valueMapping.mixin || n.prop === valueMapping.extends) && (n.source.start!.line < pos.line || (n.source.start!.line === pos.line && n.source.start!.column <= pos.character))
                    && (n.source.end!.line > pos.line || (n.source.end!.line === pos.line && n.source.end!.column >= pos.character))
            })
            if (inner) {
                const parsed = pvp((inner as Declaration).value);
                const relPos = inner.source.start!.line === pos.line
                    ? pos.character - (inner.source.start!.column + (inner as Declaration).prop.length + (inner.raws.between ? inner.raws.between.length : 0))
                    : pos.character - 1 + (inner as Declaration).value.split('\n').slice(0, pos.line - inner.source.start!.line).reduce((acc, cur) => { acc += (cur.length +1); return acc; }, 0)
                let val = findNode(parsed.nodes, relPos);
                if (val.type !== 'word') { val = findNode(parsed.nodes, relPos - 1); }

                if (val) {
                    word = val.value
                }
            }
        }

        refs = this.findClassRefs(word, params.textDocument.uri, fs);
        return refs;
    }

    findClassRefs(word: string, uri: string, fs: ExtendedFSReadSync): Location[] {
        if (!word) {return []};
        const refs: Location[] = [];
        const src = fs.get(uri).getText();
        const { processed: { meta } } = fixAndProcess(src, new ProviderPosition(0, 0), fromVscodePath(uri))
        const filterRegex = RegExp('(\\.?' + word + ')(\\s|$|\\:)', 'g');
        const valueRegex = RegExp('(\\.?' + word + ')(\\s|$|\\:|,)', 'g');
        meta!.rawAst.walkRules(filterRegex, (rule) => {
            let match;
            while ((match = valueRegex.exec(rule.selector)) !== null) {
                refs.push({
                    uri,
                    range: {
                        start: {
                            line: rule.source.start!.line - 1,
                            character: rule.source.start!.column + match.index
                        },
                        end: {
                            line: rule.source.start!.line - 1,
                            character: rule.source.start!.column + match.index + word.length
                        }
                    }
                })
            }
        });
        meta!.rawAst.walkDecls(valueMapping.extends, (decl) => {
            if (decl.value === word) {
                refs.push({
                    uri,
                    range: {
                        start: {
                            line: decl.source.start!.line - 1,
                            character: decl.source.start!.column + valueMapping.extends.length + (decl.raws.between ? decl.raws.between.length : 0) - 1
                        },
                        end: {
                            line: decl.source.start!.line - 1,
                            character: decl.source.start!.column + valueMapping.extends.length + (decl.raws.between ? decl.raws.between.length : 0) + word.length - 1
                        }
                    }
                })
            }
        });
        meta!.rawAst.walkDecls(valueMapping.mixin, (decl) => {
            const lines = decl.value.split('\n');
            lines.forEach((line, index) => {
                let match;
                while ((match = valueRegex.exec(line)) !== null) {
                    refs.push({
                        uri,
                        range: {
                            start: {
                                line: decl.source.start!.line - 1 + index,
                                character: index
                                    ? match.index
                                    : decl.source.start!.column + valueMapping.mixin.length + match.index + (decl.raws.between ? decl.raws.between.length : 0) - 1
                            },
                            end: {
                                line: decl.source.start!.line - 1 + index,
                                character: word.length + (index
                                    ? match.index
                                    : decl.source.start!.column + valueMapping.mixin.length + match.index + (decl.raws.between ? decl.raws.between.length : 0) - 1)
                            }
                        }
                    })
                }
            })

        })
        return refs;
    }

}

function resolveStateParams(stateDef: StateParsedValue) {
    const typeArguments: string[] = [];
    if (stateDef.arguments.length > 0) {
        stateDef.arguments.forEach((arg) => {
            if (typeof arg === 'object') {
                if (arg.args.length > 0) {
                    typeArguments.push(`${arg.name}(${arg.args.join(', ')})`);
                }
            }
            else if (typeof arg === 'string') {
                typeArguments.push(arg);
            }
        });
    }
    const parameters = typeArguments.length > 0 ? `${stateDef.type}(${typeArguments.join(', ')})` : stateDef.type;
    return parameters;
}

function isIllegalLine(line: string): boolean {
    return /^\s*[-\.:]+\s*$/.test(line)
}

const lineEndsRegexp = /({|}|;)/;

export function createMeta(src: string, path: string) {
    let meta: StylableMeta;
    let fakes: PostCss.Rule[] = [];
    try {
        let ast: PostCss.Root = safeParse(src, { from: fromVscodePath(path) })
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

export function fixAndProcess(src: string, position: ProviderPosition, filePath: string, ) {
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

export function extractTsSignature(filePath: string, mixin: string, isDefault: boolean, tsLangService: ExtendedTsLanguageService): ts.Signature | undefined {

    tsLangService.setOpenedFiles([filePath])
    const program = tsLangService.ts.getProgram();
    const tc = program.getTypeChecker();
    const sf = program.getSourceFile(filePath);
    if (!sf) {
        return undefined;
    }
    const mix = tc.getSymbolsInScope(sf, ts.SymbolFlags.Function).find(f => {
        if (isDefault) {
            return (f as any).exportSymbol && (f as any).exportSymbol.escapedName === 'default'
        } else {
            return (f as any).exportSymbol && (f as any).exportSymbol.escapedName === mixin
        }
    });
    if (!mix) { return undefined }
    return tc.getSignatureFromDeclaration(mix!.declarations![0] as SignatureDeclaration);
}

export function extractJsModifierReturnType(mixin: string, activeParam: number, fileSrc: string): string {

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
export function isDirective(line: string) { return keys(valueMapping).some(k => line.trim().startsWith((valueMapping as any)[k])) };
function isNamedDirective(line: string) { return line.indexOf(valueMapping.named) !== -1 };
export function isInValue(lineText: string, position: ProviderPosition) {
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

export function getNamedValues(src: string, lineIndex: number): { isNamedValueLine: boolean, namedValues: string[] } {
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

export function getExistingNames(lineText: string, position: ProviderPosition) {
    const valueStart = lineText.indexOf(':') + 1;
    const value = lineText.slice(valueStart, position.character);
    const parsed = pvp(value.trim());
    const names: string[] = parsed.nodes.filter((n: any) => n.type === 'function' || n.type === 'word').map((n: any) => n.value);
    const rev = parsed.nodes.reverse();
    const lastName: string = (parsed.nodes.length && rev[0].type === 'word') ? rev[0].value : '';
    return { names, lastName };
}


function findNode(nodes: any[], index: number): any {
    return nodes
        .filter(n => n.sourceIndex <= index)
        .reduce((m, n) => { return (m.sourceIndex > n.sourceIndex) ? m : n }, { sourceIndex: -1 })
}



