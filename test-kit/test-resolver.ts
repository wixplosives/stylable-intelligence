import {Resolver,Stylesheet} from 'stylable'
import StylableDotCompletionProvider,{Completion,snippet,ExtendedResolver} from '../src/provider';
import * as _ from 'lodash';
export class TestResolver extends Resolver implements ExtendedResolver{
    resolveModule(filePath:string){
        return super.resolveModule('projectRoot'+filePath.slice(1));
    }
    resolveDependencies(s:Stylesheet){
        return Promise.resolve(null).then(()=>{});
    }
    addExtraFiles(extrafiles:{[path:string]:string}){
        _.forEach(extrafiles,(file:string,fileName:string)=>{
            const fullPath:string = 'projectRoot/'+fileName
            this.add(fullPath,Stylesheet.fromCSS(file,undefined,fullPath));
        })
    }
}
