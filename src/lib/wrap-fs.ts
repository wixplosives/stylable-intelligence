import { IBaseFileSystemSyncActions, IFileSystem, ReadFileOptions } from '@file-services/types';
import { TextDocuments, TextDocument } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export function wrapFs(fs: IFileSystem, docs: TextDocuments<TextDocument>): IFileSystem {
    const readFileSync = ((path: string, ...args: [ReadFileOptions]) => {
        const file = docs.get(URI.file(path).toString());
        return file ? file.getText() : fs.readFileSync(path, ...args);
    }) as IBaseFileSystemSyncActions['readFileSync'];
    return { ...fs, readFileSync };
}
