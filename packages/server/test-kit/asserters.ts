import { expect } from 'chai';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { TextDocument } from 'vscode-languageserver-types';
import { createProvider, MinimalDocs, createFs } from '../src/provider-factory'
import { Completion, snippet } from '../src/completion-types';
import { ProviderPosition, ProviderRange } from '../src/completion-providers';
import { createMeta, ProviderLocation } from '../src/provider';
import { pathFromPosition } from '../src/utils/postcss-ast-utils'
import { NodeBase } from 'postcss';
import { Provider } from '../src/index';
import { SignatureHelp, TextDocumentPositionParams, TextDocumentIdentifier, ParameterInformation } from 'vscode-languageserver';
import { fileUriToNativePath } from '../src/utils/uri-utils';
import { Stylable } from 'stylable';
import { LocalSyncFs } from '../src/local-sync-fs';
import { createDocFs } from '../src/server';
import { createLanguageServiceHost, createBaseHost } from '../src/utils/temp-language-service-host';
import { ExtendedTsLanguageService } from '../src/types';

function assertPresent(actualCompletions: Completion[], expectedCompletions: Partial<Completion>[], prefix: string = '') {
    expectedCompletions.forEach(expected => {
        const actual = actualCompletions.find((comp) => comp.label === expected.label);
        expect(actual, 'Completion not found: ' + expected.label + ' ' + 'with prefix ' + prefix + ' ').to.not.be.equal(undefined);
        if (actual) {
            for (var field in expected) {
                let actualVal: any = (actual as any)[field];
                if (actualVal instanceof snippet) {
                    actualVal = actualVal.source;
                }
                const expectedVal: any = (expected as any)[field];
                expect(actualVal, 'Field value mismatch: ' + actual.label + ":" + field + ' with prefix ' + prefix + ' ').to.eql(expectedVal);
            }
        }
    });
}

function assertExact(actualCompletions: Completion[], expectedCompletions: Partial<Completion>[], prefix: string = '') {
    expectedCompletions.forEach(expected => {
        const actualInd = actualCompletions.findIndex((comp) => comp.label === expected.label);
        const actual = actualCompletions[actualInd];
        expect(actual, 'Completion not found: ' + expected.label + ' ' + 'with prefix ' + prefix + ' ').to.not.be.equal(undefined);
        if (actual) {
            for (var field in expected) {
                let actualVal: any = (actual as any)[field];
                if (actualVal instanceof snippet) {
                    actualVal = actualVal.source;
                }
                const expectedVal: any = (expected as any)[field];
                expect(actualVal, actual.label + ":" + field).to.eql(expectedVal);
            }
            actualCompletions.splice(actualInd, 1)
        }
    });
}

function assertNotPresent(actualCompletions: Completion[], nonCompletions: Partial<Completion>[], prefix: string = '') {
    nonCompletions.forEach(notAllowed => {
        const actual = actualCompletions.find((comp) => comp.label === notAllowed.label);
        expect(actual, prefix + 'unallowed completion found: ' + notAllowed.label + ' ').to.be.equal(undefined);
    });
}


export interface Assertable {
    suggested: (expectedCompletions: Partial<Completion>[]) => void;
    exactSuggested: (expectedCompletions: Partial<Completion>[]) => void;
    notSuggested: (nonCompletions: Partial<Completion>[]) => void
}

export function getCompletions(fileName: string, prefix: string = ''): Thenable<Assertable> {
    const fullPath = path.join(__dirname, '/../test/cases/', fileName);
    const src: string = fs.readFileSync(fullPath).toString();

    return completionsIntenal(provider, fullPath, src, prefix)
        .then((completions) => {
            return {
                suggested: (expectedCompletions: Partial<Completion>[]) => {
                    assertPresent(completions, expectedCompletions, prefix);
                },
                exactSuggested: (expectedCompletions: Partial<Completion>[]) => {
                    assertExact(completions, expectedCompletions);
                },
                notSuggested: (expectedNoCompletions: Partial<Completion>[]) => {
                    assertNotPresent(completions, expectedNoCompletions);
                }
            }
        })
}

