"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("vscode-languageserver-types/lib/main");
var path = require("path");
var stylable_1 = require("stylable");
function createDiagnosis(doc) {
    var docPostCSSRoot = stylable_1.safeParse(doc.getText(), { from: path.resolve(doc.uri) });
    var stylableDiagnostics = new stylable_1.Diagnostics();
    stylable_1.process(docPostCSSRoot, stylableDiagnostics);
    return stylableDiagnostics.reports.map(reportToDiagnostic);
}
exports.createDiagnosis = createDiagnosis;
//stylable diagnostic to vscode diagnostic
function reportToDiagnostic(report) {
    var range = createRange(report.node.source);
    return main_1.Diagnostic.create(range, report.message);
}
function createRange(source) {
    return main_1.Range.create({
        line: source.start.line,
        character: source.start.column
    }, {
        line: source.end.line,
        character: source.end.column
    });
}
//# sourceMappingURL=diagnosis.js.map