import { valueMapping } from 'stylable/dist/src';
//must remain independent from vscode

import * as PostCss from 'postcss';
import { StylableMeta, process as  stylableProcess, safeParse, SRule, Stylable } from 'stylable';
import { isSelector, pathFromPosition } from './utils/postcss-ast-utils';
import {
    ImportInternalDirectivesProvider,
    RulesetInternalDirectivesProvider,
    TopLevelDirectiveProvider,
    SelectorCompletionProvider,
    ExtendCompletionProvider,
    PseudoElementCompletionProvider,
    StateCompletionProvider,
    ProviderPosition,
    ProviderOptions,
    NamedCompletionProvider,
} from './completion-providers'
import { Completion, } from './completion-types';
import { parseSelector, } from './utils/selector-analyzer';
import { Declaration } from 'postcss';


export function isIllegalLine(line: string): boolean {
    return /^\s*[-\.:]+\s*$/.test(line)
}

const lineEndsRegexp = /({|}|;)/;

export default class Provider {
    constructor(private styl: Stylable) { }

    providers = [
        new RulesetInternalDirectivesProvider(),
        new ImportInternalDirectivesProvider(),
        new TopLevelDirectiveProvider(),
        new SelectorCompletionProvider(),
        new ExtendCompletionProvider(),
        new NamedCompletionProvider(),
        new StateCompletionProvider(),
        new PseudoElementCompletionProvider(),
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
                        // if (true) {
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
            // else if (true) {
            lines.splice(position.line, 1, "");
            fixedSrc = lines.join('\n');
        }


