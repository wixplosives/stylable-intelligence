import * as PostCss from 'postcss';
import { Stylesheet, Resolver } from 'stylable';
import { SymbolDefinition } from "./utils/get-definitions";
import { Position } from "./utils/postcss-ast-utils";
export interface ProviderPosition {
    line: number;
    character: number;
}
export interface ProviderRange {
    start: ProviderPosition;
    end: ProviderPosition;
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
export interface FsEntity extends SymbolDefinition {
    type: string;
    globalPath: string;
}
export interface File extends FsEntity {
    type: 'file';
}
export interface Dir extends FsEntity {
    type: 'dir';
}
export interface ExtendedResolver extends Resolver {
    resolveDependencies(stylesheet: Stylesheet): Thenable<void>;
    getFolderContents(folderPath: string): Thenable<FsEntity[]>;
}
export default class Provider {
    getClassDefinition(stylesheet: Stylesheet, symbol: string, resolver: ExtendedResolver): void;
    provideCompletionItemsFromSrc(src: string, position: Position, filePath: string, resolver: ExtendedResolver): Thenable<Completion[]>;
    provideCompletionItemsFromAst(src: string, position: Position, filePath: string, resolver: ExtendedResolver, ast: PostCss.Root, stylesheet: Stylesheet, currentLine: string, cursorLineIndex: number): Thenable<Completion[]>;
}
