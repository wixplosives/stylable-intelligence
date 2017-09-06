import { valueMapping } from 'stylable/dist/src';
//must remain independent from vscode

import * as PostCss from 'postcss';
import { StylableMeta, process, safeParse, SRule, StylableResolver } from 'stylable';
import { isSelector, pathFromPosition } from './utils/postcss-ast-utils';
import {
    DefaultDirectiveProvider,
    ExtendsDirectiveProvider,
    FromDirectiveProvider,
    ImportDirectiveProvider,
    MixinDirectiveProvider,
    NamedDirectiveProvider,
    NamespaceDirectiveProvider,
    RootClassProvider,
    StatesDirectiveProvider,
    ThemeDirectiveProvider,
    VariantDirectiveProvider,
    VarsDirectiveProvider,
    ClassCompletionProvider,
    ExtendCompletionProvider,
    PseudoElementCompletionProvider,
    StateCompletionProvider,
    TypeCompletionProvider,
    ProviderPosition,
    ProviderOptions,
} from './completion-providers'
import { Completion } from './completion-types'
import { parseSelector, } from './utils/selector-analyzer';

function isIllegalLine(line: string): boolean {
    return !!/^\s*[-\.:]+\s*$/.test(line)
}

const lineEndsRegexp = /({|}|;)/;

export default class Provider {
    constructor(private resolver: StylableResolver) { }

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
        new NamespaceDirectiveProvider(),
        new ThemeDirectiveProvider(),
        new ClassCompletionProvider(),
        new TypeCompletionProvider(),
        new ExtendCompletionProvider(),
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
        let fakes: PostCss.Rule[] = [];
        try {
            let ast: PostCss.Root = safeParse(fixedSrc, { from: filePath.indexOf('file://') === 0 ? filePath.slice(7) : filePath })
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

            meta = process(ast);
        } catch (error) {
            console.log(error);
            return Promise.resolve([]);
        }
        return this.provideCompletionItemsFromAst(src, position, meta, fakes, currentLine, cursorLineIndex);

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
        const isDirective = Object.keys(valueMapping).some(k => currentLine.indexOf(k) !== -1)


        const lastRule: SRule | null = prevPart && isSelector(prevPart) && fakes.findIndex((f) => { return f.selector === prevPart.selector })
            ? <SRule>prevPart
            : lastPart && isSelector(lastPart) && fakes.findIndex((f) => { return f.selector === lastPart.selector }) ? <SRule>lastPart : null
        while (currentLine.lastIndexOf(' ') > cursorLineIndex) {
            currentLine = currentLine.slice(0, currentLine.lastIndexOf(' '))
        }
        if (currentLine.lastIndexOf(' ') === cursorLineIndex) { currentLine = currentLine.slice(0, currentLine.lastIndexOf(' ')) }

        if (!isDirective && currentLine.lastIndexOf(' ') > 0 && currentLine.lastIndexOf(' ') < cursorLineIndex) {
            cursorLineIndex -= (currentLine.lastIndexOf(' ') + 1);
            currentLine = currentLine.slice(currentLine.lastIndexOf(' '));
        }

        let trimmedLine = currentLine.trim();

        //
        let ps = parseSelector(trimmedLine, cursorLineIndex);

        let chunkStrings: string[] = ps.selector.map(s => s.text).reduce((acc, arr) => { return acc.concat(arr) }, []);
        // let spacesBefore: number = currentLine.match(/^\s*/)![0].length || 0;
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
        let resolved = currentSelector ? this.resolver.resolveExtends(meta, currentSelector, currentSelector[0] === currentSelector[0].toUpperCase()) : [];

        return {
            meta: meta,
            lastRule: lastRule,
            trimmedLine: trimmedLine,
            position: position,
            isTopLevel: !lastRule,
            isLineStart: false,
            isImport: !!lastRule && lastRule.selector === ':import',
            insideSimpleSelector: !!lastRule && !!/^\s*\.?\w*$/.test(lastRule.selector),
            resolved: resolved,
            currentSelector: currentSelector,
            target: ps.target,
            isMediaQuery: isMediaQuery,
            fakes: fakes,
        }
    }

}
