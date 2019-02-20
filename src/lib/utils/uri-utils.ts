const isWindows = process.platform === 'win32';

export function fromVscodePath(uri: string): string {
    if (uri.startsWith('file://')) {
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
