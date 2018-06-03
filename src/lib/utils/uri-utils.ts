
const UriPrefix = 'file://';

// TODO: convert implementation to `localPathToPosix(fromUrl(uri))` and fix all failing tests
export const fromVscodePath = (uri: string) => {
    if (uri.startsWith('file://')) {
        return localPathToPosix(fromUrl(uri));
    }
    return uri;
};

// TODO: convert implementation to `toUrl(posixToLocalPath(path))` and fix all failing tests
export const toVscodePath  = (path: string) => {
    if (path.startsWith('file://')) {
        return path;
    }
    return toUrl(posixToLocalPath(path));
};

export const fromUrl = (uri: string) => {
    return uri.slice(UriPrefix.length).replace('%3A', ':');
};
export const toUrl = (path: string): string => {
    return UriPrefix + path.replace(':', '%3A');
};

export const localPathToPosix  = (path: string) => {
    return process.platform === 'win32' ? '/' + path.replace(/\\/g, '/') : path;
};
export const posixToLocalPath = (path: string): string => {
    return process.platform === 'win32' ?  path.slice(1).replace(/\//g, '\\') : path;
};
