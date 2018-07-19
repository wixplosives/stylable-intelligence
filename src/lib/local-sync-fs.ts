import { Directory, DirectoryContent, File, FileSystemReadSync, LocalFileSystem, ShallowDirectory } from 'kissfs'
import * as fs from 'fs';
import * as pathUtil from 'path';

export class LocalSyncFs extends LocalFileSystem implements FileSystemReadSync {
    loadTextFileSync(fullPath: string): string {
        return fs.readFileSync(fullPath).toString();
    }

    loadDirectoryTreeSync(fullPath: string): Directory {
        let dir: Directory = {
            name: '',
            fullPath: fullPath,
            children: [],
            type: 'dir'
        }

        dir = populate('', fullPath, dir)

        return dir;
        // return null as any;
    }

    loadDirectoryChildrenSync(fullPath: string): Array<File | ShallowDirectory> {
        return [];
    }

    loadDirectoryContentSync(fullPath?: string): DirectoryContent {
        return {};
    }
}

function populate(path: string, dirPath: string, dir: Directory): Directory {
    if (!path) {
        const list = fs.readdirSync(dirPath);
        list.forEach(path => { dir = populate(path, dirPath, dir) });
    } else if (fs.statSync(pathUtil.join(dirPath, path)).isFile()) {
        dir.children.push({
            name: path,
            // fullPath: (dirPath + '/' + path).replace('//', '/'),
            fullPath: pathUtil.join(dirPath, path),
            type: 'file'
        })
    }
    else if (fs.statSync(pathUtil.join(dirPath, path)).isDirectory()) {
        const list = fs.readdirSync(pathUtil.join(dirPath, path));
        list.forEach(p => { dir = populate(p, pathUtil.join(dirPath, path), dir) });
    }
    return dir;
}
