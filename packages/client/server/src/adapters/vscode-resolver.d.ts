import { TextDocument } from 'vscode-languageserver';
import { StylableMeta, StylableResolver, CSSResolve } from 'stylable';
export declare class VsCodeResolver extends StylableResolver {
    docs: {
        get: (uri: string) => TextDocument;
        keys: () => string[];
    };
    constructor(docs: {
        get: (uri: string) => TextDocument;
        keys: () => string[];
    });
    resolveExtends(meta: StylableMeta, className: string): CSSResolve[];
}
