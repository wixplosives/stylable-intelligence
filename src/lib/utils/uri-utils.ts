
const UriPrefix = 'file://';

// TODO: convert implementation to `posixToLocalPath(fromUrl(uri))` and fix all failing tests
export const fromVscodePath = (uri: string) => {
    if (uri.startsWith('file://')) {
        return posixToLocalPath(fromUrl(uri));
    }
    return uri;
};

// TODO: convert implementation to `toUrl(localPathToPosix(path))` and fix all failing tests
export const toVscodePath  = (path: string) => {
    if (path.startsWith('file://')) {
        return path;
    }
    return toUrl(localPathToPosix(path));
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

/*
function isAbsoluteWn32(fp:string ) {
    if (/[a-zA-Z]/.test(fp.charAt(0)) && fp.charAt(1) === ':' && fp.charAt(2) === '\\') {
        return true;
    }
    // Microsoft Azure absolute filepath
    if (fp.slice(0, 2) === '\\\\') {
        return true;
    }
    return /^[\\\/]{2,}[^\\\/]+[\\\/]+[^\\\/]+/.test(fp) || /^([a-zA-Z]:)?[\\\/]/.test(fp);
}
*/
