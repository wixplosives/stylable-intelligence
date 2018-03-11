import {Directory, DirectoryContent, File, FileSystemReadSync, LocalFileSystem, ShallowDirectory} from 'kissfs'
import * as fs from 'fs';

export class LocalSyncFs extends LocalFileSystem implements FileSystemReadSync {
    loadTextFileSync(fullPath: string): string {
        try {
            return fs.readFileSync(fullPath).toString();
        } catch (e) {
            return '';
        }

    }

    loadDirectoryTreeSync(fullPath?: string): Directory {
        return null as any;
    }

    loadDirectoryChildrenSync(fullPath: string): Array<File | ShallowDirectory> {
        return [];
    }

    loadDirectoryContentSync(fullPath?: string): DirectoryContent {
        return {};
    }
}
