"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stylable = require("stylable");
function createDiagnosis(doc) {
    var docPostCSSRoot = stylable.safeParse(doc.getText(), { from: doc.uri });
    var stylableDiagnostics = new stylable.Diagnostics();
    stylable.process(docPostCSSRoot, stylableDiagnostics);
    console.log(JSON.stringify(stylableDiagnostics));
    return [];
}
exports.createDiagnosis = createDiagnosis;
//# sourceMappingURL=diagnosis.js.map