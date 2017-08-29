import { StylableMeta, SRule, valueMapping } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition, snippet} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const namedDirective = new Completion('-st-named:', 'Named object export name', 'a', new snippet('-st-named: $1;'));

export class NamedDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isImport && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [namedDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.named]
}
