'use strict';
import { TextDocument } from 'vscode-languageserver';
import { cachedProcessFile, process, safeParse, StylableMeta, StylableResolver, FileProcessor } from 'stylable';
import Provider from './provider';


export function createProvider (docs:MinimalDocs, withFilePrefix:boolean = true): Provider{
    let proccesor = createProcessor(docs, withFilePrefix)
    const stylableResolver = new StylableResolver(proccesor, () => ({default:{}}))
    return new Provider(stylableResolver)
}

export function createProcessor(docs:MinimalDocs, withFilePrefix:boolean = true): FileProcessor<StylableMeta> {
    const getFullPath = (path:string) => withFilePrefix ? 'file://' + path : path
    let proccesor = cachedProcessFile<StylableMeta>((fullpath, content) => {
            return process(safeParse(content, { from: fullpath }))
        }, {
                readFileSync(path: string) {
                    const doc = docs.get(getFullPath(path));
                    return doc.getText()
                },
                statSync(path: string) {
                    const doc = docs.get(getFullPath(path));
                    return {
                        mtime: new Date(doc.version)
                    }
                }
            })
    return proccesor

}

export interface MinimalDocs {
    get: (uri: string) => TextDocument;
    keys: () => string[]
}
