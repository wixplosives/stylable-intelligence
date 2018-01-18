import { LocalFileSystem, FileSystemReadSync, Directory, ShallowDirectory, File, DirectoryContent } from 'kissfs'
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

   loadDirectoryContentSync(fullPath?: string): DirectoryContent {
       return {};
   }
}
