import { valueMapping } from 'stylable';
import { Completion, CompletionProvider, ProviderOptions, snippet} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const mixinDirective = new Completion('-st-mixin:', 'Apply mixins on the class', 'a', new snippet('-st-mixin: $1;'));

export class MixinDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isLineStart && !options.isImport && options.lastRule &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [mixinDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.mixin]
}
