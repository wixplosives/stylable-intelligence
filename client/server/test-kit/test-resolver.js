"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var stylable_1 = require("stylable");
var _ = require("lodash");
var TestResolver = (function (_super) {
    tslib_1.__extends(TestResolver, _super);
    function TestResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestResolver.prototype.resolveModule = function (filePath) {
        return _super.prototype.resolveModule.call(this, 'projectRoot' + filePath.slice(1));
    };
    TestResolver.prototype.resolveDependencies = function (s) {
        return Promise.resolve(null).then(function () { });
    };
    TestResolver.prototype.addExtraFiles = function (extrafiles) {
        var _this = this;
        _.forEach(extrafiles, function (file, fileName) {
            var fullPath = 'projectRoot/' + fileName;
            _this.add(fullPath, stylable_1.fromCSS(file, undefined, fullPath));
        });
    };
    TestResolver.prototype.getFolderContents = function (path) {
        return Promise.resolve([]);
    };
    return TestResolver;
}(stylable_1.Resolver));
exports.TestResolver = TestResolver;
//# sourceMappingURL=test-resolver.js.map