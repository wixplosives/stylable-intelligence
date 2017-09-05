import {expect} from 'chai'
import {TextDocument} from 'vscode-languageserver-types/lib/main'
import {TextDocuments} from "vscode-languageserver/lib/main";
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
    xit('should create basic diagnostics', function(){
        let filePath = 'style.css'

        let diagnostics = createDiagnostics({
            [filePath]:'.gaga .root{}'
        }, filePath)

        return expect(diagnostics).to.deep.include({
            "range":{
                "start":{"line":1, "character":1},
                "end": {"line":1, "character":13}
            },
            "message":".root class cannot be used after spacing",
            "severity":2
        })
    })
    //TODO: integrate once stylable has cross files erros
    //
    xit('should create cross file errors', function() {
        let filePathA = 'style.css'
        let filePathB = 'import-style.css'

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

