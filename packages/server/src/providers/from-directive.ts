import { StylableMeta, SRule, valueMapping } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition, snippet} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const fromDirective = new Completion('-st-from:', 'Path to library', 'a', new snippet('-st-from: "$1";'));

export class FromDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isImport && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [fromDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.from]
}
