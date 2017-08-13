'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var provider_1 = require("../provider");
var stylable_1 = require("stylable");
var _ = require("lodash");
var path = require("path");
var provider = new provider_1.default();
var VsCodeResolver = (function (_super) {
    tslib_1.__extends(VsCodeResolver, _super);
    function VsCodeResolver(docs) {
        var _this = _super.call(this, {}) || this;
        _this.docs = docs;
        return _this;
    }
    VsCodeResolver.prototype.resolveModule = function (filePath) {
        var globalPath = path.resolve(path.parse(this.st.source).dir, filePath);
        this.add(globalPath, this.docs.get(globalPath).getText());
        return _super.prototype.resolveModule.call(this, globalPath);
    };
    VsCodeResolver.prototype.resolveDependencies = function (stylesheet) {
        var _this = this;
        console.log('Starting resolveDependencies');
        stylesheet.imports.map(function (importNode) {
            console.log('stylesheet.source: ', stylesheet.source);
            console.log('importNode.from: ', importNode.from);
            console.log('parsedPath: ', JSON.stringify(path.parse(stylesheet.source)));
            var globalPath = path.parse(stylesheet.source).dir + importNode.from.slice(1);
            console.log('globalPath: ', globalPath);
            console.log('docs:', _this.docs.keys());
            var txt = _this.docs.get(globalPath).getText();
            if (_.endsWith(importNode.from, '.css')) {
                _this.add(globalPath, stylable_1.fromCSS(txt));
            }
        });
        return Promise.resolve();
    };
    ;
    VsCodeResolver.prototype.resolveSymbols = function (s) {
        this.st = s;
        return _super.prototype.resolveSymbols.call(this, s);
    };
    VsCodeResolver.prototype.getFolderContents = function (path) {
        var res = [];
        return Promise.resolve(res);
    };
    return VsCodeResolver;
}(stylable_1.Resolver));
exports.VsCodeResolver = VsCodeResolver;
//# sourceMappingURL=vscode-resolver.js.map