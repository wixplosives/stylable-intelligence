import { StylableMeta, SRule } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition, ProviderRange, snippet} from "./completion-provider";

function importsDirective(rng: ProviderRange) {
    return new Completion(':import', 'Import an external library', 'a', new snippet(':import {\n\t-st-from: "$1";\n}$0'), rng);
}

export class ImportDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isTopLevel && isLineStart) {
            return [importsDirective(new ProviderRange(new ProviderPosition(position.line, Math.max(0, position.character - 1)), position))];
        } else {
            return [];
        }
    }
    text: string[] = [':import']
}
