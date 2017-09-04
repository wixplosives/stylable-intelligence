import { valueMapping } from 'stylable';
import { ProviderRange, ProviderPosition, Completion, CompletionProvider, ProviderOptions, snippet} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

function namedDirective(rng: ProviderRange) {
    return new Completion('-st-named:', 'Named object export name', 'a', new snippet('-st-named: $1;'), rng);
}

export class NamedDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let lastRule = options.lastRule
        if (options.isImport && options.isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [namedDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.named]
}
