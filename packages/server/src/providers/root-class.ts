import { ProviderRange, ProviderPosition, Completion, CompletionProvider, ProviderOptions } from "./completion-provider";

function rootClass(rng: ProviderRange) {
    return new Completion('.root', 'The root class', 'b', undefined, rng);
}

export class RootClassProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && options.isLineStart) {
            return [rootClass(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, options.position.character - options.trimmedLine.length)), options.position))];
        } else {
            return [];
        }
    }
    text: string[] = ['.root']
}
