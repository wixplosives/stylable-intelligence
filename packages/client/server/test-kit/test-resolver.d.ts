import { Resolver, Stylesheet } from 'stylable';
import { ExtendedResolver, FsEntity } from '../src/provider';
export declare class TestResolver extends Resolver implements ExtendedResolver {
    resolveModule(filePath: string): any;
    resolveDependencies(s: Stylesheet): Promise<void>;
    addExtraFiles(extrafiles: {
        [path: string]: string;
    }): void;
    getFolderContents(path: string): Thenable<FsEntity[]>;
}
