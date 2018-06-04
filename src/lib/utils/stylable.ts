import * as path from "path";
import {ImportSymbol, StylableMeta, Imported, StylableSymbol} from "stylable";
import * as postcss from 'postcss';

const rootPath = path.resolve('/');

export function fromStylablePath(stlPath: string) {
    return stlPath.replace(rootPath, '/').replace(/\\/g, '/');
}

function isImportSymbol(s: StylableSymbol): s is ImportSymbol {
    return s && s._kind == 'import';
}

function normalizeImported(_import: Imported): Imported {
    _import.from = fromStylablePath(_import.from);
    _import.fromRelative = fromStylablePath(_import.fromRelative);
    return _import;
}

function normalizeAst(ast: postcss.Root): postcss.Root {
    if(ast.source.input.file === ast.source.input.from){
        Object.defineProperty(ast.source.input, 'from' ,{
            value : fromStylablePath(ast.source.input.from)
        });
    }
    ast.source.input.file = fromStylablePath(ast.source.input.file);
    if (ast.source.input.map) {
        ast.source.input.map.file = fromStylablePath(ast.source.input.map.file);
    }
    return ast;
}

export function normalizeMeta(meta: StylableMeta): StylableMeta {
    meta.source = fromStylablePath(meta.source);
    meta.ast = normalizeAst(meta.ast);
    meta.imports.forEach(normalizeImported);

    for (let name of Object.keys(meta.mappedSymbols)) {
        const _symbol = meta.mappedSymbols[name];
        if (isImportSymbol(_symbol)) {
            normalizeImported(_symbol.import);
        }
    }
    return meta;
}
