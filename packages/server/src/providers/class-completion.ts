import { Completion, CompletionProvider, ProviderOptions } from "./completion-provider";

export function classCompletion(className: string, isDefaultImport?: boolean) {
    return new Completion((isDefaultImport ? '' : '.') + className, 'mine', 'b')
}

export class ClassCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !options.trimmedLine.endsWith(':')) {
            return Object.keys(options.meta.classes).filter(c => c !== 'root').map(c => classCompletion(c, false))
        } else
            return [];
    }
    text: string[] = [''];
}
