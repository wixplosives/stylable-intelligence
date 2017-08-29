import { valueMapping } from 'stylable';
import { Completion, CompletionProvider, snippet, ProviderOptions } from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const statesDirective = new Completion('-st-states:', 'Define the CSS states available for this class', 'a', new snippet('-st-states: $1;'));

export class StatesDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let lastRule = options.lastRule
        if (options.insideSimpleSelector && options.isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [statesDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.states]
}
