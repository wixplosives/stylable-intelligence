import {TestConnection} from "../lsp-testkit/connection.spec";
import {expect, plan} from "../testkit/chai.spec";
import {init} from "../../src/lib/server-utils";
import {MemoryFileSystem} from "kissfs";
import {toVscodePath} from "../../src/lib/utils/uri-utils";
import {TextDocumentItem} from "vscode-languageserver-protocol"
import {getRangeAndText} from "../testkit/text.spec";
import {Diagnostic, Range} from 'vscode-languageserver-types';

function createDiagnosisNotification(range: Range, message: string, fileName: string) {
    return {
        diagnostics: [Diagnostic.create(range, message, 2, undefined, 'stylable')],
        uri: toVscodePath('/' + fileName)
    };
}

describe("Service component test", function () {
    let testCon: TestConnection;
    beforeEach(() => {
        testCon = new TestConnection();
        testCon.listen();
    });

    it("should support single file error", plan(1, () => {
        const rangeAndText = getRangeAndText('|.gaga .root{}|');
        const fileName = 'single-file-diag.st.css';
        const fileSystem = new MemoryFileSystem('', {content: {[fileName]: rangeAndText.text}});

        testCon.client.onDiagnostics(d => {
            expect(d).to.eql(createDiagnosisNotification(rangeAndText.range, ".root class cannot be used after spacing", fileName));
        });

        init(fileSystem, testCon.server);
        const textDocument = TextDocumentItem.create(toVscodePath('/' + fileName), '', 0, fileSystem.loadTextFileSync(fileName));
        testCon.client.didOpenTextDocument({textDocument});
    }));
});
