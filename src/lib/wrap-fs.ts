import { IBaseFileSystemSyncActions, IFileSystem, ReadFileOptions } from '@file-services/types';
import { TextDocuments } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import type { TextDocument } from 'vscode-languageserver-textdocument';

export function wrapFs(fs: IFileSystem, docs: TextDocuments<TextDocument>): IFileSystem {
    const readFileSync = ((path: string, ...args: [ReadFileOptions]) =>
        docs.get(URI.file(path).toString())?.getText() ??
        fs.readFileSync(path, ...args)) as IBaseFileSystemSyncActions['readFileSync'];
    return { ...fs, readFileSync };
}
