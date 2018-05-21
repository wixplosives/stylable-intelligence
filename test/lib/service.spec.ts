import { TestConnection } from "../lsp-testkit/connection.spec";
import { expect, plan } from "../testkit/chai.spec";
import { init } from "../../src/lib/server-utils";
import { MemoryFileSystem } from "kissfs";
import { toVscodePath } from "../../src/lib/utils/uri-utils";
import { TextDocumentItem, ReferenceParams, TextEdit } from "vscode-languageserver-protocol"
import { getRangeAndText } from "../testkit/text.spec";
import { Diagnostic, Range, Position, Location } from 'vscode-languageserver-types';
import { createRange, ProviderPosition } from '../../src/lib/completion-providers';
import { createColor } from './colors.spec';
import { timingFunctions } from 'polished';
import { toggleLegacy } from '../../src/lib/provider-factory'



function createDiagnosisNotification(diagnostics: Diagnostic[], fileName: string) {
    return {
        diagnostics,
        uri: toVscodePath('/' + fileName)
    };
}

function createDiagnosis(range: Range, message: string, source: string = 'stylable', code?: string): Diagnostic {
    return Diagnostic.create(range, message, 2, code, source);
}

function trimLiteral(content: TemplateStringsArray, ...keys: string[]) {
    if (keys.length) { throw new Error('No support for expressions in pipe-delimited test files yet') };
    return content.join('\n').replace(/^\s*\|/gm, '').replace(/^\n/, '');
}


