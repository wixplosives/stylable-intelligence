"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var stylable_1 = require("stylable");
var _ = require("lodash");
var vscode_resolver_1 = require("../src/adapters/vscode-resolver");
var path = require("path");
var fs = require("fs");
var TestResolver = (function (_super) {
    tslib_1.__extends(TestResolver, _super);
    function TestResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestResolver.prototype.resolveModule = function (filePath) {
        console.log('filePath: ', filePath);
        console.log('st: ', JSON.stringify(this.st));
        var globalPath = path.resolve(path.parse(this.st.source).dir, filePath);
        this.add(globalPath, fs.readFileSync(globalPath).toString());
        return _super.prototype.resolveModule.call(this, filePath);
    };
    TestResolver.prototype.resolveDependencies = function (stylesheet) {
        var _this = this;
        console.log('Starting Test resolveDependencies');
        stylesheet.imports.map(function (importNode) {
            console.log('stylesheet.source: ', stylesheet.source);
            console.log('importNode.from: ', importNode.from);
            console.log('parsedPath: ', JSON.stringify(path.parse(stylesheet.source)));
            var globalPath = path.parse(stylesheet.source).dir + importNode.from.slice(1);
            console.log('globalPath: ', globalPath);
            // console.log('docs:', this.docs.keys());
            var txt = fs.readFileSync(globalPath).toString();
            if (_.endsWith(importNode.from, '.css')) {
                _this.add(globalPath, stylable_1.fromCSS(txt));
            }
        });
        return Promise.resolve();
        // return Promise.resolve(null).then(()=>{});
    };
    return TestResolver;
}(vscode_resolver_1.VsCodeResolver));
exports.TestResolver = TestResolver;
//# sourceMappingURL=test-resolver.js.map