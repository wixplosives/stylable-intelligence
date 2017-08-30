import {
    // ProviderRange, snippet,
    Completion, CompletionProvider, ProviderOptions } from "./completion-provider";

// function extendCompletion(symbolName: string, range?: ProviderRange) {
//     return new Completion(symbolName, 'yours', 'a', new snippet(' ' + symbolName + ';\n'), range)
// }

export class ExtendCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        return [];
    }
    text: string[] = [''];
}
