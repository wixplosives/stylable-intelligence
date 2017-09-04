import { SelectorChunk } from '../utils/selector-analyzer';
import { Completion, CompletionProvider, ProviderPosition, snippet, ProviderRange, ProviderOptions } from "./completion-provider";

function stateCompletion(stateName: string, from: string, rng: ProviderRange) {
    return new Completion(':' + stateName, 'from: ' + from, 'a', new snippet(':' + stateName), rng);
}

export class StateCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !!options.resolved) {
            let states = options.resolved.reduce(
                (acc: string[][], t) => acc.concat(Object.keys((t.symbol as any)['-st-states'] || []).map(s => [s, t.meta.source])), []);
            return states.reduce((acc: Completion[], st) => {
                if ((options.target.focusChunk as SelectorChunk).states.indexOf(st[0]) == -1) {

                    acc.push(stateCompletion(st[0], st[1], (new ProviderRange(
                        new ProviderPosition(options.position.line, Math.max(0, options.position.character - (options.trimmedLine.endsWith(':') ? 1 : 0))), options.position)
                    )));
                }
                return acc;
            }, [])
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

