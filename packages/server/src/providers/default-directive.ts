import {valueMapping} from 'stylable'
import { Completion, CompletionProvider, snippet, ProviderOptions } from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const defaultDirective = new Completion('-st-default:', 'Default object export name', 'a', new snippet('-st-default: $1;'));

export class DefaultDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isImport && options.isLineStart && options.lastRule &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [defaultDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.default]
}