function completionsIntenal(provider: Provider, fileName: string, src: string, prefix: string): Thenable<Completion[]> {
    let pos = getCaretPosition(src);
    src = src.replace('|', prefix);
    pos.character += prefix.length;

    return provider.provideCompletionItemsFromSrc(src, pos, fileName, docsFs)
}

export function getCaretPosition(src: string) {
    const caretPos = src.indexOf('|');
    const linesTillCaret = src.substr(0, caretPos).split('\n');
    const character = linesTillCaret[linesTillCaret.length - 1].length;
    return new ProviderPosition(linesTillCaret.length - 1, character);
}

export function getPath(fileName: string): NodeBase[] {
    const fullPath = path.join(__dirname, '/../test/cases/', fileName);
    let src: string = fs.readFileSync(fullPath).toString();
    let pos = getCaretPosition(src);
    src = src.replace('|', "");
    const proc = createMeta(src, fullPath);
    return pathFromPosition(proc.meta!.rawAst, new ProviderPosition(pos.line + 1, pos.character))
}

export function getDefinition(fileName: string): Thenable<ProviderLocation[]> {
    const fullPath = path.join(__dirname, '/../test/cases/', fileName);
    let src: string = fs.readFileSync(fullPath).toString();
    let pos = getCaretPosition(src);
    src = src.replace('|', "");
    return provider.getDefinitionLocation(src, pos, fullPath, docsFs).then((res) => {
        return res;
    })
}

export function getSignatureHelp(fileName: string, prefix: string): SignatureHelp | null {
    const fullPath = path.join(__dirname, '/../test/cases/', fileName);
    let src: string = fs.readFileSync(fullPath).toString();
    let pos = getCaretPosition(src);
    src = src.replace('|', prefix);
    pos.character += prefix.length;
    return provider.getSignatureHelp(src, pos, fullPath, docsFs, ParameterInformation);
}

const minDocs: MinimalDocs = {
    get(uri: string): TextDocument {
        if (!uri.startsWith('file://')) {
            return TextDocument.create(uri, 'css', 1, fs.readFileSync(uri).toString());
        } else {
            return TextDocument.create(uri, 'css', 1, fs.readFileSync(fileUriToNativePath(uri)).toString());
        }
    },
    keys(): string[] {
        return fs.readdirSync(path.join(__dirname, '../test/cases/imports/'));
    }
};
const docsFs = createDocFs(new LocalSyncFs(''),minDocs);

let openedFiles:string[] = [];
const tsLanguageServiceHost = createLanguageServiceHost({
    cwd: __dirname,
    getOpenedDocs: () => openedFiles,
    compilerOptions: {
        target: ts.ScriptTarget.ES5, sourceMap: false, declaration: true, outDir: 'dist',
        module: ts.ModuleKind.CommonJS,
        typeRoots: ["./node_modules/@types"]
    },
    defaultLibDirectory: path.join(__dirname, '../test/cases'),
    baseHost: createBaseHost(docsFs, path)
});
const tsLanguageService = ts.createLanguageService(tsLanguageServiceHost);
const wrappedTs:ExtendedTsLanguageService = {
    ts:tsLanguageService,
    setOpenedFiles:(files:string[]) => openedFiles = files
};


const provider = createProvider(new Stylable('/', createFs( docsFs, true), () => ({ default: {} })), wrappedTs);



//syntactic