describe("Service component test", function () {
    let testCon: TestConnection;
    beforeEach(() => {
        toggleLegacy(false);
        testCon = new TestConnection();
        testCon.listen();
    });

    afterEach(() => {
        toggleLegacy(true);
    })

    describe("Diagnostics", function () {
        it("Diagnostics - single file error", plan(2, () => {
            const rangeAndText = getRangeAndText('|.gaga .root{}|');
            const fileName = 'single-file-diag.st.css';
            const fileSystem = new MemoryFileSystem('', { content: { [fileName]: rangeAndText.text } });


            init(fileSystem, testCon.server);
            const textDocument = TextDocumentItem.create(toVscodePath('/' + fileName), 'stylable', 0, fileSystem.loadTextFileSync(fileName));
            testCon.client.didOpenTextDocument({ textDocument });


            testCon.client.onDiagnostics(d => {
                expect(d).to.eql(createDiagnosisNotification([createDiagnosis(rangeAndText.range, ".root class cannot be used after spacing")], fileName));
            });
        }));

        it("Diagnostics - cross-file errors", plan(2, () => {
            const baseFilecContent = trimLiteral`
            |.gaga {
            |    -st-states: aState
            |}
            `
            const topFileContent = trimLiteral`
            |:import {
            |    -st-from: "./base-file.st.css";
            |    -st-named: gaga;
            |}
            |
            |.gaga:aState:bState {
            |    color: red;
            |}
            `

            const baseFileName = 'base-file.st.css';
            const topFileName = 'top-file.st.css';
            const fileSystem = new MemoryFileSystem('', { content: { [baseFileName]: baseFilecContent, [topFileName]: topFileContent } });
            const baseTextDocument = TextDocumentItem.create(toVscodePath('/' + baseFileName), 'stylable', 0, baseFilecContent);
            const topTextDocument = TextDocumentItem.create(toVscodePath('/' + topFileName), 'stylable', 0, topFileContent);

            init(fileSystem, testCon.server);
            testCon.client.didOpenTextDocument({ textDocument: topTextDocument });

            testCon.client.onDiagnostics(d => {
                expect(d).to.eql(createDiagnosisNotification([createDiagnosis(createRange(5, 13, 5, 19), "unknown pseudo-state \"bState\"")], topFileName));
            });

        }));

        it("Diagnostics - CSS errors", plan(2, () => {
            const baseFilecContent = trimLiteral`
            |.root {}
            |
            |:vars {
            |  varvar: binks;
            |}
            |
            |.gaga:aState {
            |  color: red;
            |  colorr: reddish;
            |}
            `

            const baseFileName = 'base-file.st.css';
            const fileSystem = new MemoryFileSystem('', { content: { [baseFileName]: baseFilecContent } });
            const baseTextDocument = TextDocumentItem.create(toVscodePath('/' + baseFileName), 'stylable', 0, baseFilecContent);
            const diags = [ //CSS diagnostics that shouldn't appear: empty ruleset, unknown property 'varavar'
                createDiagnosis(createRange(6, 6, 6, 12), "unknown pseudo-state \"aState\""),
                createDiagnosis(createRange(8, 2, 8, 8), "Unknown property: 'colorr'", "css", "unknownProperties"),
            ]

            init(fileSystem, testCon.server);
            testCon.client.didOpenTextDocument({ textDocument: baseTextDocument });

            testCon.client.onDiagnostics(d => {
                expect(d).to.eql(createDiagnosisNotification(diags, baseFileName));
            });
        }));
    })

    it("Document Colors - local, vars, imported", plan(2, async () => {
        const baseFilecContent = trimLiteral`
        |:vars {
        |    myColor: rgba(0, 255, 0, 0.8);
        |}
        |
        |.root {
        |    color: value(myColor);
        |}
        `

        const importFileContent = trimLiteral`
        |:import {
        |    -st-from: "./single-file-color.st.css";
        |    -st-named: myColor;
        |}
        `

        const baseFileName = 'single-file-color.st.css';
        const importFileName = 'import-color.st.css';
        const fileSystem = new MemoryFileSystem('', { content: { [baseFileName]: baseFilecContent, [importFileName]: importFileContent } });
        const baseTextDocument = TextDocumentItem.create('/' + baseFileName, 'stylable', 0, baseFilecContent);
        const importTextDocument = TextDocumentItem.create('/' + importFileName, 'stylable', 0, importFileContent);

        const range1 = createRange(5, 11, 5, 24);
        const range2 = createRange(1, 13, 1, 33);
        const range3 = createRange(2, 15, 2, 22);
        const color = createColor(0, 1, 0, 0.8);

        init(fileSystem, testCon.server);

        const docColors = await testCon.client.documentColor({ textDocument: baseTextDocument });
        const importDocColors = await testCon.client.documentColor({ textDocument: importTextDocument });

        expect(docColors).to.eql([{
            range: range1,
            color: color
        },
        {
            range: range2,
            color: color
        }]);

        expect(importDocColors).to.eql([{
            range: range3,
            color: color
        }]);
    }));

    describe("References", function () {
        it("References - local file", plan(3, async () => {
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
                |}`

            const fileName = 'references.st.css';
            const fileSystem = new MemoryFileSystem('', { content: { [fileName]: fileText } });

            init(fileSystem, testCon.server);
            const context = { includeDeclaration: true }
            const textDocument = TextDocumentItem.create(toVscodePath('/' + fileName), 'stylable', 0, fileSystem.loadTextFileSync(fileName));
            const refsInSelector = await testCon.client.references({ context, textDocument, position: { line: 5, character: 16 } })
            const refsInMixin = await testCon.client.references({ context, textDocument, position: { line: 10, character: 25 } })
            const refsInExtends = await testCon.client.references({ context, textDocument, position: { line: 15, character: 6 } })
            const expectedRefs = [ //Refs should be listed in the order they appear in the file
                Location.create(textDocument.uri, createRange(0, 3, 0, 7)),
                Location.create(textDocument.uri, createRange(5, 1, 5, 5)),
                Location.create(textDocument.uri, createRange(5, 14, 5, 18)),
                Location.create(textDocument.uri, createRange(10, 22, 10, 26)),
                Location.create(textDocument.uri, createRange(15, 4, 15, 8)),
                Location.create(textDocument.uri, createRange(16, 4, 16, 8))
            ]

            expect(refsInSelector).to.eql(expectedRefs);
            expect(refsInMixin).to.eql(expectedRefs);
            expect(refsInExtends).to.eql(expectedRefs);
        }));

        xit("References - cross-file", plan(4, async () => { //Feature not implemented yet
            const topFileText = trimLiteral`
            |:import {
            |    -st-from: "./import.st.css";
            |    -st-named: gaga;
            |}
            |
            |.baga {
            |    -st-extends: gaga;
            |    background-color: goldenrod;
            |}`

            const baseFileText = trimLiteral`
            |.gaga {
            |    -st-states: aState
            |}
            |
            |.gaga:aState {
            |    color:blue;
            |    mask: lala
            |}
            `

            const baseFileName = 'import.st.css';
            const topFileName = 'top.st.css';
            const fileSystem = new MemoryFileSystem('', { content: { [baseFileName]: baseFileText, [topFileName]: topFileText } });

            init(fileSystem, testCon.server);
            const context = { includeDeclaration: true }
            const baseTextDocument = TextDocumentItem.create(toVscodePath('/' + baseFileName), 'stylable', 0, fileSystem.loadTextFileSync(baseFileName));
            const topTextDocument = TextDocumentItem.create(toVscodePath('/' + topFileName), 'stylable', 0, fileSystem.loadTextFileSync(topFileName));

            const refRequests: ReferenceParams[] = [
                { context, textDocument: baseTextDocument, position: { line: 0, character: 3 } },
                { context, textDocument: baseTextDocument, position: { line: 4, character: 2 } },
                { context, textDocument: topTextDocument, position: { line: 2, character: 18 } },
                { context, textDocument: topTextDocument, position: { line: 6, character: 20 } },
            ]

            const expectedRefs = [ //Refs should be listed in the order they appear in each file, current file first.
                Location.create(baseTextDocument.uri, createRange(0, 1, 0, 5)),
                Location.create(baseTextDocument.uri, createRange(4, 1, 4, 5)),
                Location.create(topTextDocument.uri, createRange(2, 15, 2, 19)),
                Location.create(topTextDocument.uri, createRange(6, 17, 6, 21)),
            ]

            refRequests.forEach(async refReq => {
                const actualRefs = await testCon.client.references({ context, textDocument: refReq.textDocument, position: refReq.position });
                expect(actualRefs).to.eql(expectedRefs);
            })

        }));
    })

    describe("Rename Symbol", function () {
        it.only("Rename Symbol - local file", plan(3, async () => {
            const fileText = trimLiteral`
                |  .gaga {
                |    -st-states: active;
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
                |}`

            const fileName = 'references.st.css';
            const fileSystem = new MemoryFileSystem('', { content: { [fileName]: fileText } });

            init(fileSystem, testCon.server);
            const context = { includeDeclaration: true }
            const textDocument = TextDocumentItem.create(toVscodePath('/' + fileName), 'stylable', 0, fileSystem.loadTextFileSync(fileName));

            const res = await testCon.client.rename({ textDocument, position: { line: 10, character: 24 }, newName: 'abc' })

            expect(res!.changes).to.exist;
            expect(res!.changes![toVscodePath('/' + fileName)]).to.exist;

            const expectedEdits = [ //Edits order inside a file has no meaning. Order is replicated from getRefs functionality.
                TextEdit.replace(createRange(0, 3, 0, 7), 'abc'),
                TextEdit.replace(createRange(5, 1, 5, 5), 'abc'),
                TextEdit.replace(createRange(5, 14, 5, 18), 'abc'),
                TextEdit.replace(createRange(10, 22, 10, 26), 'abc'),
                TextEdit.replace(createRange(15, 4, 15, 8), 'abc'),
                TextEdit.replace(createRange(16, 4, 16, 8), 'abc')
            ]

            expect(res!.changes![toVscodePath('/' + fileName)]).to.eql(expectedEdits);
        }));

        // it("Rename Symbol - cross file", plan(1, async () => { //Feature not implemented yett (uses References mechanism)
        //     const topFileText = trimLiteral`
        //     |:import {
        //     |    -st-from: "./import.st.css";
        //     |    -st-named: gaga;
        //     |}
        //     |
        //     |.baga {
        //     |    -st-extends: gaga;
        //     |    background-color: goldenrod;
        //     |}`

        //     const baseFileText = trimLiteral`
        //     |.gaga {
        //     |    -st-states: aState
        //     |}
        //     |
        //     |.gaga:aState {
        //     |    color:blue;
        //     |    mask: lala
        //     |}
        //     `

        //     const baseFileName = 'import.st.css';
        //     const topFileName = 'top.st.css';
        //     const fileSystem = new MemoryFileSystem('', { content: { [baseFileName]: baseFileText, [topFileName]: topFileText } });

        //     init(fileSystem, testCon.server);
        //     const context = { includeDeclaration: true }
        //     const baseTextDocument = TextDocumentItem.create(toVscodePath('/' + baseFileName), 'stylable', 0, fileSystem.loadTextFileSync(baseFileName));
        //     const topTextDocument = TextDocumentItem.create(toVscodePath('/' + topFileName), 'stylable', 0, fileSystem.loadTextFileSync(topFileName));

        //     const refRequests: ReferenceParams[] = [
        //         { context, textDocument: baseTextDocument, position: { line: 0, character: 3 } },
        //         { context, textDocument: baseTextDocument, position: { line: 4, character: 2 } },
        //         { context, textDocument: topTextDocument, position: { line: 2, character: 18 } },
        //         { context, textDocument: topTextDocument, position: { line: 6, character: 20 } },
        //     ]

        //     const expectedRefs = [ //Refs should be listed in the order they appear in each file, current file first.
        //         Location.create(baseTextDocument.uri, createRange(0, 1, 0, 5)),
        //         Location.create(baseTextDocument.uri, createRange(4, 1, 4, 5)),
        //         Location.create(topTextDocument.uri, createRange(2, 15, 2, 19)),
        //         Location.create(topTextDocument.uri, createRange(6, 17, 6, 21)),
        //     ]

        //     refRequests.forEach(async refReq => {
        //         const actualRefs = await testCon.client.references({ context, textDocument: refReq.textDocument, position: refReq.position });
        //         expect(actualRefs).to.eql(expectedRefs);
        //     })

        // }))
    });


    describe("Definitions", function () {
        it("Definitions - element", plan(5, async () => {
            const topFileText = trimLiteral`
            |:import {
            |    -st-from: "./import.st.css";
            |    -st-named: momo;
            |}
            |
            |.local {
            |    -st-extends: momo;
            |}
            |
            |.local:momo {
            |    color: blue;
            |}`

            const importFileText = trimLiteral`
            |.shlomo {
            |    color: black;
            |}
            |
            |.momo {
            |    -st-states: anotherState,oneMoreState;
            |}
            |
            |.root .momo {
            |    color: goldenrod;
            |}
            `
            const topFileName = 'top.st.css';
            const importFileName = 'import.st.css';
            const fileSystem = new MemoryFileSystem('', { content: { [topFileName]: topFileText, [importFileName]: importFileText } });
            const topTextDocument = TextDocumentItem.create(toVscodePath('/' + topFileName), 'stylable', 0, topFileText);
            const importTextDocument = TextDocumentItem.create(toVscodePath('/' + importFileName), 'stylable', 0, importFileText);
            const topFileLocations = [
                { line: 2, character: 17 },
                { line: 6, character: 18 },
                { line: 9, character: 7 },
            ]
            const importFileLocations = [
                { line: 4, character: 3 },
                { line: 8, character: 10 },
            ]

            init(fileSystem, testCon.server);
            for (const loc of topFileLocations) {
                const def = await testCon.client.definition({ position: loc, textDocument: topTextDocument });
                expect(def).to.eql([{
                    uri: importTextDocument.uri,
                    range: createRange(4, 1, 4, 5)
                }]);

            }
            for (const loc of importFileLocations) {

                const def = await testCon.client.definition({ position: loc, textDocument: importTextDocument });
                expect(def).to.eql([{
                    uri: importTextDocument.uri,
                    range: createRange(4, 1, 4, 5)
                }]);
            }
        }));

        it("Definitions - variable", plan(4, async () => {
            const topFileText = trimLiteral`
            |:import {
            |    -st-from: "./import.st.css";
            |    -st-named: varvar;
            |}
            |
            |.maga {
            |    background-color: value(varvar)
            |}`

            const importFileText = trimLiteral`
            |:vars {
            |    varvar: pink;
            |}
            |
            |.lala {
            |    color: value(varvar);
            |}`
            const topFileName = 'top.st.css';
            const importFileName = 'import.st.css';
            const fileSystem = new MemoryFileSystem('', { content: { [topFileName]: topFileText, [importFileName]: importFileText } });
            const topTextDocument = TextDocumentItem.create(toVscodePath('/' + topFileName), 'stylable', 0, topFileText);
            const importTextDocument = TextDocumentItem.create(toVscodePath('/' + importFileName), 'stylable', 0, importFileText);
            const topFileLocations = [
                { line: 2, character: 17 },
                { line: 6, character: 34 },
            ]
            const importFileLocations = [
                { line: 1, character: 5 },
                { line: 5, character: 22 },
            ]

            init(fileSystem, testCon.server);
            for (const loc of topFileLocations) {
                const def = await testCon.client.definition({ position: loc, textDocument: topTextDocument });
                expect(def).to.eql([{
                    uri: importTextDocument.uri,
                    range: createRange(1, 4, 1, 10)
                }]);

            }
            for (const loc of importFileLocations) {

                const def = await testCon.client.definition({ position: loc, textDocument: importTextDocument });
                expect(def).to.eql([{
                    uri: importTextDocument.uri,
                    range: createRange(1, 4, 1, 10)
                }]);
            }

        }));

        it("Definitions - state", plan(3, async () => {
            const topFileText = trimLiteral`
            |:import {
            |  -st-from: "./import.st.css";
            |  -st-default: Comp;
            |}
            |
            |.maga {
            |  -st-extends: Comp;
            |}
            |
            |.maga:somestate {
            |
            |}`

            const importFileText = trimLiteral`
            |.root {
            |    -st-states: somestate;
            |}
            |
            |.root:somestate {
            |
            |}`
            const topFileName = 'top.st.css';
            const importFileName = 'import.st.css';
            const fileSystem = new MemoryFileSystem('', { content: { [topFileName]: topFileText, [importFileName]: importFileText } });
            const topTextDocument = TextDocumentItem.create(toVscodePath('/' + topFileName), 'stylable', 0, topFileText);
            const importTextDocument = TextDocumentItem.create(toVscodePath('/' + importFileName), 'stylable', 0, importFileText);
            const topFileLocations = [
                { line: 9, character: 6 },
            ]
            const importFileLocations = [
                { line: 1, character: 16 },
                { line: 4, character: 13 },
            ]

            init(fileSystem, testCon.server);
            for (const loc of topFileLocations) {
                const def = await testCon.client.definition({ position: loc, textDocument: topTextDocument });
                expect(def).to.eql([{
                    uri: importTextDocument.uri,
                    range: createRange(0, 1, 0, 5)
                }]);

            }
            for (const loc of importFileLocations) {

                const def = await testCon.client.definition({ position: loc, textDocument: importTextDocument });
                expect(def).to.eql([{
                    uri: importTextDocument.uri,
                    range: createRange(0, 1, 0, 5)
                }]);
            }

        }));

        it("Definitions - custom selector", function () {
            //todo
        });

        it("Definitions - formatters", plan(2, async () => {
            const topFileText = trimLiteral`
            |:import {
            |  -st-from: "./my-js-mixins.js";
            |  -st-named: aFormatter;
            |}
            |
            |.local {
            |  color: aFormatter(red);
            |}`

            const importFileText = trimLiteral`

            |/**
            | * @description A mixin with no params
            | * @summary noParamMixin
            | * baga bgaa
            | * @returns {stCssFrag} lalala
            | * lalala lalala
            | * {@link OOF}
            | */
            |
            |exports.aBareMixin = function () {
            |
            |}
            |
            |/**
            | * @description A formatter with no params
            | * @summary bareFormatter
            | * baga bgaa
            | * @returns {stColor} lalala
            | */
            |
            |exports.aFormatter = function () {
            |
            |}`
            const topFileName = 'top.st.css';
            const importFileName = 'my-js-mixins.js';
            const fileSystem = new MemoryFileSystem('', { content: { [topFileName]: topFileText, [importFileName]: importFileText } });
            const topTextDocument = TextDocumentItem.create(toVscodePath('/' + topFileName), 'stylable', 0, topFileText);
            const importTextDocument = TextDocumentItem.create(toVscodePath('/' + importFileName), 'stylable', 0, importFileText);
            const topFileLocations = [
                { line: 2, character: 13 },
                { line: 6, character: 10 },
            ]

            init(fileSystem, testCon.server);
            for (const loc of topFileLocations) {
                const def = await testCon.client.definition({ position: loc, textDocument: topTextDocument });
                expect(def).to.eql([{
                    uri: importTextDocument.uri,
                    range: createRange(20, 8, 20, 18)
                }]);

            }


        }));

    });
});
