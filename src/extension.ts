/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';


import { workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider ,TextDocument,Position,CancellationToken,CompletionItem,CompletionItemKind, Range,SnippetString} from 'vscode';
import Provider, { Completion,snippet ,ExtendedResolver} from './provider';
import {Resolver,Stylesheet} from 'stylable';
import * as _ from 'lodash';
import path = require('path');

const provider = new Provider();

class VsCodeResolver extends Resolver implements ExtendedResolver{
    st:Stylesheet;
    resolveModule(filePath:string){
        const globalPath:string = path.resolve(path.parse(this.st.source).dir,filePath);
        return super.resolveModule(globalPath);
    }
    resolveDependencies(stylesheet:Stylesheet):Thenable<void>{
        const promises:Thenable<any>[] = stylesheet.imports.map((importNode)=>{
            const globalPath:string = path.resolve(path.parse(stylesheet.source).dir,importNode.from)
            return workspace.openTextDocument(globalPath)
            .then((doc)=>{
                if(_.endsWith(importNode.from,'.css')){
                    this.add(globalPath,Stylesheet.fromCSS(doc.getText()))
                }
            })
        });
        return Promise.all(promises)
        .then(()=>{})
    }
    resolveSymbols(s:Stylesheet){
        this.st = s;
        return super.resolveSymbols(s);
    }
}

const resolver = new VsCodeResolver({});
export class StylableDotCompletionProvider implements CompletionItemProvider {
    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken | null): Thenable<CompletionItem[]> {
        const src = document.getText();
        return provider.provideCompletionItemsFromSrc(src,{line:position.line, character:position.character},document.fileName,resolver).then((res)=>{
            return res.map((com:Completion)=>{
                let vsCodeCompletion = new CompletionItem(com.label);
                vsCodeCompletion.detail = com.detail;
                if(typeof com.insertText==='string'){
                    vsCodeCompletion.insertText = com.insertText;
                }else if(com.insertText){
                    const a: SnippetString = new SnippetString(com.insertText.source);

                    vsCodeCompletion.insertText = a;

                }
                vsCodeCompletion.sortText = com.sortText;
                return vsCodeCompletion;
            })
        })
    }

}

export function activate(context: ExtensionContext) {
	context.subscriptions.push(languages.registerCompletionItemProvider('css',new StylableDotCompletionProvider(),'.','-',':'));
}
