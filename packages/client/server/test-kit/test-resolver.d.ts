import { Stylesheet } from 'stylable';
import { VsCodeResolver } from '../src/adapters/vscode-resolver';
import { ExtendedResolver } from '../src/provider';
export declare class TestResolver extends VsCodeResolver implements ExtendedResolver {
    resolveModule(filePath: string): any;
    resolveDependencies(stylesheet: Stylesheet): Promise<void>;
}
