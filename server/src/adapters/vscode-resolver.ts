'use strict';

import { workspace } from 'vscode';
import Provider, { ExtendedResolver, FsEntity } from '../provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');

const provider = new Provider();

export class VsCodeResolver extends Resolver implements ExtendedResolver {
    st: Stylesheet;
    resolveModule(filePath: string) {
        const globalPath: string = path.resolve(path.parse(this.st.source).dir, filePath);
        return super.resolveModule(globalPath);
    }
    resolveDependencies(stylesheet: Stylesheet): Thenable<void> {
        const promises: Thenable<any>[] = stylesheet.imports.map((importNode) => {
            const globalPath: string = path.resolve(path.parse(stylesheet.source).dir, importNode.from)
            return workspace.openTextDocument(globalPath)
                .then((doc) => {
                    if (_.endsWith(importNode.from, '.css')) {
                        this.add(globalPath, fromCSS(doc.getText()))
                    }
                })
        });
        return Promise.all(promises)
            .then(() => { })
    }
    resolveSymbols(s: Stylesheet) {
        this.st = s;
        return super.resolveSymbols(s);
    }
    getFolderContents(path: string) {
        const res: FsEntity[] = [];
        return Promise.resolve(res);
    }
}


