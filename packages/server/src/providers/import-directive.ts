import { Completion, CompletionProvider, ProviderPosition, ProviderRange, snippet, ProviderOptions } from "./completion-provider";

function importsDirective(rng: ProviderRange) {
    return new Completion(':import', 'Import an external library', 'a', new snippet(':import {\n\t-st-from: "$1";\n}$0'), rng);
}

export class ImportDirectiveProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        let position = options.position
        if (options.isTopLevel && options.isLineStart) {
            return [importsDirective(new ProviderRange(
                new ProviderPosition(options.position.line, Math.max(0, position.character - options.trimmedLine.length)), position))];
        } else {
            return [];
        }
    }
    text: string[] = [':import']
}
