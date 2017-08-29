import { StylableMeta, SRule } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition } from "./completion-provider";

const rootClass = new Completion('.root', 'The root class', 'b');

export class RootClassProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isTopLevel && isLineStart) {
            return [rootClass];
        } else {
            return [];
        }
    }
    text: string[] = ['.root']
}