export const customSelectorDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '@custom-selector', detail: 'Define a custom selector', sortText: 'a', insertText: '@custom-selector :--', range: rng };
}
export const extendsDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '-st-extends:', detail: 'Extend an external component', sortText: 'a', insertText: '-st-extends: $1;', additionalCompletions: true, range: rng };
}
export const importDefaultDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '-st-default:', detail: 'Default export name', sortText: 'a', insertText: '-st-default: $1;', range: rng };
}
export const importDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: ':import', detail: 'Import an external library', sortText: 'a', insertText: ':import {\n\t-st-from: "$1";\n}$0', range: rng }
};
export const importFromDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '-st-from:', detail: 'Path to library', sortText: 'a', insertText: '-st-from: "$1";', range: rng };
}
export const importNamedDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '-st-named:', detail: 'Named export name', sortText: 'a', insertText: '-st-named: $1;', range: rng };
}
export const mixinDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '-st-mixin:', detail: 'Apply mixins on the class', sortText: 'a', insertText: '-st-mixin: $1;', range: rng };
}
export const namespaceDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '@namespace', detail: 'Declare a namespace for the file', sortText: 'a', insertText: '@namespace "$1";\n$0', range: rng };
}
export const rootClassCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '.root', detail: 'The root class', sortText: 'a', insertText: '.root', range: rng };
}
export const statesDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '-st-states:', detail: 'Define the CSS states available for this class', sortText: 'a', insertText: '-st-states: $1;', range: rng };
}
export const themeDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '-st-theme:', detail: 'Declare a theme', sortText: 'a', insertText: '-st-theme: true;\n$0', range: rng };
}
export const valueDirective: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: 'value()', detail: 'Use the value of a variable', sortText: 'a', insertText: ' value($1)$0', range: rng };
}
export const varsDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: ':vars', detail: 'Declare variables', sortText: 'a', insertText: ':vars {\n\t$1\n}$0', range: rng };
}
export const variantDirectiveCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return { label: '-st-variant:', detail: 'Is a variant', sortText: 'a', insertText: '-st-variant: true;', range: rng };
}
export const globalCompletion: (rng: ProviderRange) => Partial<Completion> = (rng) => {
    return new Completion(':global()', 'Target a global selector', 'a', ':global($0)', rng)
}


//semantic
export const classCompletion: (className: string, rng: ProviderRange, isDefaultImport?: boolean) => Partial<Completion> = (className, rng, isDefaultImport?) => {
    return { label: (isDefaultImport ? '' : '.') + className, sortText: 'a', range: rng }
}
export const extendsCompletion: (typeName: string, rng: ProviderRange, from: string) => Partial<Completion> = (typeName, rng, from) => {
    return { label: typeName, sortText: 'a', insertText: typeName, detail: 'from: ' + from, range: rng }
}
export const namedCompletion: (typeName: string, rng: ProviderRange, from: string, value?: string) => Partial<Completion> = (typeName, rng, from, value?) => {
    return { label: typeName, sortText: 'a', insertText: typeName, detail: 'from: ' + from + '\n' + 'Value: ' + value, range: rng }
}
export const cssMixinCompletion: (symbolName: string, rng: ProviderRange, from: string) => Partial<Completion> = (symbolName, rng, from) => {
    return new Completion(symbolName, 'from: ' + from, 'a', symbolName, rng)
}
export const codeMixinCompletion: (symbolName: string, rng: ProviderRange, from: string) => Partial<Completion> = (symbolName, rng, from) => {
    return new Completion(symbolName, 'from: ' + from, 'a', symbolName + "($0)", rng, false, true)
}
export const formatterCompletion: (symbolName: string, rng: ProviderRange, from: string) => Partial<Completion> = (symbolName, rng, from) => {
    return new Completion(symbolName, 'from: ' + from, 'a', new snippet(symbolName + "($0)"), rng, false, true)
}
export const stateCompletion: (stateName: string, rng: ProviderRange, from?: string) => Partial<Completion> = (stateName, rng, from = 'Local file') => {
    return { label: ':' + stateName, sortText: 'a', detail: 'from: ' + from, insertText: ':' + stateName, range: rng }
}
export const pseudoElementCompletion: (elementName: string, rng: ProviderRange, from?: string) => Partial<Completion> = (elementName, rng, from?) => {
    return { label: '::' + elementName, sortText: 'a', detail: 'from: ' + from, insertText: '::' + elementName, range: rng }
}
export const valueCompletion: (name: string, rng: ProviderRange, value: string, from: string) => Partial<Completion> = (name, rng, value, from) => {
    return { label: name, sortText: 'a', detail: 'from: ' + from + '\n' + 'value: ' + value, insertText: name, range: rng }
}
