import {valueMapping} from 'stylable'
import { ProviderPosition, ProviderRange, Completion, CompletionProvider, snippet, ProviderOptions } from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

function defaultDirective(rng: ProviderRange) {
    return new Completion('-st-default:', 'Default object export name', 'a', new snippet('-st-default: $1;'), rng);
}

export class DefaultDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [defaultDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.default]
}
