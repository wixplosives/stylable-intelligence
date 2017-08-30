import {expect} from 'chai'
import { TextDocument } from 'vscode-languageserver-types/lib/main'
import { TextDocuments } from "vscode-languageserver/lib/main";
import {createDiagnosis} from '../src/diagnosis'
import {createProcessor} from '../src/provider-factory'



function createDiagnostics(files:{[filePath:string]:string}, path:string) {
    const docs:{[path:string]:TextDocument} = {}
    Object.keys(files).reduce((prev, path:string) => {
        prev[path] = TextDocument.create(path, 'css', 0, files[path])
        return prev
    }, docs)

    const documents: TextDocuments = {
        get:(filePath) => {
            return docs[filePath]
        }
    } as TextDocuments

    return createDiagnosis(documents.get(path), createProcessor(documents, false))
}


describe('diagnostics', function () {
    it('should create basic diagnostics', function(){
        let fileName = '/some-file.css'

        let diagnostics = createDiagnostics({
            [fileName]:'.gaga .root{}'
        }, fileName)

        return expect(diagnostics).to.deep.include({
            "range":{
                "start":{"line":1, "character":1},
                "end": {"line":1, "character":13}
            },
            "message":".root class cannot be used after spacing",
            "severity":2
        })
    })
})

