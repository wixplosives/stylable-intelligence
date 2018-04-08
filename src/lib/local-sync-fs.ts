import {Directory, DirectoryContent, File, FileSystemReadSync, LocalFileSystem, ShallowDirectory} from 'kissfs'
import * as fs from 'fs';
import * as path from 'path';

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
        const pathSeparator = '/';
        let rootPath = path.join(this.baseUrl, fullPath);
        let pathPrefix = fullPath ? (fullPath + pathSeparator) : fullPath;
        const directoryChildren = fs.readdirSync(rootPath);

        const processedChildren = directoryChildren.map(item => {
            const itemPath = pathPrefix + item;
            let itemAbsolutePath = path.join(rootPath, item);
            const itemStats = fs.statSync(itemAbsolutePath);
            if (itemStats.isDirectory()) {
                return new ShallowDirectory(item, itemPath);
            } else if (itemStats.isFile()) {
                return new File(item, itemPath);
            } else {
                console.warn(`Unknown node type at ${itemAbsolutePath}`);
                return null;
            }
        });

        return processedChildren.filter((i): i is File | ShallowDirectory => i !== null);
    }

    loadDirectoryContentSync(fullPath?: string): DirectoryContent {
        return {};
    }
}
