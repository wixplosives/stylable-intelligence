//must remain independent from vscode
import {ProviderPosition} from "../lib/completion-providers";
import {safeParse, StylableMeta, process as stylableProcess} from "stylable";
import {Root, Rule, rule} from 'postcss';
import {fromVscodePath} from "../lib/utils/uri-utils";


const lineFormatDelimitterRegEx = /[{};]/;
const illegalLineRegex = /^\s*[-.:]+\s*$/;


export function fixAndProcess(src: string, position: ProviderPosition, filePath: string,) {
    let cursorLineIndex: number = position.character;
    let lines = src.replace(/\r\n/g, '\n').split('\n');
    let currentLine = lines[position.line];
    let fixedSrc = src;
    if (currentLine.match(lineFormatDelimitterRegEx)) {
        let currentLocation = 0;
        let splitLine = currentLine.split(lineFormatDelimitterRegEx);
        for (let i = 0; i < splitLine.length; i += 2) {
            currentLocation += splitLine[i].length + 1;
            if (currentLocation >= position.character) {
                currentLine = splitLine[i];
                if (illegalLineRegex.test(currentLine)) {
                    splitLine[i] = '\n';
                    lines.splice(position.line, 1, splitLine.join(''));
                    fixedSrc = lines.join('\n');
                }
                break;
            } else {
                cursorLineIndex -= splitLine[i].length + 1
            }
        }
    } else if (illegalLineRegex.test(currentLine)) {
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

export function createMeta(src: string, path: string) {
    let meta: StylableMeta;
    let fakes: Rule[] = [];
    try {
        let ast: Root = safeParse(src, {from: fromVscodePath(path)});
        ast.nodes && ast.nodes.forEach((node) => {
            if (node.type === 'decl') {
                let r = rule({selector: node.prop + ':' + node.value});
                r.source = node.source;
                node.replaceWith(r);
                fakes.push(r)
            }
        });
        if (ast.raws.after && ast.raws.after.trim()) {
            let r = rule({selector: ast.raws.after.trim()});
            ast.append(r);
            fakes.push(r);
        }

        meta = stylableProcess(ast);
    } catch (error) {
        return {meta: null, fakes: fakes};
    }
    return {
        meta: meta,
        fakes: fakes
    }
}
