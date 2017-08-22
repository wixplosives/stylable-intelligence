"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var fs = require("fs");
var path = require("path");
var vscode_languageserver_types_1 = require("vscode-languageserver-types");
var vscode_resolver_1 = require("../src/adapters/vscode-resolver");
var provider_1 = require("../src/provider");
function assertCompletions(actualCompletions, expectedCompletions, prefix) {
    if (prefix === void 0) { prefix = ''; }
    expectedCompletions.forEach(function (expected) {
        var actual = actualCompletions.find(function (comp) { return comp.label === expected.label; });
        chai_1.expect(actual, prefix + 'completion not found: ' + expected.label + ' ').to.not.be.equal(undefined);
        if (actual) {
            for (var field in expected) {
                var actualVal = actual[field];
                if (actualVal instanceof provider_1.snippet) {
                    actualVal = actualVal.source;
                }
                var expectedVal = expected[field];
                chai_1.expect(actualVal, actual.label + ":" + field).to.equal(expectedVal);
            }
        }
    });
}
function assertNoCompletions(actualCompletions, nonCompletions, prefix) {
    if (prefix === void 0) { prefix = ''; }
    nonCompletions.forEach(function (notAllowed) {
        var actual = actualCompletions.find(function (comp) { return comp.label === notAllowed.label; });
        chai_1.expect(actual, prefix + 'unallowed completion found: ' + notAllowed.label + ' ').to.be.equal(undefined);
    });
}
function getCompletions(fileName, checkSingleLine) {
    if (checkSingleLine === void 0) { checkSingleLine = false; }
    var fullPath = path.join(__dirname, '/../test/cases/', fileName);
    var src = fs.readFileSync(fullPath).toString();
    var singleLineSrc = src.split('\n').join('');
    var normalCompletions;
    return completionsIntenal(fullPath, src)
        .then(function (completions) { normalCompletions = completions; })
        .then(function () { return checkSingleLine ? completionsIntenal(fullPath, singleLineSrc) : Promise.resolve(null); })
        .then(function (singleLineCompletions) {
        return {
            suggested: function (expectedNoCompletions) {
                assertCompletions(normalCompletions, expectedNoCompletions);
                singleLineCompletions && assertCompletions(singleLineCompletions, expectedNoCompletions, 'single line: ');
            },
            notSuggested: function (expectedNoCompletions) {
                assertNoCompletions(normalCompletions, expectedNoCompletions);
                singleLineCompletions && assertNoCompletions(singleLineCompletions, expectedNoCompletions, 'single line: ');
            }
        };
    });
}
exports.getCompletions = getCompletions;
function completionsIntenal(fileName, src) {
    var caretPos = src.indexOf('|');
    var linesTillCaret = src.substr(0, caretPos).split('\n');
    var character = linesTillCaret[linesTillCaret.length - 1].length;
    src = src.replace('|', "");
    var resolver = new vscode_resolver_1.VsCodeResolver({
        get: function (uri) {
            return vscode_languageserver_types_1.TextDocument.create(uri, 'css', 1, fs.readFileSync(uri).toString());
        },
        keys: function () {
            return fs.readdirSync(path.join(__dirname, '../test/cases/imports/'));
        }
    });
    var provider = new provider_1.default(resolver);
    return provider.provideCompletionItemsFromSrc(src, {
        line: linesTillCaret.length - 1,
        character: character
    }, fileName);
}
exports.importCompletion = { label: ':import', detail: 'Import an external library', sortText: 'a', insertText: ':import {\n\t-st-from: "$1";\n}$0' };
exports.varsCompletion = { label: ':vars', detail: 'Declare variables', sortText: 'a', insertText: ':vars {\n\t$1\n}$0' };
exports.rootCompletion = { label: '.root', detail: 'The root class', sortText: 'b', insertText: '.root' };
exports.statesDirectiveCompletion = { label: '-st-states:', detail: 'Define the CSS states available for this class', sortText: 'a', insertText: '-st-states: $1;' };
exports.extendsDirectiveCompletion = { label: '-st-extends:', detail: 'Extend an external component', sortText: 'a', insertText: '-st-extends: $1;', additionalCompletions: true };
exports.mixinDirectiveCompletion = { label: '-st-mixin:', detail: 'Apply mixins on the class', sortText: 'a', insertText: '-st-mixin: $1;' };
exports.variantDirectiveCompletion = { label: '-st-variant:', detail: '', sortText: 'a', insertText: '-st-variant: true;' };
exports.importFromDirectiveCompletion = { label: '-st-from:', detail: 'Path to library', sortText: 'a', insertText: '-st-from: "$1";' };
exports.importDefaultDirectiveCompletion = { label: '-st-default:', detail: 'Default object export name', sortText: 'a', insertText: '-st-default: $1;' };
exports.importNamedDirectiveCompletion = { label: '-st-named:', detail: 'Named object export name', sortText: 'a', insertText: '-st-named: $1;' };
exports.filePathCompletion = function (filePath) { return { label: filePath, insertText: './' + filePath }; };
exports.classCompletion = function (className) { return { label: '.' + className, sortText: 'b' }; };
exports.stateCompletion = function (stateName, from) {
    if (from === void 0) { from = 'projectRoot/main.css'; }
    return { label: ':' + stateName, sortText: 'a', detail: 'from: ' + path.join(__dirname, '/../test/cases/', from), insertText: ':' + stateName };
};
exports.extendsCompletion = function (typeName, range) { return { label: typeName, sortText: 'a', insertText: ' ' + typeName + ';\n', range: range }; };
//# sourceMappingURL=asserters.js.map