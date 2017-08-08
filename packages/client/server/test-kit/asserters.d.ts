import { Completion, ProviderRange } from '../src/provider';
export interface assertable {
    suggested: (expectedCompletions: Partial<Completion>[]) => void;
    notSuggested: (nonCompletions: Partial<Completion>[]) => void;
}
export declare function getCompletions(src: string, extrafiles?: {
    [path: string]: string;
}, checkSingleLine?: boolean): Thenable<assertable>;
export declare const importCompletion: Partial<Completion>;
export declare const rootCompletion: Partial<Completion>;
export declare const statesDirectiveCompletion: Partial<Completion>;
export declare const extendsDirectiveCompletion: Partial<Completion>;
export declare const mixinDirectiveCompletion: Partial<Completion>;
export declare const variantDirectiveCompletion: Partial<Completion>;
export declare const importFromDirectiveCompletion: Partial<Completion>;
export declare const importDefaultDirectiveCompletion: Partial<Completion>;
export declare const importNamedDirectiveCompletion: Partial<Completion>;
export declare const filePathCompletion: (filePath: string) => Partial<Completion>;
export declare const classCompletion: (className: string) => Partial<Completion>;
export declare const stateCompletion: (stateName: string, from?: string) => Partial<Completion>;
export declare const extendsCompletion: (typeName: string, range?: ProviderRange) => Partial<Completion>;
