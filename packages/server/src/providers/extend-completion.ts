import {
    ProviderRange, ProviderPosition, snippet,
    Completion, CompletionProvider, ProviderOptions
} from "./completion-provider";
import { valueMapping } from 'stylable';


function extendCompletion(symbolName: string, rng: ProviderRange) {
    return new Completion(symbolName, 'yours', 'a', new snippet(' ' + symbolName + ';\n'), rng)
}

export class ExtendCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.currentSelector === valueMapping.extends) {
            let comps: string[] = [];
            comps.push(...Object.keys(options.meta.classes))
            options.meta.imports.forEach(i => comps.push(i.defaultExport))
            options.meta.imports.forEach(i => comps.push(...Object.keys(i.named)))
            return comps.map(c => extendCompletion(c, new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position)));
        } else {
            return [];
        }
    }
    text: string[] = [''];
}
