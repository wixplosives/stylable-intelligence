import { Completion, CompletionProvider, ProviderOptions } from "./completion-provider";

export class ExtendCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        return [];
    }
    text: string[] = [''];
}
