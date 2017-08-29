import { StylableMeta, SRule, valueMapping } from 'stylable';
import { CSSResolve } from 'stylable';
import { Completion, CompletionProvider, ProviderPosition, snippet} from "./completion-provider";
import {isContainer, isDeclaration  } from '../utils/postcss-ast-utils';

const variantDirective = new Completion('-st-variant:', '', 'a', new snippet('-st-variant: true;'));

export class VariantDirectiveProvider implements CompletionProvider {
    provide(meta: StylableMeta, lastRule: SRule | null, lastChar: string, position: ProviderPosition, isTopLevel: boolean, isLineStart: boolean, isImport: boolean, insideSimpleSelector: boolean, currentSelector: CSSResolve[]): Completion[] {
        if (insideSimpleSelector && isLineStart && lastRule &&
            (isContainer(lastRule) && lastRule.nodes!.every(n => isDeclaration(n) && this.text.every(t => t !== n.prop)))) {
            return [variantDirective];
        } else {
            return [];
        }
    }
    text: string[] = [valueMapping.variant]
}
