import { Completion, CompletionProvider, ProviderPosition, snippet, ProviderRange, ProviderOptions} from "./completion-provider";

export class StateCompletionProvider implements CompletionProvider {
    provide(options: ProviderOptions): Completion[] {
        if (options.isTopLevel && !!options.currentSelector) {
            let states = options.currentSelector.reduce((acc: string[][], t) => acc.concat(Object.keys((t.symbol as any)['-st-states'] || []).map(s => [s, t.meta.source])), []);
            return states.reduce((acc: Completion[], st) => { acc.push(stateCompletion(st[0], st[1], options.position)); return acc; }, [])
        } else {
            return [];
        }
    }
    text: string[] = [''];
}

function singleLineRange(line: number, start: number, end: number): ProviderRange {
    return {
        start: {
            line: line,
            character: start
        },
        end: {
            line: line,
            character: end
        }
    }
}

function stateCompletion(stateName: string, from: string, pos: ProviderPosition) {
    return new Completion(':' + stateName, 'from: ' + from, 'a', new snippet(':' + stateName), singleLineRange(pos.line, pos.character - 1, pos.character));
}
