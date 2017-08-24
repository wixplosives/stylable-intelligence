import { StylableMeta } from 'stylable';
import { VsCodeResolver } from './adapters/vscode-resolver';
export declare class ProviderPosition {
    line: number;
    character: number;
    constructor(line: number, character: number);
}
export declare class ProviderRange {
    start: ProviderPosition;
    end: ProviderPosition;
    constructor(start: ProviderPosition, end: ProviderPosition);
}
export declare class Completion {
    label: string;
    detail: string;
    sortText: string;
    insertText: string | snippet;
    range: ProviderRange | undefined;
    additionalCompletions: boolean;
    constructor(label: string, detail?: string, sortText?: string, insertText?: string | snippet, range?: ProviderRange | undefined, additionalCompletions?: boolean);
}
export declare class snippet {
    source: string;
    constructor(source: string);
}
export default class Provider {
    private resolver;
    constructor(resolver: VsCodeResolver);
    getClassDefinition(meta: StylableMeta, symbol: string): void;
    provideCompletionItemsFromSrc(src: string, position: ProviderPosition, filePath: string): Thenable<Completion[]>;
    provideCompletionItemsFromAst(src: string, position: ProviderPosition, filePath: string, meta: StylableMeta, currentLine: string, cursorLineIndex: number): Thenable<Completion[]>;
    addExistingClasses(meta: StylableMeta | undefined, completions: Completion[], addDefaultImport?: boolean): void;
}
