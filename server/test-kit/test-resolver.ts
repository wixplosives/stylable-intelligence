import {Resolver,Stylesheet,fromCSS} from 'stylable'
import StylableDotCompletionProvider,{Completion,snippet,ExtendedResolver,FsEntity} from '../src/provider';
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
            this.add(fullPath,fromCSS(file,undefined,fullPath));
        })
    }
    getFolderContents(path:string):Thenable<FsEntity[]>{
        return Promise.resolve([]);
    }
}
