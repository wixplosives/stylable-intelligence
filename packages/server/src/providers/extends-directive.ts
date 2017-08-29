import { Completion, CompletionProvider, snippet, ProviderOptions} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';
import {valueMapping} from 'stylable'
const extendsDirective = new Completion(valueMapping.extends + ':', 'Extend an external component', 'a', new snippet('-st-extends: $1;'), undefined, true);

export class ExtendsDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.insideSimpleSelector && options.isLineStart && options.lastRule &&
            (isContainer(options.lastRule) && options.lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [extendsDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.extends]
}
