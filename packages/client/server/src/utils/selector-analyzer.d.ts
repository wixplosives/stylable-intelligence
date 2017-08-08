export interface SelectorQuery {
    _type: string;
}
export interface SelectorChunk extends SelectorQuery {
    type: string;
    classes: string[];
    states: string[];
}
export interface SelectorInternalChunk extends SelectorChunk {
    name: string;
}
export interface SelectorDescendent extends SelectorQuery {
}
export interface SelectorDirectChild extends SelectorQuery {
}
export interface CursorPosition {
    focusChunk: SelectorQuery | Array<SelectorChunk | SelectorInternalChunk>;
    simpleSelector: string;
    index: number;
}
export declare function createSelectorChunk(value?: Partial<SelectorChunk>): SelectorChunk;
export declare function createSelectorInternalChunk(value?: Partial<SelectorInternalChunk>): SelectorInternalChunk;
export declare function createSelectorDescendent(): SelectorDescendent;
export declare function createSelectorDirectChild(): SelectorDirectChild;
export declare function isSelectorChunk(chunk: SelectorQuery): chunk is SelectorInternalChunk;
export declare function isSelectorInternalChunk(chunk: SelectorQuery): chunk is SelectorInternalChunk;
export declare function isSelectorDescendent(chunk: SelectorQuery): chunk is SelectorDescendent;
export declare function isSelectorDirectChild(chunk: SelectorQuery): chunk is SelectorDirectChild;
export declare function parseSelector(inputSelector: string, cursorIndex?: number): {
    selector: SelectorQuery[];
    target: CursorPosition;
};
