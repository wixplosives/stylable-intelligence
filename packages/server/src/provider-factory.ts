'use strict';
import { cachedProcessFile, process, safeParse, StylableMeta, StylableResolver } from 'stylable';
import {MinimalDocs} from './minimal-docs'
import Provider from './provider';

export function createProvider (docs:MinimalDocs, withFilePrefix:boolean = true): Provider{
    const getFullPath = (path:string) => withFilePrefix ? 'file://' + path : path
    const stylableResolver = new StylableResolver(cachedProcessFile<StylableMeta>((fullpath, content) => {
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
        }), () => { return {default:{}}
            /* requireModule - handle js imports */ }
    )
    return new Provider(stylableResolver)
}


