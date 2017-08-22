'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var stylable_1 = require("stylable");
var VsCodeResolver = (function (_super) {
    tslib_1.__extends(VsCodeResolver, _super);
    function VsCodeResolver(docs) {
        var _this = _super.call(this, stylable_1.cachedProcessFile(function (fullpath, content) {
            return stylable_1.process(stylable_1.safeParse(content, { from: fullpath }));
        }, {
            readFileSync: function (path) {
                var doc = docs.get(path);
                return doc.getText();
            },
            statSync: function (path) {
                var doc = docs.get(path);
                return {
                    mtime: new Date(doc.version)
                };
            }
        }), function () { }) || this;
        _this.docs = docs;
        return _this;
    }
    VsCodeResolver.prototype.resolveExtends = function (meta, className) {
        var extendPath = [];
        var resolvedClass = this.resolveClass(meta, meta.classes[className]);
        if (resolvedClass && resolvedClass._kind === 'css' && resolvedClass.symbol._kind === 'class') {
            var current = resolvedClass;
            var extend = resolvedClass.symbol[stylable_1.valueMapping.extends];
            while (current && extend) {
                extendPath.push(current);
                var res = this.resolve(extend);
                if (res && res._kind === 'css' && res.symbol._kind === 'class') {
                    current = res;
                    extend = resolvedClass.symbol[stylable_1.valueMapping.extends];
                }
                else {
                    break;
                }
            }
        }
        return extendPath;
    };
    return VsCodeResolver;
}(stylable_1.StylableResolver));
exports.VsCodeResolver = VsCodeResolver;
//# sourceMappingURL=vscode-resolver.js.map