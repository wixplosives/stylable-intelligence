'use strict';
import { TextDocument } from 'vscode-languageserver';
import  { ExtendedResolver, FsEntity } from '../provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');



export class VsCodeResolver extends Resolver implements ExtendedResolver {
    constructor(private docs: {get: (uri: string) => TextDocument, keys: () => string[]}) {
        super({});
    }

    st: Stylesheet;
    resolveModule(filePath: string) {
        console.log('RESOLVEMODULE:',filePath)
        const globalPath: string = path.resolve(path.parse(this.st.source).dir, filePath);
        this.add(globalPath, this.docs.get(globalPath).getText());
        return super.resolveModule(globalPath);
    }

    resolveDependencies(stylesheet: Stylesheet): Thenable<void> {
        console.log('Starting resolveDependencies');
        stylesheet.imports.map((importNode) => {
            console.log('stylesheet.source: ', stylesheet.source)
            console.log('importNode.from: ', importNode.from)
            console.log('parsedPath: ', JSON.stringify(path.parse(stylesheet.source)))
            const globalPath: string = path.parse(stylesheet.source).dir + importNode.from.slice(1);
            console.log('globalPath: ', globalPath);
            console.log('docs:', this.docs.keys());

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
