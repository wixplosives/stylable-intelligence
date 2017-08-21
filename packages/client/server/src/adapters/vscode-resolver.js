'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var stylable_1 = require("stylable");
var _ = require("lodash");
var path = require("path");
var VsCodeResolver = (function (_super) {
    tslib_1.__extends(VsCodeResolver, _super);
    function VsCodeResolver(docs) {
        var _this = _super.call(this, {}) || this;
        _this.docs = docs;
        stylable_1.createGenerator();
        return _this;
    }
    VsCodeResolver.prototype.resolveModule = function (filePath) {
        console.log('RESOLVEMODULE:', filePath);
        var globalPath = path.resolve(path.parse(this.st.source).dir, filePath);
        this.add(globalPath, this.docs.get(globalPath).getText());
        return _super.prototype.resolveModule.call(this, globalPath);
    };
    VsCodeResolver.prototype.resolveDependencies = function (meta) {
        var _this = this;
        meta.imports.map(function (importNode) {
            var globalPath = path.parse(meta.source).dir + importNode.from.slice(1);
            var txt = _this.docs.get(globalPath).getText();
            if (_.endsWith(importNode.from, '.css')) {
                _this.add(globalPath, fromCSS(txt));
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
}(Resolver));
exports.VsCodeResolver = VsCodeResolver;
//# sourceMappingURL=vscode-resolver.js.map