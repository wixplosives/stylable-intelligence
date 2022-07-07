export default {
  pinnedPackages: [
    { name: 'vscode-languageclient', reason: 'drops support for node v12' },
    { name: 'vscode-languageserver', reason: 'drops support for node v12' },
    { name: 'vscode-languageserver-protocol', reason: 'drops support for node v12' },
    { name: '@types/vscode', reason: 'minimal supported version of vscode api' },
  ],
};
