import { Resolver, Stylesheet, fromCSS } from 'stylable'
import StylableDotCompletionProvider, { Completion, snippet, ExtendedResolver, FsEntity } from '../src/provider';
import * as _ from 'lodash';
import { VsCodeResolver } from '../src/adapters/vscode-resolver'
import path = require('path');
import * as fs from 'fs';


export class TestResolver extends VsCodeResolver implements ExtendedResolver {
    resolveModule(filePath: string) {
        return super.resolveModule('projectRoot' + filePath.slice(1));
    }
    resolveDependencies(stylesheet: Stylesheet) {
        console.log('Starting Test resolveDependencies');
        stylesheet.imports.map((importNode) => {
            console.log('stylesheet.source: ', stylesheet.source)
            console.log('importNode.from: ', importNode.from)
            console.log('parsedPath: ', JSON.stringify(path.parse(stylesheet.source)))
            const globalPath: string = path.parse(stylesheet.source).dir + importNode.from.slice(1);
            console.log('globalPath: ', globalPath);
            // console.log('docs:', this.docs.keys());

            const txt = fs.readFileSync(globalPath).toString();

            if (_.endsWith(importNode.from, '.css')) {
                this.add(globalPath, fromCSS(txt))
            }
        });
        return Promise.resolve()



        // return Promise.resolve(null).then(()=>{});
    }

    // addExtraFiles(extrafiles:{[path:string]:string}){
    //     _.forEach(extrafiles,(file:string,fileName:string)=>{
    //         const fullPath:string = 'projectRoot/'+fileName
    //         this.add(fullPath,fromCSS(file,undefined,fullPath));
    //     })
    // }
    // getFolderContents(path:string):Thenable<FsEntity[]>{
    //     return Promise.resolve([]);
    // }
}
