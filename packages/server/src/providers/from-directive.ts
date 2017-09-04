import {  valueMapping } from 'stylable';
import { ProviderRange, ProviderPosition, Completion, CompletionProvider, snippet, ProviderOptions} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

function fromDirective(rng: ProviderRange) {
    return new Completion('-st-from:', 'Path to library', 'a', new snippet('-st-from: "$1";'), rng);
}

export class FromDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [fromDirective(new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.from]
}