        let meta: StylableMeta;
        let fakes: PostCss.Rule[] = [];
        try {
            let ast: PostCss.Root = safeParse(fixedSrc, { from: this.createFrom(filePath) })
            // let ast: PostCss.Root = safeParse(fixedSrc, { from: filePath.indexOf('file://') === 0 ? filePath.slice(7) : filePath })
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
            return Promise.resolve([]);
        }
        return this.provideCompletionItemsFromAst(src, position, meta, fakes, currentLine, cursorLineIndex);

    }

    private createFrom(filePath: string): string | undefined {
        return filePath.indexOf('file://') === 0 ? filePath.slice(7 + Number(process.platform==='win32')) : filePath;
    }

    public provideCompletionItemsFromAst(
        src: string,
        position: ProviderPosition,
        meta: StylableMeta,
        fakes: PostCss.Rule[],
        currentLine: string,
        cursorLineIndex: number
    ): Thenable<Completion[]> {
        const completions: Completion[] = [];
        let options = this.createProviderOptions(src, position, meta, fakes, currentLine, cursorLineIndex)

        this.providers.forEach(p => {
            options.isLineStart = p.text.some((s: string) => s.indexOf(currentLine.trim()) === 0)
            completions.push(...p.provide(options))
        }
        );
        return Promise.resolve(completions);
    }

    private createProviderOptions(
        src: string,
        position: ProviderPosition,
        meta: StylableMeta,
        fakes: PostCss.Rule[],
        currentLine: string,
        cursorLineIndex: number): ProviderOptions {

        const path = pathFromPosition(meta.rawAst, { line: position.line + 1, character: position.character });
        const lastPart: PostCss.NodeBase = path[path.length - 1];
        const prevPart: PostCss.NodeBase = path[path.length - 2];
        const isMediaQuery = path.some(n => (n as PostCss.Container).type === 'atrule' && (n as PostCss.AtRule).name === 'media');
        const isDirective = Object.keys(valueMapping).some(k => currentLine.indexOf((valueMapping as any)[k]) !== -1)


        const lastRule: SRule | null = prevPart && isSelector(prevPart) && prevPart.selector.indexOf('\n') === -1 && fakes.findIndex((f) => { return f.selector === prevPart.selector }) === -1
            ? <SRule>prevPart
            : lastPart && isSelector(lastPart) && lastPart.selector.indexOf('\n') === -1 && fakes.findIndex((f) => { return f.selector === lastPart.selector }) === -1
                ? <SRule>lastPart
                : null

        while (currentLine.lastIndexOf(' ') > cursorLineIndex) {
            currentLine = currentLine.slice(0, currentLine.lastIndexOf(' '))
        }
        if (currentLine.lastIndexOf(' ') === cursorLineIndex) { currentLine = currentLine.slice(0, currentLine.lastIndexOf(' ')) }

        if (!isDirective && currentLine.lastIndexOf(' ') > 0 && currentLine.lastIndexOf(' ') < cursorLineIndex) {
            cursorLineIndex -= (currentLine.lastIndexOf(' ') + 1);
            currentLine = currentLine.slice(currentLine.lastIndexOf(' '));
        }

        let trimmedLine = currentLine.trim();
        let postDirectiveSpaces = (Object.keys(valueMapping).some(k => { return trimmedLine.startsWith((valueMapping as any)[k]) })) ? currentLine.match((/:(\s*)\w?/))![1].length : 0
        let postValueSpaces = (Object.keys(valueMapping).some(k => { return trimmedLine.startsWith((valueMapping as any)[k]) && trimmedLine.indexOf(',') !== -1 }))
            ? (currentLine.replace(/^\s*/, '').match(/\s+/) || [''])[0].length
            : 0
        let ps = parseSelector(trimmedLine, cursorLineIndex);

        let chunkStrings: string[] = ps.selector.map(s => s.text).reduce((acc, arr) => { return acc.concat(arr) }, []);
        let remain = cursorLineIndex;
        let pos = chunkStrings.findIndex(str => {
            if (str.length >= remain) {
                return true;
            } else {
                remain -= str.length;
                return false;
            }
        })

        let rev = chunkStrings.slice().reverse();
        pos -= Math.max(rev.findIndex(s => !/^:+/.test(s)), 0)
        let currentSelector = /$:+/.test(chunkStrings[pos]) ? chunkStrings[pos - 1] : chunkStrings[pos]
        if (currentSelector && currentSelector.startsWith('.')) { currentSelector = currentSelector.slice(1) }
        let resolved = currentSelector ? this.styl.resolver.resolveExtends(meta, currentSelector, currentSelector[0] === currentSelector[0].toUpperCase()) : [];
        let pseudo = (trimmedLine.match(/::/))
            ? (trimmedLine.endsWith('::')
                ? trimmedLine.split('::').reverse()[1]
                : this.styl.resolver.resolveExtends(resolved[resolved.length - 1].meta, trimmedLine.split('::').reverse()[0].replace(':', '')).length > 0
                    ? trimmedLine.split('::').reverse()[0].replace(':', '')
                    : trimmedLine.split('::').reverse()[1].replace(':', '')
            )
            : null;

        let resolvedPseudo = pseudo ? this.styl.resolver.resolveExtends(resolved[resolved.length - 1].meta, pseudo) : [];
        let isImport = !!lastRule && (lastRule.selector === ':import');
        let fromNode: Declaration | undefined = isImport ? (lastRule!.nodes as Declaration[]).find(n => n.prop === valueMapping.from) : undefined;
        let importName = (isImport && fromNode) ? fromNode.value.replace(/'/g, '').replace(/"/g, '') : '';
        let resolvedImport: StylableMeta | null = importName ? this.styl.fileProcessor.process(meta.imports.find(i => i.fromRelative === importName)!.from) : null;

        return {
            meta: meta,
            lastRule: lastRule,
            trimmedLine: trimmedLine,
            postDirectiveSpaces: postDirectiveSpaces,
            postValueSpaces: postValueSpaces,
            position: position,
            isTopLevel: !lastRule,
            isLineStart: false,
            isImport: isImport,
            resolvedImport: resolvedImport,
            insideSimpleSelector: !!lastRule && !!/^\s*\.?\w*$/.test(lastRule.selector),
            resolved: resolved,
            currentSelector: currentSelector,
            target: ps.target,
            isMediaQuery: isMediaQuery,
            fakes: fakes,
            pseudo: pseudo,
            resolvedPseudo: resolvedPseudo,
        }
    }


}
