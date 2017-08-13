'use strict';
import { Readable } from 'stream';
import { TextDocuments, IConnection } from 'vscode-languageserver';
import {NotificationMessage} from 'vscode-jsonrpc';
import Provider, { ExtendedResolver, FsEntity } from '../provider';
import { Resolver, Stylesheet, fromCSS } from 'stylable';
import * as _ from 'lodash';
import path = require('path');
import * as fs from 'fs';


const provider = new Provider();

export class VsCodeResolver extends Resolver implements ExtendedResolver {
    constructor(private connection: IConnection, private docs: TextDocuments) {
        super({});
    }

    st: Stylesheet;
    resolveModule(filePath: string) {
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
            // const globalPath: string = path.resolve(path.parse(stylesheet.source).dir, importNode.from)
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
