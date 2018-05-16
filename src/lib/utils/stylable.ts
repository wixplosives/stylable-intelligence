import * as path from "path";
import {ImportSymbol, StylableMeta, Imported, StylableSymbol} from "stylable";

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

export function normalizeMeta(meta: StylableMeta): StylableMeta {
    meta.source = fromStylablePath(meta.source);
    meta.imports.forEach(normalizeImported);

    for (let name of Object.keys(meta.mappedSymbols)) {
        const _symbol = meta.mappedSymbols[name];
        if (isImportSymbol(_symbol)) {
            normalizeImported(_symbol.import);
        }
    }
    return meta;
}
