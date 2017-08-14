import { Stylesheet } from 'stylable';
import { ExtendedResolver } from '../src/provider';
import { VsCodeResolver } from '../src/adapters/vscode-resolver';
export declare class TestResolver extends VsCodeResolver implements ExtendedResolver {
    resolveModule(filePath: string): any;
    resolveDependencies(stylesheet: Stylesheet): Promise<void>;
}
