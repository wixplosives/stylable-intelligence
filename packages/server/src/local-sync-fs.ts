import { LocalFileSystem, FileSystemReadSync, Directory, ShallowDirectory, File } from 'kissfs'
import * as fs from 'fs';

export class LocalSyncFs extends LocalFileSystem implements FileSystemReadSync {
    loadTextFileSync(fullPath: string): string {
        return fs.readFileSync(fullPath).toString();
    }

    loadDirectoryTreeSync(fullPath?: string): Directory {
        return null as any;
    }

    loadDirectoryChildrenSync(fullPath: string): Array<File | ShallowDirectory> {
        return [];
    }
}
