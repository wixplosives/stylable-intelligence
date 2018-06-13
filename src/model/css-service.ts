import {ColorInformation, TextDocument} from 'vscode-languageserver-protocol';
import * as VCL from 'vscode-css-languageservice';
import {Color, ColorPresentation} from 'vscode-css-languageservice';
import {CompletionItem, Diagnostic, Hover, Location, Position, Range} from 'vscode-languageserver-types';
import {createMeta} from '../lib/provider';
import {ExtendedFSReadSync} from '../lib/types'

function readDocRange(doc: TextDocument, rng: Range): string {
    let lines = doc.getText().split('\n');
    return lines[rng.start.line].slice(rng.start.character, rng.end.character);
}

function findPseudoStateStart(line: string, lookFrom: number) {
    let i = lookFrom - 1;
    let res = -1;
    let openParens = 0;
    while (i !== -1) {
        if (line[i] === ':' && line[i - 1] !== ':') {
            res = i;
        }
        if (line[i] === '(') {
            openParens++;
        }
        if (line[i] === ')') {
            openParens--;
        }

        i--;
    }

    return {
        index: res,
        openParens
    };
}

/**
 * the API for "normal" css language features fallback
 */
export class CssService {
    private inner = VCL.getCSSLanguageService();

    constructor(private fs: ExtendedFSReadSync) {
    }

    getCompletions(document: TextDocument, position: Position): CompletionItem[] {
        const cssCompsRaw = this.inner.doComplete(
            document,
            position,
            this.inner.parseStylesheet(document)
        );
        return cssCompsRaw ? cssCompsRaw.items : [];
    }

    getDiagnostics(document: TextDocument): Diagnostic[] {
        if (!document.uri.endsWith('.css')) {
            return [];
        }
        const stylesheet = this.inner.parseStylesheet(document);

        return this.inner.doValidation(document, stylesheet)
            .filter(diag => {
                if (diag.code === 'emptyRules') {
                    return false;
                }
                if (diag.code === 'css-unknownatrule' && readDocRange(document, diag.range) === '@custom-selector') {
                    return false;
                }
                if (diag.code === 'css-lcurlyexpected' && readDocRange(document, Range.create(Position.create(diag.range.start.line, 0), diag.range.end)).startsWith('@custom-selector')) {
                    return false;
                }
                if (diag.code === 'css-rparentexpected' || diag.code === 'css-identifierexpected') {
                    const endOfLine = diag.range.end;
                    endOfLine.character = -1;

                    const line = readDocRange(document, Range.create(Position.create(diag.range.start.line, 0), endOfLine));
                    const stateStart = findPseudoStateStart(line, diag.range.start.character);

                    if (stateStart.index !== -1 && stateStart.openParens > 0) {
                        return false;
                    }
                }
                if (diag.code === 'unknownProperties') {
                    let prop = diag.message.match(/'(.*)'/)![1]
                    let src = this.fs.loadTextFileSync(document.uri);
                    let meta = createMeta(src, document.uri).meta;
                    if (meta && Object.keys(meta.mappedSymbols).some(ms => ms === prop)) {
                        return false;
                    }
                }
                return true;
            })
            .map(diag => {
                diag.source = 'css';
                return diag;
            })
    }

    doHover(document: TextDocument, position: Position): Hover | null {
        const stylesheet = this.inner.parseStylesheet(document);
        return this.inner.doHover(document, position, stylesheet);
    }

    findReferences(document: TextDocument, position: Position): Location[] {
        const stylesheet = this.inner.parseStylesheet(document);
        return this.inner.findReferences(document, position, stylesheet);
    }

    getColorPresentations(document: TextDocument, color: Color, range: Range): ColorPresentation[] {
        const stylesheet: VCL.Stylesheet = this.inner.parseStylesheet(document);
        return this.inner.getColorPresentations(document, stylesheet, color, range)
    }

    findColors(document: TextDocument): ColorInformation[] {
        const stylesheet: VCL.Stylesheet = this.inner.parseStylesheet(document);
        return this.inner.findDocumentColors(document, stylesheet);
    }

    findColor(document: TextDocument): Color | null {
        const colors = this.findColors(document);
        return colors.length ? colors[0].color : null;
    }
}
