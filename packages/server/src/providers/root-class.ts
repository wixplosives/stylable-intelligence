import { Completion, CompletionProvider, ProviderOptions } from "./completion-provider";

const rootClass = new Completion('.root', 'The root class', 'b');

export class RootClassProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && options.isLineStart) {
            return [rootClass];
        } else {
            return [];
        }
    }
    text: string[] = ['.root']
}
