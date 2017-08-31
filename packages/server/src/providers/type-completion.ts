import { Completion, CompletionProvider, ProviderOptions, ProviderPosition, ProviderRange } from "./completion-provider";
import { classCompletion } from './class-completion'

export class TypeCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !options.trimmedLine.endsWith(':')) {
            let comps: string[] = [];
            options.meta.imports.forEach(i => comps.push(i.defaultExport))
            return comps.map(c => classCompletion(c,
                new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position),
                true));
        } else
            return [];
    }
    text: string[] = [''];
}
