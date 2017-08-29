import { StylableMeta, SRule, valueMapping } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition, snippet} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const mixinDirective = new Completion('-st-mixin:', 'Apply mixins on the class', 'a', new snippet('-st-mixin: $1;'));

export class MixinDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (isLineStart && !isImport && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [mixinDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.mixin]
}
