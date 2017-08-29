import { valueMapping } from 'stylable';
import { Completion, CompletionProvider, ProviderOptions, snippet} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const variantDirective = new Completion('-st-variant:', '', 'a', new snippet('-st-variant: true;'));

export class VariantDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let lastRule = options.lastRule
        if (options.insideSimpleSelector && options.isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [variantDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.variant]
}
