import { valueMapping } from 'stylable';
import { ProviderRange, ProviderPosition, Completion, CompletionProvider, snippet, ProviderOptions } from "./completion-provider";
import { isContainer, isDeclaration } from '../utils/postcss-ast-utils';

function statesDirective(rng: ProviderRange) {
    return new Completion('-st-states:', 'Define the CSS states available for this class', 'a', new snippet('-st-states: $1;'));
}

export class StatesDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let lastRule = options.lastRule
        if (options.insideSimpleSelector && options.isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [statesDirective((new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position)))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.states]
}
