import { TextDocument } from 'vscode-languageserver';
export interface MinimalDocs {
    get: (uri: string) => TextDocument;
    keys: () => string[]
}
