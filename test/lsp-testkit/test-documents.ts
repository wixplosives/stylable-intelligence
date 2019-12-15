import { TextDocument } from 'vscode-languageserver-protocol';
import { TextDocuments } from 'vscode-languageserver';
export class TestDocuments extends TextDocuments {
    /*
        by using this class we assume that the documents are synced
    */
    constructor(private _docs: Record<string, TextDocument>) {
        super();
    }
    public keys() {
        return Object.keys(this._docs);
    }
    public get(uri: string) {
        return this._docs[uri];
    }
}
