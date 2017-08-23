"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var diagnosis_1 = require("../src/diagnosis");
var main_1 = require("vscode-languageserver-types/lib/main");
var chai_1 = require("chai");
describe('diagnostics', function () {
    it('should create basic diagnostics', function () {
        var textDoc = main_1.TextDocument.create('file://', 'css', 0, '.gaga .root{}');
        var diagnostics = diagnosis_1.createDiagnosis(textDoc);
        chai_1.expect(diagnostics).to.deep.include({
            "range": {
                "start": { "line": 1, "character": 1 },
                "end": { "line": 1, "character": 13 }
            },
            "message": ".root class cannot be used after spacing"
        });
    });
});
//# sourceMappingURL=diagnostics.spec.js.map