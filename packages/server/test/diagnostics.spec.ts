import {createDiagnosis} from '../src/diagnosis'
import { TextDocument } from 'vscode-languageserver-types/lib/main'
import {expect} from 'chai'

describe('diagnostics', function () {
    it('should create basic diagnostics', function(){
        let textDoc = TextDocument.create('file://' , 'css', 0, '.gaga .root{}')
        let diagnostics = createDiagnosis(textDoc)
        expect(diagnostics).to.deep.include({
            "range":{
                "start":{"line":1, "character":1},
                "end": {"line":1, "character":13}
            },
            "message":".root class cannot be used after spacing"
        })
    })
})

