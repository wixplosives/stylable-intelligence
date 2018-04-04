import {TestConnection} from "../lsp-testkit/connection.spec";
import {expect, plan} from "../testkit/chai.spec";
import {init} from "../../src/lib/server-utils";
import {MemoryFileSystem} from "kissfs";
import {toVscodePath} from "../../src/lib/utils/uri-utils";
import {TextDocumentItem} from "vscode-languageserver-protocol"

describe.only("Service component test", function () {
    let testCon: TestConnection;
    beforeEach(() => {
        testCon = new TestConnection();
        testCon.listen();
    });
    it("diagnostics", plan(1, () => {
        testCon.client.onDiagnostics(d => {
            expect(d).to.eql({});
        });
        const fileSystem = new MemoryFileSystem('', {
            content: {
                'single-file-diag.st.css': '.gaga .root{}'
            }
        });
        init(fileSystem, testCon.server);
        const textDocument = TextDocumentItem.create(toVscodePath('single-file-diag.st.css'), '', 0, fileSystem.loadTextFileSync('single-file-diag.st.css'));
        testCon.client.didOpenTextDocument({textDocument})
    }));
});
