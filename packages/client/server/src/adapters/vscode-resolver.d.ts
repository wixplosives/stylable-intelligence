import { TextDocument } from 'vscode-languageserver';
import { ExtendedResolver, FsEntity } from '../provider';
import { Resolver, Stylesheet } from 'stylable';
export declare class VsCodeResolver extends Resolver implements ExtendedResolver {
    private docs;
    constructor(docs: {
        get: (uri: string) => TextDocument;
        keys: () => string[];
    });
    st: Stylesheet;
    resolveModule(filePath: string): any;
    resolveDependencies(stylesheet: Stylesheet): Thenable<void>;
    resolveSymbols(s: Stylesheet): any;
    getFolderContents(path: string): Promise<FsEntity[]>;
}
