'use strict';
import { TextDocument } from 'vscode-languageserver';
import { cachedProcessFile, process, safeParse, StylableMeta,
    // StylableResolver,
     FileProcessor, Stylable } from 'stylable';
import Provider from './provider';
import * as fs from 'fs';


export function createProvider(docs: MinimalDocs, withFilePrefix: boolean = true): Provider {
    // let proccesor = createProcessor(docs, withFilePrefix)
    // const stylableResolver = new StylableResolver(proccesor, () => ({ default: {} }))
    const styl = new Stylable('/',createFs(docs, withFilePrefix),  () => ({ default: {} }))
    // const stylabletransformer = new StylableTransformer({fileProcessor: processor, requireModule: () => ({ default: {} }), diagnostics: });
    // return new Provider(styl.resolver)
    return new Provider(styl)
}

function createFs(docs: MinimalDocs, withFilePrefix: boolean = true): any {
    const getFullPath = (path: string) => withFilePrefix ? 'file://' + path : path
    return {
        readFileSync(path: string) {
            if (docs.keys().indexOf(getFullPath(path)) !== -1) {
                return docs.get(getFullPath(path)).getText()
            } else {
                return fs.readFileSync(getFullPath(path).slice(7)).toString();
            }
        },
        statSync(path: string) {
            const doc = docs.get(getFullPath(path));
            if (docs.keys().indexOf(getFullPath(path)) !== -1) {
                return {
                    mtime: new Date(doc.version)
                }
            } else {
                return {
                    mtime: new Date(Date.now())
                }
            }
        }
    }
}
export function createProcessor(docs: MinimalDocs, withFilePrefix: boolean = true): FileProcessor<StylableMeta> {
    let proccesor = cachedProcessFile<StylableMeta>((fullpath, content) => {
        return process(safeParse(content, { from: fullpath }))
    }, createFs(docs, withFilePrefix))
    return proccesor;

}

export interface MinimalDocs {
    get: (uri: string) => TextDocument;
    keys: () => string[]
}
