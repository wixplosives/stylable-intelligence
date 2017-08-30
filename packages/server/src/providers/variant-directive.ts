import { valueMapping } from 'stylable';
import { ProviderPosition, ProviderRange, Completion, CompletionProvider, ProviderOptions, snippet} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

function variantDirective(rng: ProviderRange) {
    return new Completion('-st-variant:', '', 'a', new snippet('-st-variant: true;'));
}

export class VariantDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let lastRule = options.lastRule
        if (options.insideSimpleSelector && options.isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [variantDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.variant]
}
