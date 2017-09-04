import { Completion, CompletionProvider, ProviderPosition, ProviderRange, snippet, ProviderOptions } from "./completion-provider";

function varsDirective(rng: ProviderRange) {
    return new Completion(':vars', 'Declare variables', 'a', new snippet(':vars {\n\t$1\n}$0'), rng);
}

export class VarsDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let position = options.position
        if (options.isTopLevel && options.isLineStart) {
            return [varsDirective(new ProviderRange(new ProviderPosition(position.line, Math.max(0, position.character - options.trimmedLine.length)), position))];
        } else {
            return [];
        }
    }
    text: string[] = [':vars']
}
