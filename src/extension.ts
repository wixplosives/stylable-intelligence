/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';


import { workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider ,TextDocument,Position,CancellationToken,CompletionItem,CompletionItemKind, Range,SnippetString} from 'vscode';
import Provider, { Completion,snippet } from './provider';


const provider = new Provider()
export class StylableDotCompletionProvider implements CompletionItemProvider {
    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken | null): Thenable<CompletionItem[]> {
        const src = document.getText();
        return provider.provideCompletionItemsFromSrc(src,{line:position.line, character:position.character}).then((res)=>{
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
