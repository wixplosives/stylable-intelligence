import { Completion, CompletionProvider, ProviderOptions, ProviderPosition, ProviderRange } from "./completion-provider";

export function classCompletion(className: string, rng: ProviderRange, isDefaultImport: boolean = false) {
    return new Completion((isDefaultImport ? '' : '.') + className, 'mine', 'b', undefined, rng)
}

export class ClassCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !options.trimmedLine.endsWith(':')) {
            let comps: string[] = [];
            comps.push(...Object.keys(options.meta.classes))
            options.meta.imports.forEach(i => comps.push(...Object.keys(i.named)))
            return comps.map(c => classCompletion(c, new ProviderRange(new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position)),  false,);
        } else
            return [];
    }
    text: string[] = [''];
}
