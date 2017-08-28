'use strict';
import { TextDocument } from 'vscode-languageserver';
import { StylableMeta, cachedProcessFile, StylableResolver, safeParse, process,  } from 'stylable';


export class VsCodeResolver extends StylableResolver {
    constructor(public docs: { get: (uri: string) => TextDocument, keys: () => string[] }) {

        super(cachedProcessFile<StylableMeta>((fullpath, content) => {
            return process(safeParse(content, { from: fullpath }))
        }, {
                readFileSync(path: string) {
                    const doc = docs.get('file://' + path);
                    return doc.getText()
                },
                statSync(path: string) {
                    const doc = docs.get('file://' + path);
                    return {
                        mtime: new Date(doc.version)
                    }
                }
            }), () => {/* requireModule - handle js imports */ });

    }
}
