import {ColorInformation, TextDocument} from 'vscode-languageserver-protocol';
import * as VCL from 'vscode-css-languageservice';
import {Color, ColorPresentation} from 'vscode-css-languageservice';
import {CompletionItem, Diagnostic, Hover, Location, Position, Range} from 'vscode-languageserver-types';
import {createMeta} from "./provider-processing";

function readDocRange(doc: TextDocument, rng: Range): string {
    let lines = doc.getText().split('\n');
    return lines[rng.start.line].slice(rng.start.character, rng.end.character);
}

function getDiagnosticsFilter(document: TextDocument){
    return (diag: Diagnostic) => {
        switch (diag.code) {
            case 'emptyRules' :
                return false;
            case 'css-unknownatrule' :
                return readDocRange(document, diag.range) !== '@custom-selector';
            case 'css-lcurlyexpected' :
                return !readDocRange(document, Range.create(Position.create(diag.range.start.line, 0), diag.range.end)).startsWith('@custom-selector');
            case 'unknownProperties' :
                let meta = createMeta(document.getText(), document.uri).meta;
                if (meta) {
                    let prop = diag.message.match(/'(.*)'/)![1];
                    return Object.keys(meta.mappedSymbols).every(ms => ms !== prop);
                }
        }
        return true;
    }
}

/**
 * the API for "normal" css language features fallback
 */
export class CssService {
    private inner = VCL.getCSSLanguageService();

    getCompletions(document: TextDocument, position: Position): CompletionItem[] {
        const cssCompsRaw = this.inner.doComplete(
            document,
            position,
            this.inner.parseStylesheet(document)
        );
        return cssCompsRaw ? cssCompsRaw.items : [];
    }

    getDiagnostics(document: TextDocument): Diagnostic[] {
        const stylesheet = this.inner.parseStylesheet(document);
        return this.inner.doValidation(document, stylesheet).filter(getDiagnosticsFilter(document));
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
        const stylesheet = this.inner.parseStylesheet(document);
        return this.inner.getColorPresentations(document, stylesheet, color, range)
    }

    findColors(document: TextDocument): ColorInformation[] {
        const stylesheet = this.inner.parseStylesheet(document);
        return this.inner.findDocumentColors(document, stylesheet);
    }

    findColor(document: TextDocument): Color | null {
        const colors = this.findColors(document);
        return colors.length ? colors[0].color : null;
    }
}
