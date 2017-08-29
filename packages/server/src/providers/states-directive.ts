import { StylableMeta, SRule, valueMapping } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition, snippet} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const statesDirective = new Completion('-st-states:', 'Define the CSS states available for this class', 'a', new snippet('-st-states: $1;'));

export class StatesDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (insideSimpleSelector && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [statesDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.states]
}
