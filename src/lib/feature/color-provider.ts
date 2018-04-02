import { ColorInformation, DocumentColorParams, ColorPresentationParams } from 'vscode-languageserver-protocol';
import { TextDocument } from 'vscode-languageserver/lib/main';
import { ProviderPosition, ProviderRange } from '../completion-providers';
import { Color } from 'vscode';
import { evalDeclarationValue, valueMapping, Stylable, StylableMeta, FileProcessor } from 'stylable';
import { CssService } from '../../model/css-service';
import { fixAndProcess } from '../provider';
import { ExtendedFSReadSync } from '../..';
import { last } from 'lodash';

export function getDocumentColors(
    stylable: Stylable,
    cssService: CssService,
    document: TextDocument,
    params: DocumentColorParams) {

    const processor = stylable.fileProcessor;
    const src = document.getText();
    const res = fixAndProcess(src, new ProviderPosition(0, 0), params.textDocument.uri);
    const meta = res.processed.meta;

    let colorComps: ColorInformation[] = [];

    if (meta) {

        const lines = src.split('\n');
        lines.forEach((line, ind) => {
            let valueRegex = /value\(([\w-]+)\)/g;
            let regexResult;
            while ((regexResult = valueRegex.exec(line)) !== null) {
                const result = regexResult[1];
                const sym = meta.mappedSymbols[result];
                let color: Color | null = null;
                if (sym && sym._kind === 'var') {
                    const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(stylable.resolver, sym.text, meta, sym.node) + '}');
                    color = cssService.findColor(doc);
                } else if (sym && sym._kind === 'import' && sym.type === 'named') {
                    const impMeta = processor.process(sym.import.from);
                    const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(stylable.resolver, 'value(' + sym.name + ')', impMeta, impMeta.vars.find(v => v.name === sym.name)!.node) + '}');
                    color = cssService.findColor(doc);
                }
                if (color) {
                    const range = new ProviderRange(
                        new ProviderPosition(ind, regexResult.index + regexResult[0].indexOf(regexResult[1]) - 'value('.length),
                        new ProviderPosition(ind, regexResult.index + regexResult[0].indexOf(regexResult[1]) + result.length)
                    );
                    colorComps.push({color, range} as ColorInformation)
                }
            }
        });

        meta.imports.forEach(imp => {
            const impMeta = processor.process(imp.from);
            const vars = impMeta.vars;
            vars.forEach(v => {
                const doc = TextDocument.create('', 'css', 0, '.gaga {border: ' + evalDeclarationValue(stylable.resolver, v.text, impMeta, v.node) + '}');
                const color = cssService.findColor(doc);
                if (color) {
                    meta.rawAst.walkDecls(valueMapping.named, (decl) => {
                        const lines = decl.value.split('\n');
                        const lineIndex = lines.findIndex(l => l.includes(v.name)); //replace with regex
                        if (lineIndex > -1 && lines[lineIndex].indexOf(v.name) > -1) {

                            let extraLines = 0;
                            let extraChars = 0;
                            if (decl.raws.between) {
                                extraLines = decl.raws.between.split('\n').length - 1;
                                extraChars = last(decl.raws.between.split('\n'))!.length
                            }
                            const varStart = lineIndex //replace with value parser
                                ? lines[lineIndex].indexOf(v.name) //replace with regex
                                : extraLines
                                    ? lines[lineIndex].indexOf(v.name) + extraChars
                                    : lines[lineIndex].indexOf(v.name) + valueMapping.named.length + decl.source.start!.column + extraChars - 1
                            const range = new ProviderRange(
                                new ProviderPosition(decl.source.start!.line - 1 + lineIndex + extraLines, varStart),
                                new ProviderPosition(decl.source.start!.line - 1 + lineIndex + extraLines, v.name.length + varStart)
                            );
                            colorComps.push({color, range} as ColorInformation)
                        }
                    });
                }
            });
        });

        return colorComps.concat(cssService.findColors(document));
    }

    return null;
}

export function getColorPresentation(
    cssService: CssService,
    document: TextDocument,
    params: ColorPresentationParams) {

    const src = document.getText();
    const res = fixAndProcess(src, new ProviderPosition(0, 0), params.textDocument.uri);
    const meta = res.processed.meta!;

    const word = src.split('\n')[params.range.start.line].slice(params.range.start.character, params.range.end.character);
    if (word.startsWith('value(')) {
        return []
    }

    const wordStart = new ProviderPosition(params.range.start.line + 1, params.range.start.character + 1);
    let noPicker = false;
    meta.rawAst.walkDecls(valueMapping.named, (node) => {
        if (
            ((wordStart.line === node.source.start!.line && wordStart.character >= node.source.start!.column) || wordStart.line > node.source.start!.line)
            &&
            ((wordStart.line === node.source.end!.line && wordStart.character <= node.source.end!.column) || wordStart.line < node.source.end!.line)
        ) {
            noPicker = true;
        }
    });
    if (noPicker) {
        return []
    }
    return cssService.getColorPresentations(document, params.color, params.range);
}
