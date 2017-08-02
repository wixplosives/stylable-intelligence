'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const provider_1 = require("../provider");
const stylable_1 = require("stylable");
const _ = require("lodash");
const path = require("path");
const provider = new provider_1.default();
class VsCodeResolver extends stylable_1.Resolver {
    resolveModule(filePath) {
        const globalPath = path.resolve(path.parse(this.st.source).dir, filePath);
        return super.resolveModule(globalPath);
    }
    resolveDependencies(stylesheet) {
        const promises = stylesheet.imports.map((importNode) => {
            const globalPath = path.resolve(path.parse(stylesheet.source).dir, importNode.from);
            return vscode_1.workspace.openTextDocument(globalPath)
                .then((doc) => {
                if (_.endsWith(importNode.from, '.css')) {
                    this.add(globalPath, stylable_1.fromCSS(doc.getText()));
                }
            });
        });
        return Promise.all(promises)
            .then(() => { });
    }
    resolveSymbols(s) {
        this.st = s;
        return super.resolveSymbols(s);
    }
    getFolderContents(path) {
        const res = [];
        return Promise.resolve(res);
    }
}
exports.VsCodeResolver = VsCodeResolver;
//# sourceMappingURL=vscode-resolver.js.map