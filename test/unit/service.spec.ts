import { createMemoryFs } from '@file-services/memory';
import { createCjsModuleSystem } from '@file-services/commonjs';
import { Stylable } from '@stylable/core';
import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument';
import { Diagnostic, Range, Location, Color } from 'vscode-languageserver';
import { IPCMessageReader, IPCMessageWriter, createConnection } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';

import { TestConnection } from '../lsp-testkit/connection.spec';
import { expect, plan } from '../testkit/chai.spec';
import { VSCodeStylableLanguageService } from '../../src/lib/vscode-service';
import { getRangeAndText } from '../testkit/text.spec';
import { TestDocuments } from '../lsp-testkit/test-documents';

function createExpectedDiagnosis(range: Range, message: string, source = 'stylable', code?: string): Diagnostic {
    return Diagnostic.create(range, message, 2, code, source);
}

function trimLiteral(content: TemplateStringsArray, ...keys: string[]): string {
    if (keys.length) {
        throw new Error('No support for expressions in pipe-delimited test files yet');
    }
    return content
        .join('\n')
        .replace(/^\s*\|/gm, '')
        .replace(/^\n/, '');
}

// duplicate from language-service completion-providers
export class ProviderPosition {
    constructor(public line: number, public character: number) {}
}
export class ProviderRange {
    constructor(public start: ProviderPosition, public end: ProviderPosition) {}
}
export function createRange(startLine: number, startPos: number, endline: number, endPos: number): ProviderRange {
    return new ProviderRange(new ProviderPosition(startLine, startPos), new ProviderPosition(endline, endPos));
}

