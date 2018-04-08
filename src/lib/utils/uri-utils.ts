const isWindows = process.platform === 'win32';
export const fromVscodePath = (uri: string) => {
    if (uri.startsWith('file://')) {
        return isWindows ? uri.slice(8).replace('%3A', ':') : uri.slice(7)
    }
    return uri;
}
export const toVscodePath = (path: string): string => {
    if (path.startsWith('file://')) {
        return path;
    }
    return 'file://' + (isWindows ? `/${path.replace(/\\/g, '/').replace(':', '%3A')}` : path)
}
