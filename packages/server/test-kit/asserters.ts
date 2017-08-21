import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { TextDocument } from 'vscode-languageserver-types';

import { VsCodeResolver } from '../src/adapters/vscode-resolver';
import Provider, { Completion, ProviderRange, snippet } from '../src/provider';

function assertCompletions(actualCompletions: Completion[], expectedCompletions: Partial<Completion>[], prefix: string = '') {
    expectedCompletions.forEach(expected => {
        const actual = actualCompletions.find((comp) => comp.label === expected.label);
        expect(actual, prefix + 'completion not found: ' + expected.label + ' ').to.not.be.equal(undefined);
        if (actual) {
            for (var field in expected) {
                let actualVal: any = (actual as any)[field];
                if (actualVal instanceof snippet) {
                    actualVal = actualVal.source;
                }
                const expectedVal: any = (expected as any)[field];
                expect(actualVal, actual.label + ":" + field).to.equal(expectedVal);
            }
        }
    });
}

function assertNoCompletions(actualCompletions: Completion[], nonCompletions: Partial<Completion>[], prefix: string = '') {
    nonCompletions.forEach(notAllowed => {
        const actual = actualCompletions.find((comp) => comp.label === notAllowed.label);
        expect(actual, prefix + 'unallowed completion found: ' + notAllowed.label + ' ').to.be.equal(undefined);
    });
}


export interface assertable {
    suggested: (expectedCompletions: Partial<Completion>[]) => void;
    notSuggested: (nonCompletions: Partial<Completion>[]) => void
}

export function getCompletions(fileName: string, checkSingleLine: boolean = false): Thenable<assertable> {
    const fullPath = path.join(__dirname, '/../test/cases/', fileName);
    const src: string = fs.readFileSync(fullPath).toString();
    const singleLineSrc = src.split('\n').join('');
    let normalCompletions: Completion[];
    return completionsIntenal(fullPath, src)
        .then((completions) => { normalCompletions = completions; })
        .then<Completion[] | null>(() => checkSingleLine ? completionsIntenal(fullPath, singleLineSrc) : Promise.resolve(null))
        .then((singleLineCompletions) => {
            return {
                suggested: (expectedNoCompletions: Partial<Completion>[]) => {
                    assertCompletions(normalCompletions, expectedNoCompletions);
                    singleLineCompletions && assertCompletions(singleLineCompletions, expectedNoCompletions, 'single line: ');
                },
                notSuggested: (expectedNoCompletions: Partial<Completion>[]) => {
                    assertNoCompletions(normalCompletions, expectedNoCompletions);
                    singleLineCompletions && assertNoCompletions(singleLineCompletions, expectedNoCompletions, 'single line: ');
                }
            }

        })
}

function completionsIntenal(fileName: string, src: string): Thenable<Completion[]> {
    const caretPos = src.indexOf('|');
    const linesTillCaret = src.substr(0, caretPos).split('\n');
    const character = linesTillCaret[linesTillCaret.length - 1].length;

    src = src.replace('|', "");

    // const resolver = new TestResolver(new TextDocuments());
    const resolver = new VsCodeResolver({
        get(uri: string): TextDocument {
            return TextDocument.create(uri, 'css', 1, fs.readFileSync(uri).toString())
        },
        keys(): string[] {
            return [];
        }
    });

    const provider = new Provider(resolver);

    return provider.provideCompletionItemsFromSrc(src, {
        line: linesTillCaret.length - 1,
        character
    }, fileName)
}

export const importCompletion: Partial<Completion> = { label: ':import', detail: 'Import an external library', sortText: 'a', insertText: ':import {\n\t-st-from: "$1";\n}$0' };
export const varsCompletion: Partial<Completion> = {label: ':vars', detail: 'Declare variables', sortText: 'a', insertText: ':vars {\n\t$1\n}$0'};
export const rootCompletion: Partial<Completion> = { label: '.root', detail: 'The root class', sortText: 'b', insertText: '.root' };
export const statesDirectiveCompletion: Partial<Completion> = { label: '-st-states:', detail: 'Define the CSS states available for this class', sortText: 'a', insertText: '-st-states: $1;' };
export const extendsDirectiveCompletion: Partial<Completion> = { label: '-st-extends:', detail: 'Extend an external component', sortText: 'a', insertText: '-st-extends: $1;', additionalCompletions: true };
export const mixinDirectiveCompletion: Partial<Completion> = { label: '-st-mixin:', detail: 'Apply mixins on the class', sortText: 'a', insertText: '-st-mixin: $1;' };
export const variantDirectiveCompletion: Partial<Completion> = { label: '-st-variant:', detail: '', sortText: 'a', insertText: '-st-variant: true;' };
export const importFromDirectiveCompletion: Partial<Completion> = { label: '-st-from:', detail: 'Path to library', sortText: 'a', insertText: '-st-from: "$1";' };
export const importDefaultDirectiveCompletion: Partial<Completion> = { label: '-st-default:', detail: 'Default object export name', sortText: 'a', insertText: '-st-default: $1;' };
export const importNamedDirectiveCompletion: Partial<Completion> = { label: '-st-named:', detail: 'Named object export name', sortText: 'a', insertText: '-st-named: $1;' };
export const filePathCompletion: (filePath: string) => Partial<Completion> = (filePath) => { return { label: filePath, sortText: 'a', insertText: './' + filePath } };
export const classCompletion: (className: string) => Partial<Completion> = (className) => { return { label: '.' + className, sortText: 'b' } }
export const stateCompletion: (stateName: string, from?: string) => Partial<Completion> = (stateName, from = 'projectRoot/main.css') => { return { label: ':' + stateName, sortText: 'a', detail: 'from: ' + path.join(__dirname, '/../test/cases/', from), insertText: ':' + stateName } }
export const extendsCompletion: (typeName: string, range?: ProviderRange) => Partial<Completion> = (typeName, range) => { return { label: typeName, sortText: 'a', insertText: ' ' + typeName + ';\n', range } };
