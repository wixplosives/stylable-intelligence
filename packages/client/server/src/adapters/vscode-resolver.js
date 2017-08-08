'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var provider_1 = require("../provider");
var stylable_1 = require("stylable");
var _ = require("lodash");
var path = require("path");
var fs = require("fs");
var provider = new provider_1.default();
var VsCodeResolver = (function (_super) {
    tslib_1.__extends(VsCodeResolver, _super);
    function VsCodeResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VsCodeResolver.prototype.resolveModule = function (filePath) {
        var globalPath = path.resolve(path.parse(this.st.source).dir, filePath);
        return _super.prototype.resolveModule.call(this, globalPath);
    };
    VsCodeResolver.prototype.resolveDependencies = function (stylesheet) {
        var _this = this;
        stylesheet.imports.map(function (importNode) {
            var globalPath = path.resolve(path.parse(stylesheet.source).dir, importNode.from);
            var txt = fs.readFileSync(globalPath).toString();
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