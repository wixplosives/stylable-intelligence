'use strict';
import { TextDocument } from 'vscode-languageserver';
import { StylableMeta, cachedProcessFile, StylableResolver, safeParse, process, valueMapping, CSSResolve } from 'stylable';


export class VsCodeResolver extends StylableResolver {
    constructor(public docs: { get: (uri: string) => TextDocument, keys: () => string[] }) {

        super(cachedProcessFile<StylableMeta>((fullpath, content) => {
            return process(safeParse(content, { from: fullpath }))
        }, {
                readFileSync(path: string) {
                    const doc = docs.get(path);
                    return doc.getText()
                },
                statSync(path: string) {
                    const doc = docs.get(path);
                    return {
                        mtime: new Date(doc.version)
                    }
                }
            }), () => {/* requireModule - handle js imports */ });

    }

    resolveExtends(meta: StylableMeta, className: string): CSSResolve[] {

        let extendPath = [];
        const resolvedClass = this.resolveClass(meta, meta.classes[className])

        if (resolvedClass && resolvedClass._kind === 'css' && resolvedClass.symbol._kind === 'class') {
            let current = resolvedClass;
            let extend = resolvedClass.symbol[valueMapping.extends];

            while (current && extend) {
                extendPath.push(current);
                let res = this.resolve(extend);
                if (res && res._kind === 'css' && res.symbol._kind === 'class') {
                    current = res;
                    extend = resolvedClass.symbol[valueMapping.extends];
                } else {
                    break;
                }
            }

        }

        return extendPath
    }


}
