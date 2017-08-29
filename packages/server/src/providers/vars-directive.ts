import { StylableMeta, SRule } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition, ProviderRange, snippet} from "./completion-provider";

function varsDirective(rng: ProviderRange) {
    return new Completion(':vars', 'Declare variables', 'a', new snippet(':vars {\n\t$1\n}$0'), rng);
}

export class VarsDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isTopLevel && isLineStart) {
            return [varsDirective(new ProviderRange(new ProviderPosition(position.line, Math.max(0, position.character - 1)), position))];
        } else {
            return [];
        }
    }
    text: string[] = [':vars']
}
