import {expect} from 'chai'
import {TextDocument} from 'vscode-languageserver-types'
import {TextDocuments, Command,Location, Position, Range, TextEdit,CompletionItem,ParameterInformation,Diagnostic} from "vscode-languageserver";
import {createDiagnosis} from '../../src/lib/diagnosis'
import {createProcessor} from '../../src/lib/provider-factory'
import { LocalSyncFs } from '../../src/lib/local-sync-fs';
import { createDocFs } from '../../src/lib/server-utils';

function createDiagnostics(files:{[filePath:string]:string}, path:string) {
    const docs:{[path:string]:TextDocument} = {}
    Object.keys(files).reduce((prev, path:string) => {
        prev[path] = TextDocument.create(path, 'css', 0, files[path])
        return prev
    }, docs)

    const documents: TextDocuments = {
        get:(filePath) => {
            return docs[filePath]
        },
        keys: () => {
            return Object.keys(docs)
        }
    } as TextDocuments
    const fs =  new LocalSyncFs('');
    const docsFs = createDocFs(fs,documents);
    return createDiagnosis(documents.get(path),  docsFs, createProcessor(docsFs, true), require)
}


describe('diagnostics', function () {
    it('should create basic diagnostics', function(){
        let filePath = 'style.st.css'

        let diagnostics = createDiagnostics({
            [filePath]:'.gaga .root{}'
        }, filePath)

        expect(diagnostics).to.deep.include({
            "range":{
                "start":{"line":0, "character":0},
                "end": {"line":0, "character":13}
            },
            "message":".root class cannot be used after spacing",
            "severity":2
        })
    })

    it('should create cross file errors', function() {
        let filePathA = 'style.css'
        let filePathB = 'import-style.st.css'

        let diagnostics = createDiagnostics({
            [filePathA]: ``,
            [filePathB]: `
                        :import {
                            -st-from: ${filePathA};
                            -st-named: ninja;
                        }

                        .ninja{}
                        `

        }, filePathB)
        expect(diagnostics).to.deep.include({
            "range":{
                "start":{"line":3, "character":39},
                "end": {"line":3, "character":44}
            },
            "message":"Trying to import unknown alias",
            "severity":1
        })
    })
})

