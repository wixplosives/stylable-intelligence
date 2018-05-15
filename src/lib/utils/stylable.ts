import * as path from "path";
import {StylableMeta} from "stylable";

const rootPath = path.resolve('/');

function fromStylablePath(stlPath: string) {
    return stlPath.replace(rootPath, '/').replace(/\\/g, '/');
}

export function normalizeMeta(meta: StylableMeta): StylableMeta {
    meta.source = fromStylablePath(meta.source);
    meta.imports.forEach((_import) => {
        _import.from = fromStylablePath(_import.from);
    });
    return meta;
}
