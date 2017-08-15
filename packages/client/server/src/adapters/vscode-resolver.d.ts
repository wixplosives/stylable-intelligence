import { TextDocument, IConnection } from 'vscode-languageserver';
import { ExtendedResolver, FsEntity } from '../provider';
import { Resolver, Stylesheet } from 'stylable';
export declare class VsCodeResolver extends Resolver implements ExtendedResolver {
    private docs;
    private conn;
    constructor(docs: {
        get: (uri: string) => TextDocument;
        keys: () => string[];
    }, conn?: IConnection | undefined);
    st: Stylesheet;
    resolveModule(filePath: string): any;
    resolveDependencies(stylesheet: Stylesheet): Thenable<void>;
    resolveSymbols(s: Stylesheet): {
        [key: string]: any;
    } & object;
    getFolderContents(path: string): Promise<FsEntity[]>;
}
