import {  valueMapping } from 'stylable';
import { Completion, CompletionProvider, snippet, ProviderOptions} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const fromDirective = new Completion('-st-from:', 'Path to library', 'a', new snippet('-st-from: "$1";'));

export class FromDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [fromDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.from]
}
