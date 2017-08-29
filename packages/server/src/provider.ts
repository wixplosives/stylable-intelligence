//must remain independent from vscode

import * as PostCss from 'postcss';
import { StylableMeta, process, safeParse, SRule, StylableResolver} from 'stylable';
import { getPositionInSrc, isSelector, pathFromPosition } from './utils/postcss-ast-utils';
import {MinimalDocs} from './minimal-docs'
import {ProviderPosition,
        Completion,
        RootClassProvider,
        ImportDirectiveProvider,
        VarsDirectiveProvider,
        ExtendsDirectiveProvider,
        StatesDirectiveProvider,
        MixinDirectiveProvider,
        VariantDirectiveProvider,
        FromDirectiveProvider,
        NamedDirectiveProvider,
        DefaultDirectiveProvider,
        ClassCompletionProvider,
        ExtendCompletionProvider,
        StateCompletionProvider
    } from './providers'

import {
    parseSelector,
    SelectorChunk
} from './utils/selector-analyzer';

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
        new StateCompletionProvider()
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
        return this.provideCompletionItemsFromAst(src, position, meta, currentLine, cursorLineIndex);

    }
    public provideCompletionItemsFromAst(
        src: string,
        position: ProviderPosition,
        meta: StylableMeta,
        currentLine: string,
        cursorLineIndex: number
    ): Thenable<Completion[]> {
        const completions: Completion[] = [];
        let options = this.createProviderOptions(src, position, meta, currentLine, cursorLineIndex)

        this.providers.forEach(p => {
            options.isLineStart = p.text.some((s:string)=> s.indexOf(currentLine.trim()) === 0)
            completions.push(...p.provide(options))
        }
        );
        this.docs;
        return Promise.resolve(completions);
    }
    private createProviderOptions(
        src: string,
        position: ProviderPosition,
        meta: StylableMeta,
        currentLine: string,
        cursorLineIndex: number) {

        const position1Based: ProviderPosition = {
            line: position.line + 1,
            character: position.character
        }

        const path = pathFromPosition(meta.rawAst, position1Based);

        const lastChar = src.charAt(getPositionInSrc(src, position));
        const lastPart: PostCss.NodeBase = path[path.length - 1];
        const prevPart: PostCss.NodeBase = path[path.length - 2];

        const lastRule: SRule | null = prevPart && isSelector(prevPart) ? <SRule>prevPart : lastPart && isSelector(lastPart) ? <SRule>lastPart : null

        let ps = parseSelector( currentLine.trim(), cursorLineIndex);
        let currentSelector = (ps.selector[ps.selector.length - 1] as SelectorChunk).classes[0]  //Gives last. Replace with one at cursor position.
        let tr = currentSelector ? this.resolver.resolveExtends(meta, currentSelector) : [];

        return {
            meta: meta,
            lastRule: lastRule,
            lastChar: lastChar,
            position: position,
            isTopLevel: !lastRule,
            isLineStart:  false,
            isImport: !!lastRule && lastRule.selector === ':import',
            insideSimpleSelector: !!lastRule && !!/^\s*\.?\w*$/.test(lastRule.selector),
            currentSelector: tr
        }
    }

}
