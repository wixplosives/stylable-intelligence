const isWindows = process.platform === 'win32';
export const fileUriToNativePath = (uri: string) => isWindows ? uri.slice(8).replace('%3A', ':') : uri.slice(7);
export const nativePathToFileUri = (path: string): string => 'file://' + (isWindows ? `/${path.replace(/\\/g, '/').replace(':', '%3A')}` : path)
