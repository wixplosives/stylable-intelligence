import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver';

export class TestDocuments extends TextDocuments<TextDocument> {
    /*
        by using this class we assume that the documents are synced
    */
    constructor(private _docs: Record<string, TextDocument>) {
        super(TextDocument);
    }
    public keys(): string[] {
        return Object.keys(this._docs);
    }
    public get(uri: string): TextDocument | undefined {
        return this._docs[uri];
    }
}
