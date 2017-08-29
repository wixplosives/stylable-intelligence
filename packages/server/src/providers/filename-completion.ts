import { StylableMeta, SRule } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition} from "./completion-provider";

export class FilenameCompletionProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        return [];
    }
    text: string[] = [''];
}
