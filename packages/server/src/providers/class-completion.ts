import { StylableMeta, SRule } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition} from "./completion-provider";

export function classCompletion(className: string, isDefaultImport?: boolean) {
    return new Completion((isDefaultImport ? '' : '.') + className, 'mine', 'b')
}

export class ClassCompletionProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isTopLevel && lastChar!==':') {
            return Object.keys(meta.classes).filter(c => c !== 'root').map(c => classCompletion(c, false))
        } else
            return [];
    }
    text: string[] = [''];
}
