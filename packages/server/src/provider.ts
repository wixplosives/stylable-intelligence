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
        classCompletion,
        ExtendCompletionProvider,
        StateCompletionProvider,
        FilenameCompletionProvider
    } from './providers'

import {
    parseSelector,
    SelectorChunk
} from './utils/selector-analyzer';

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

// function extendCompletion(symbolName: string, range?: ProviderRange) {
//     return new Completion(symbolName, 'yours', 'a', new snippet(' ' + symbolName + ';\n'), range)
// }

// function fileNameCompletion(name: string) {
//     return new Completion(name, '', 'a', './' + name);
// }
// end completions



//TODO: add isVars to signature.





// In -st-extends
// Extra files


// In -st-from
// File list



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
