export const fromVscodePath = (uri: string) => {
    if (uri.startsWith('file://')) {
        return process.platform === 'win32' ? uri.slice(8).replace('%3A', ':') : uri.slice(7)
    }
    return uri;
};
export const toVscodePath = (path: string): string => {
    if (path.startsWith('file://')) {
        return path;
    }
    return 'file://' + (process.platform === 'win32' ? `/${path.replace(/\\/g, '/').replace(':', '%3A')}` : path)
};


const UriPrefix = 'file://';

export const fromUrl = (uri: string) => {
    return uri.slice(UriPrefix.length).replace('%3A', ':');
};
export const toUrl = (path: string): string => {
    return UriPrefix + path.replace(':', '%3A');
};

export const posixToLocalPath = (path: string) => {
    return process.platform === 'win32' ? '/' + path.replace(/\\/g, '/') : path;
};
export const localPathToPosix = (path: string): string => {
    return process.platform === 'win32' ?  path.slice(1).replace(/\//g, '\\') : path;
};
