const isWindows = process.platform === 'win32';

export function fromVscodePath(uri: string): string { // TODO: Remove me, replace with Location
    if (uri.startsWith('file://')) {
        console.warn(new Error('this code path is legacy').stack);
        return isWindows
            ? uri
                  .slice(8)
                  .replace('%3A', ':')
                  .replace(/\//g, '\\')
            : uri.slice(7);
    }
    return uri;
}

export function toVscodePath(path: string): string {
    if (path.startsWith('file://')) {
        return path;
    }
    return 'file://' + (isWindows ? `/${path.replace(/\\/g, '/').replace(':', '%3A')}` : path);
}
