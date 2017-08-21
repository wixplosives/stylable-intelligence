'use strict';
import { TextDocument } from 'vscode-languageserver';
import  { ExtendedResolver, FsEntity } from '../provider';
import { StylableMeta, createGenerator, createMinimalFS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');



export class VsCodeResolver extends Resolver implements ExtendedResolver {
    constructor(private docs: {get: (uri: string) => TextDocument, keys: () => string[]}) {
        super({});
        const gen = createGenerator(createMinimalFS({files: {}}).fs)
    }

    st: Stylesheet;
    resolveModule(filePath: string) {
        console.log('RESOLVEMODULE:',filePath)
        const globalPath: string = path.resolve(path.parse(this.st.source).dir, filePath);
        this.add(globalPath, this.docs.get(globalPath).getText());
        return super.resolveModule(globalPath);
    }

    resolveDependencies(meta: StylableMeta): Thenable<void> {
        meta.imports.map((importNode) => {
            const globalPath: string = path.parse(meta.source).dir + importNode.from.slice(1);

            const txt = this.docs.get(globalPath).getText();

            if (_.endsWith(importNode.from, '.css')) {
                this.add(globalPath, fromCSS(txt))
            }
        });
        return Promise.resolve()
    };
    resolveSymbols(s: Stylesheet) {
        this.st = s;
        return super.resolveSymbols(s);
    }
    getFolderContents(path: string) {
        const res: FsEntity[] = [];
        return Promise.resolve(res);
    }
}
