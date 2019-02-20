import { Directory, DirectoryContent, File, FileSystemReadSync, LocalFileSystem, ShallowDirectory } from 'kissfs';
import fs from 'fs';

export class LocalSyncFs extends LocalFileSystem implements FileSystemReadSync {
    public loadTextFileSync(fullPath: string): string {
        return fs.readFileSync(fullPath).toString();
    }

    public loadDirectoryTreeSync(fullPath: string = '/'): Directory {
        let dir: Directory = {
            name: '',
            fullPath,
            children: [],
            type: 'dir'
        };

        dir = populate('', fullPath, dir);

        return dir;
        // return null as any;
    }

    public loadDirectoryChildrenSync(fullPath: string): Array<File | ShallowDirectory> {
        return [];
    }

    public loadDirectoryContentSync(fullPath?: string): DirectoryContent {
        return {};
    }
}

function populate(path: string, dirPath: string, dir: Directory): Directory {
    if (!path) {
        const list = fs.readdirSync(dirPath);
        list.forEach(path => {
            dir = populate(path, dirPath, dir);
        });
    } else if (fs.statSync(dirPath + '/' + path).isFile()) {
        dir.children.push({
            name: path,
            fullPath: (dirPath + '/' + path).replace('//', '/'),
            type: 'file'
        });
    } else if (fs.statSync(dirPath + '/' + path).isDirectory()) {
        const list = fs.readdirSync(dirPath + '/' + path);
        list.forEach(p => {
            dir = populate(p, dirPath + '/' + path, dir);
        });
    }
    return dir;
}
