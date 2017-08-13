import { TextDocuments, IConnection } from 'vscode-languageserver';
import { ExtendedResolver, FsEntity } from '../provider';
import { Resolver, Stylesheet } from 'stylable';
export declare class VsCodeResolver extends Resolver implements ExtendedResolver {
    private connection;
    private docs;
    constructor(connection: IConnection, docs: TextDocuments);
    st: Stylesheet;
    resolveModule(filePath: string): any;
    resolveDependencies(stylesheet: Stylesheet): Thenable<void>;
    resolveSymbols(s: Stylesheet): {
        [key: string]: any;
    } & object;
    getFolderContents(path: string): Promise<FsEntity[]>;
}