describe('Service component test', () => {
    let testCon: TestConnection;

    beforeEach(() => {
        testCon = new TestConnection();
        testCon.listen();
    });

    describe('Diagnostics', () => {
        it(
            'Diagnostics - single file error',
            plan(1, () => {
                const rangeAndText = getRangeAndText('|.gaga .root{}|');
                const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
                const baseFileName = '/base-file.st.css';
                const baseTextDocument = TextDocument.create(
                    URI.file(baseFileName).toString(),
                    'stylable',
                    0,
                    rangeAndText.text
                );
                const expectedDiagnostics = [
                    createExpectedDiagnosis(
                        rangeAndText.range,
                        '".root" class cannot be used after native elements or selectors external to the stylesheet'
                    ),
                ];

                const memFs = createMemoryFs({ [baseFileName]: rangeAndText.text });
                const { requireModule } = createCjsModuleSystem({ fs: memFs });
                const stylableLSP = new VSCodeStylableLanguageService(
                    connection,
                    new TestDocuments({
                        [baseTextDocument.uri]: baseTextDocument,
                    }),
                    memFs,
                    new Stylable('/', memFs, requireModule)
                );

                const diagnostics = stylableLSP.diagnoseWithVsCodeConfig();
                expect(diagnostics).to.deep.equal(expectedDiagnostics);
            })
        );

        xit(
            'Diagnostics - cross-file errors',
            plan(1, () => {
                const baseFilecContent = trimLiteral`
            |.gaga {
            |    -st-states: aState
            |}
            `;
                const topFileContent = trimLiteral`
            |:import {
            |    -st-from: "./base-file.st.css";
            |    -st-named: gaga;
            |}
            |
            |.root .gaga:aState:bState {
            |    color: red;
            |}
            `;
                const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
                const baseFileName = '/base-file.st.css';
                const topFileName = '/top-file.st.css';
                const baseTextDocument = TextDocument.create(
                    URI.file(baseFileName).toString(),
                    'stylable',
                    0,
                    baseFilecContent
                );
                const topTextDocument = TextDocument.create(
                    URI.file(topFileName).toString(),
                    'stylable',
                    0,
                    topFileContent
                );
                const expectedDiagnostics = [
                    createExpectedDiagnosis(createRange(5, 19, 5, 25), 'unknown pseudo-state "bState"'),
                ];

                const memFs = createMemoryFs({ [baseFileName]: baseFilecContent, [topFileName]: topFileContent });
                const { requireModule } = createCjsModuleSystem({ fs: memFs });

                const stylableLSP = new VSCodeStylableLanguageService(
                    connection,
                    new TestDocuments({
                        [baseTextDocument.uri]: baseTextDocument,
                        [topTextDocument.uri]: topTextDocument,
                    }),
                    memFs,
                    new Stylable('/', memFs, requireModule)
                );

                const diagnostics = stylableLSP.diagnoseWithVsCodeConfig();
                expect(diagnostics).to.deep.equal(expectedDiagnostics);
            })
        );

        it(
            'Diagnostics - CSS errors',
            plan(1, () => {
                const baseFilecContent = trimLiteral`
            |:vars {
            |  varvar: binks;
            |}
            |.gaga:aState {
            |  color: red;
            |  colorr: reddish;
            |}
            |.root {
            |  -st-states: someState(string);
            |}
            |.root:someState(T1) { /* css-identifierexpected */
            |
            |}
            |.root:someState(T1.1) { /* css-rparentexpected */
            |
            |}
            `;

                const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
                const baseFileName = '/base-file.st.css';
                const baseTextDocument = TextDocument.create(
                    URI.file(baseFileName).toString(),
                    'stylable',
                    0,
                    baseFilecContent
                );
                const expectedDiagnostics = [
                    // CSS diagnostics that shouldn't appear:
                    // empty ruleset, unknown property 'varavar', css-rparentexpected, css-identifierexpected
                    createExpectedDiagnosis(createRange(3, 6, 3, 12), 'unknown pseudo-state "aState"'),
                    createExpectedDiagnosis(
                        createRange(5, 2, 5, 8),
                        "Unknown property: 'colorr'",
                        'css',
                        'unknownProperties'
                    ),
                ];

                const memFs = createMemoryFs({ [baseFileName]: baseFilecContent });
                const { requireModule } = createCjsModuleSystem({ fs: memFs });

                const stylableLSP = new VSCodeStylableLanguageService(
                    connection,
                    new TestDocuments({
                        [baseTextDocument.uri]: baseTextDocument,
                    }),
                    memFs,
                    new Stylable('/', memFs, requireModule)
                );

                const diagnostics = stylableLSP.diagnoseWithVsCodeConfig();
                expect(diagnostics).to.deep.equal(expectedDiagnostics);
            })
        );
    });

    describe('Formatting', () => {
        it(
            'entire file',
            plan(1, () => {
                const { range, text } = getRangeAndText('|.root{color:red}|');
                const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
                const baseFileName = '/base-file.st.css';
                const textDocument = TextDocument.create(URI.file(baseFileName).toString(), 'stylable', 0, text);

                const memFs = createMemoryFs({ [baseFileName]: text });
                const { requireModule } = createCjsModuleSystem({ fs: memFs });
                const stylableLSP = new VSCodeStylableLanguageService(
                    connection,
                    new TestDocuments({
                        [textDocument.uri]: textDocument,
                    }),
                    memFs,
                    new Stylable('/', memFs, requireModule)
                );
                const expectedFormatting: TextEdit[] = [
                    {
                        newText: '.root {\n  color: red\n}',
                        range: range,
                    },
                ];

                const formatting = stylableLSP.onDocumentFormatting({
                    textDocument,
                    options: { insertSpaces: true, tabSize: 2 },
                });

                expect(formatting).to.deep.equal(expectedFormatting);
            })
        );
        it(
            'specific range',
            plan(1, () => {
                const { range, text } = getRangeAndText('.root{color|:        red|}');
                const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
                const baseFileName = '/base-file.st.css';
                const textDocument = TextDocument.create(URI.file(baseFileName).toString(), 'stylable', 0, text);

                const memFs = createMemoryFs({ [baseFileName]: text });
                const { requireModule } = createCjsModuleSystem({ fs: memFs });
                const stylableLSP = new VSCodeStylableLanguageService(
                    connection,
                    new TestDocuments({
                        [textDocument.uri]: textDocument,
                    }),
                    memFs,
                    new Stylable('/', memFs, requireModule)
                );
                const expectedFormatting: TextEdit[] = [
                    {
                        newText: ': red',
                        range,
                    },
                ];

                const formatting = stylableLSP.onDocumentRangeFormatting({
                    textDocument,
                    range,
                    options: { insertSpaces: true, tabSize: 2 },
                });

                expect(formatting).to.deep.equal(expectedFormatting);
            })
        );
    });

    xit(
        'Document Colors - local, vars, imported',
        plan(2, () => {
            const baseFilecContent = trimLiteral`
        |:vars {
        |    myColor: rgba(0, 255, 0, 0.8);
        |}
        |
        |.root {
        |    color: value(myColor);
        |}
        `;

            const importFileContent = trimLiteral`
        |:import {
        |    -st-from: "./single-file-color.st.css";
        |    -st-named: myColor;
        |}
        `;

            const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
            const baseFileName = '/single-file-color.st.css';
            const importFileName = '/import-color.st.css';
            const baseFileUri = URI.file(baseFileName).toString();
            const importedFileUri = URI.file(importFileName).toString();

            const baseTextDocument = TextDocument.create(baseFileUri, 'stylable', 0, baseFilecContent);
            const importTextDocument = TextDocument.create(importedFileUri, 'stylable', 0, importFileContent);

            const range1 = createRange(5, 11, 5, 24);
            const range2 = createRange(1, 13, 1, 33);
            const range3 = createRange(2, 15, 2, 22);
            const color: Color = { red: 0, green: 1, blue: 0, alpha: 0.8 };

            const memFs = createMemoryFs({ [baseFileName]: baseFilecContent, [importFileName]: importFileContent });
            const { requireModule } = createCjsModuleSystem({ fs: memFs });

            const stylableLSP = new VSCodeStylableLanguageService(
                connection,
                new TestDocuments({
                    [baseTextDocument.uri]: baseTextDocument,
                    [importTextDocument.uri]: importTextDocument,
                }),
                memFs,
                new Stylable('/', memFs, requireModule)
            );

            const docColors = stylableLSP.onDocumentColor({ textDocument: { uri: baseFileUri } });
            const importDocColors = stylableLSP.onDocumentColor({ textDocument: { uri: importedFileUri } });

            expect(docColors).to.eql([
                {
                    range: range1,
                    color,
                },
                {
                    range: range2,
                    color,
                },
            ]);

            expect(importDocColors).to.eql([
                {
                    range: range3,
                    color,
                },
            ]);
        })
    );

    xdescribe('References', () => {
        it(
            'References - local file',
            plan(3, () => {
                const fileText = trimLiteral`
                |  .gaga {
                |   -st-states: active;
                |    color: red;
                |}
                |
                |.gaga:active .gaga {
                |    background-color: fuchsia;
                |}
                |
                |.lokal {
                |    -st-extends:      gaga;
                |}
                |
                |.mixed {
                |    -st-mixin: lokal,
                |    gaga, lokal,
                |    gaga;
                |}`;

                const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
                const filePath = '/references.st.css';
                const textDocument = TextDocument.create(URI.file(filePath).toString(), 'stylable', 0, fileText);
                const memFs = createMemoryFs({ [filePath]: fileText });
                const { requireModule } = createCjsModuleSystem({ fs: memFs });

                const stylableLSP = new VSCodeStylableLanguageService(
                    connection,
                    new TestDocuments({
                        [textDocument.uri]: textDocument,
                    }),
                    memFs,
                    new Stylable('/', memFs, requireModule)
                );

                const context = { includeDeclaration: true };
                const refsInSelector = stylableLSP.onReferences({
                    context,
                    position: { line: 5, character: 16 },
                    textDocument,
                });
                const refsInMixin = stylableLSP.onReferences({
                    context,
                    position: { line: 10, character: 25 },
                    textDocument,
                });
                const refsInExtends = stylableLSP.onReferences({
                    context,
                    position: { line: 15, character: 6 },
                    textDocument,
                });

                const expectedRefs = [
                    // Refs should be listed in the order they appear in the file
                    Location.create(textDocument.uri, createRange(0, 3, 0, 7)),
                    Location.create(textDocument.uri, createRange(5, 1, 5, 5)),
                    Location.create(textDocument.uri, createRange(5, 14, 5, 18)),
                    Location.create(textDocument.uri, createRange(10, 22, 10, 26)),
                    Location.create(textDocument.uri, createRange(15, 4, 15, 8)),
                    Location.create(textDocument.uri, createRange(16, 4, 16, 8)),
                ];

                expect(refsInSelector).to.eql(expectedRefs);
                expect(refsInMixin).to.eql(expectedRefs);
                expect(refsInExtends).to.eql(expectedRefs);
            })
        );

        // xit(
        //     'References - cross-file',
        //     plan(4, async () => {
        //         // Not implemented yet
        //         const topFileText = trimLiteral`
        //     |:import {
        //     |    -st-from: "./import.st.css";
        //     |    -st-named: gaga;
        //     |}
        //     |
        //     |.baga {
        //     |    -st-extends: gaga;
        //     |    background-color: goldenrod;
        //     |}`;

        //         const baseFileText = trimLiteral`
        //     |.gaga {
        //     |    -st-states: aState
        //     |}
        //     |
        //     |.gaga:aState {
        //     |    color:blue;
        //     |    mask: lala
        //     |}
        //     `;

        //         const connection = createConnection(
        //             new IPCMessageReader(process),
        //             new IPCMessageWriter(process)
        //         );
        //         const baseFileName = 'import.st.css';
        //         const topFileName = 'top.st.css';
        //         const memFs = createMemoryFs({ [baseFileName]: baseFileText, [topFileName]: topFileText });
        //         const { requireModule } = createCjsModuleSystem({ fs: memFs });

        //         const stylableLSP = new VscodeStylableLanguageService(
        //             connection,
        //             new TextDocuments(),
        //             memFs,
        //             new Stylable('/', memFs, requireModule)
        //         );

        //         // const stylableLSP = new StylableLanguageService({
        //         //     fs: fileSystem,
        //         //     requireModule: require,
        //         //     rootPath: '/',
        //         //     textDocuments: new TextDocuments()
        //         // });
        //         // connect(stylableLSP, testCon.server);

        //         const context = { includeDeclaration: true };
        //         const baseTextDocument = TextDocument.create(
        //             URI.file('/' + baseFileName).toString(),
        //             'stylable',
        //             0,
        //             memFs.readFileSync(baseFileName, 'utf8')
        //         );
        //         const topTextDocument = TextDocument.create(
        //             URI.file('/' + topFileName).toString(),
        //             'stylable',
        //             0,
        //             memFs.readFileSync(topFileName, 'utf8')
        //         );

        //         const refRequests: ReferenceParams[] = [
        //             { context, textDocument: baseTextDocument, position: { line: 0, character: 3 } },
        //             { context, textDocument: baseTextDocument, position: { line: 4, character: 2 } },
        //             { context, textDocument: topTextDocument, position: { line: 2, character: 18 } },
        //             { context, textDocument: topTextDocument, position: { line: 6, character: 20 } }
        //         ];

        //         const expectedRefs = [
        //             // Refs should be listed in the order they appear in each file, current file first.
        //             Location.create(baseTextDocument.uri, createRange(0, 1, 0, 5)),
        //             Location.create(baseTextDocument.uri, createRange(4, 1, 4, 5)),
        //             Location.create(topTextDocument.uri, createRange(2, 15, 2, 19)),
        //             Location.create(topTextDocument.uri, createRange(6, 17, 6, 21))
        //         ];

        //         refRequests.forEach(async refReq => {
        //             const actualRefs = await testCon.client.references({
        //                 context,
        //                 textDocument: refReq.textDocument,
        //                 position: refReq.position
        //             });
        //             expect(actualRefs).to.eql(expectedRefs);
        //         });
        //     })
        // );
    });

    // xit(
    //     'Rename Symbol - local file',
    //     plan(3, async () => {
    //         const fileText = trimLiteral`
    //         |  .gaga {
    //         |    -st-states: active;
    //         |    color: red;
    //         |}
    //         |
    //         |.gaga:active .gaga {
    //         |    background-color: fuchsia;
    //         |}
    //         |
    //         |.lokal {
    //         |    -st-extends:      gaga;
    //         |}
    //         |
    //         |.mixed {
    //         |    -st-mixin: lokal,
    //         |    gaga, lokal,
    //         |    gaga;
    //         |}`;

    //         const fileName = 'references.st.css';
    //         const fileSystem = createMemoryFs({ [fileName]: fileText });

    //         const stylableLSP = new StylableLanguageService({
    //             fs: fileSystem,
    //             requireModule: require,
    //             rootPath: '/',
    //             textDocuments: new TextDocuments()
    //         });
    //         connect(stylableLSP, testCon.server);

    //         const context = { includeDeclaration: true };
    //         const textDocument = TextDocumentItem.create(
    //             URI.file('/' + fileName).toString(),
    //             'stylable',
    //             0,
    //             fileSystem.readFileSync(fileName, 'utf8')
    //         );
    //         const refsInSelector = await testCon.client.references({
    //             context,
    //             textDocument,
    //             position: { line: 5, character: 16 }
    //         });
    //         const refsInMixin = await testCon.client.references({
    //             context,
    //             textDocument,
    //             position: { line: 10, character: 25 }
    //         });
    //         const refsInExtends = await testCon.client.references({
    //             context,
    //             textDocument,
    //             position: { line: 15, character: 6 }
    //         });
    //         const expectedRefs = [
    //             // Refs should be listed in the order they appear in the file
    //             Location.create(textDocument.uri, createRange(0, 3, 0, 7)),
    //             Location.create(textDocument.uri, createRange(5, 1, 5, 5)),
    //             Location.create(textDocument.uri, createRange(5, 14, 5, 18)),
    //             Location.create(textDocument.uri, createRange(10, 22, 10, 26)),
    //             Location.create(textDocument.uri, createRange(15, 4, 15, 8)),
    //             Location.create(textDocument.uri, createRange(16, 4, 16, 8))
    //         ];

    //         expect(refsInSelector).to.eql(expectedRefs);
    //         expect(refsInMixin).to.eql(expectedRefs);
    //         expect(refsInExtends).to.eql(expectedRefs);
    //     })
    // );

    // xit(
    //     'Definitions - element',
    //     plan(5, async () => {
    //         // File system issue
    //         const topFileText = trimLiteral`
    //     |:import {
    //     |    -st-from: "./import.st.css";
    //     |    -st-named: momo;
    //     |}
    //     |
    //     |.local {
    //     |    -st-extends: momo;
    //     |}
    //     |
    //     |.local:momo {
    //     |    color: blue;
    //     |}`;

    //         const importFileText = trimLiteral`
    //     |.shlomo {
    //     |    color: black;
    //     |}
    //     |
    //     |.momo {
    //     |    -st-states: anotherState,oneMoreState;
    //     |}
    //     |
    //     |.root .momo {
    //     |    color: goldenrod;
    //     |}
    //     `;
    //         const topFileName = 'top.st.css';
    //         const importFileName = 'import.st.css';
    //         const fileSystem = createMemoryFs({ [topFileName]: topFileText, [importFileName]: importFileText });
    //         const topTextDocument = TextDocumentItem.create(
    //             URI.file('/' + topFileName).toString(),
    //             'stylable',
    //             0,
    //             topFileText
    //         );
    //         const importTextDocument = TextDocumentItem.create(
    //             URI.file('/' + importFileName).toString(),
    //             'stylable',
    //             0,
    //             importFileText
    //         );
    //         const topFileLocations = [
    //             { line: 2, character: 17 },
    //             { line: 6, character: 18 },
    //             { line: 9, character: 7 }
    //         ];
    //         const importFileLocations = [
    //             { line: 4, character: 3 },
    //             { line: 8, character: 10 }
    //         ];

    //         const stylableLSP = new StylableLanguageService({
    //             fs: fileSystem,
    //             requireModule: require,
    //             rootPath: '/',
    //             textDocuments: new TextDocuments()
    //         });
    //         connect(stylableLSP, testCon.server);

    //         topFileLocations.forEach(async loc => {
    //             const def = await testCon.client.definition({ position: loc, textDocument: topTextDocument });
    //             expect(def).to.eql([
    //                 {
    //                     uri: importTextDocument.uri,
    //                     range: createRange(4, 1, 4, 5)
    //                 }
    //             ]);
    //         });
    //         importFileLocations.forEach(async loc => {
    //             const def = await testCon.client.definition({ position: loc, textDocument: importTextDocument });
    //             expect(def).to.eql([
    //                 {
    //                     uri: importTextDocument.uri,
    //                     range: createRange(4, 1, 4, 5)
    //                 }
    //             ]);
    //         });
    //     })
    // );
});
