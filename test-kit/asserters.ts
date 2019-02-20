import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { NodeBase } from 'postcss';
import { Stylable } from '@stylable/core';
import { TextDocument, TextDocumentIdentifier, Range } from 'vscode-languageserver-types';
import { Location, ParameterInformation, SignatureHelp, ColorPresentation, Color } from 'vscode-languageserver';
import { ColorInformation } from 'vscode-css-languageservice';
import { createFs, createProvider, MinimalDocs } from '../src/lib/provider-factory';
import { ProviderPosition } from '../src/lib/completion-providers';
import { createMeta, getRefs, ProviderLocation } from '../src/lib/provider';
import { pathFromPosition } from '../src/lib/utils/postcss-ast-utils';
import { fromVscodePath, toVscodePath } from '../src/lib/utils/uri-utils';
import { LocalSyncFs } from '../src/lib/local-sync-fs';
import { createDocFs } from '../src/lib/server-utils';
import { createBaseHost, createLanguageServiceHost } from '../src/lib/utils/temp-language-service-host';
import { ExtendedTsLanguageService } from '../src/lib/types';
import { CssService } from '../src/model/css-service';
import { resolveDocumentColors, getColorPresentation } from '../src/lib/feature/color-provider';
import pkgDir from 'pkg-dir';

export const CASES_PATH = path.join(pkgDir.sync(__dirname)!, 'fixtures', 'server-cases');

export function getCaretPosition(src: string) {
    const caretPos = src.indexOf('|');
    const linesTillCaret = src.substr(0, caretPos).split('\n');
    const character = linesTillCaret[linesTillCaret.length - 1].length;
    return new ProviderPosition(linesTillCaret.length - 1, character);
}

export function getPath(fileName: string): NodeBase[] {
    const fullPath = path.join(CASES_PATH, fileName);
    let src: string = fs.readFileSync(fullPath).toString();
    const pos = getCaretPosition(src);
    src = src.replace('|', '');
    const proc = createMeta(src, fullPath);
    return pathFromPosition(proc.meta!.rawAst, new ProviderPosition(pos.line + 1, pos.character));
}

export async function getDefinition(fileName: string): Promise<ProviderLocation[]> {
    const fullPath = path.join(CASES_PATH, fileName);
    let src: string = fs.readFileSync(fullPath).toString();
    const pos = getCaretPosition(src);
    src = src.replace('|', '');
    const res = await provider.getDefinitionLocation(src, pos, fullPath, docsFs);
    return res;
}

export async function getDefFromLoc({ filePath, pos }: { filePath: string; pos: ProviderPosition }) {
    const fullPath = path.join(CASES_PATH, filePath);
    const src: string = fs.readFileSync(fullPath).toString();
    const res = await provider.getDefinitionLocation(src, pos, fullPath, docsFs);
    return res;
}

export function getReferences(fileName: string, pos: ProviderPosition): Location[] {
    const fullPath = path.join(CASES_PATH, fileName);
    const src: string = fs.readFileSync(fullPath).toString();
    const doc = TextDocument.create(toVscodePath(fullPath), 'stylable', 1, src);
    return getRefs({ context: { includeDeclaration: true }, position: pos, textDocument: doc }, docsFs, stylable);
}

export function getSignatureHelp(fileName: string, prefix: string): SignatureHelp | null {
    const fullPath = path.join(CASES_PATH, fileName);
    let src: string = fs.readFileSync(fullPath).toString();
    const pos = getCaretPosition(src);
    src = src.replace('|', prefix);
    pos.character += prefix.length;
    return provider.getSignatureHelp(src, pos, fullPath, docsFs, ParameterInformation);
}

export function getDocumentColors(fileName: string): ColorInformation[] {
    const fullPath = path.join(CASES_PATH, fileName);
    const src: string = fs.readFileSync(fullPath).toString();
    const doc = TextDocument.create(toVscodePath(fullPath), 'stylable', 1, src);

    return resolveDocumentColors(stylable, newCssService, doc);
}

export function getDocColorPresentation(fileName: string, color: Color, range: Range): ColorPresentation[] {
    const fullPath = path.join(CASES_PATH, fileName);
    const src: string = fs.readFileSync(fullPath).toString();
    const doc = TextDocument.create(toVscodePath(fullPath), 'stylable', 1, src);

    return getColorPresentation(newCssService, doc, {
        textDocument: TextDocumentIdentifier.create(doc.uri),
        color,
        range
    });
}

const minDocs: MinimalDocs = {
    get(uri: string): TextDocument {
        return TextDocument.create(uri, 'css', 1, fs.readFileSync(fromVscodePath(uri)).toString());
    },
    keys(): string[] {
        return fs.readdirSync(path.join(CASES_PATH, 'imports'));
    }
};
const docsFs = createDocFs(new LocalSyncFs(''), minDocs);

let openedFiles: string[] = [];
const tsLanguageServiceHost = createLanguageServiceHost({
    cwd: __dirname,
    getOpenedDocs: () => openedFiles,
    compilerOptions: {
        target: ts.ScriptTarget.ES5,
        sourceMap: false,
        declaration: true,
        outDir: 'dist',
        module: ts.ModuleKind.CommonJS,
        typeRoots: ['./node_modules/@types']
    },
    defaultLibDirectory: CASES_PATH,
    baseHost: createBaseHost(docsFs, path)
});
const tsLanguageService = ts.createLanguageService(tsLanguageServiceHost);
const wrappedTs: ExtendedTsLanguageService = {
    ts: tsLanguageService,
    setOpenedFiles: (files: string[]) => (openedFiles = files)
};

const stylable = new Stylable(CASES_PATH, createFs(docsFs), () => ({ default: {} }));
const provider = createProvider(stylable, wrappedTs);
const newCssService = new CssService(docsFs);
